import { useEffect, useRef, useState } from 'react';
import {
  getWeather,
  getWeatherForCoordinates,
  searchCities,
  WeatherServiceError,
} from '../services/weatherService';
import type { City, WeatherData } from '../types/weather';

export type WeatherStatus = 'idle' | 'loading' | 'success' | 'error' | 'empty';

interface WeatherState {
  status: WeatherStatus;
  data: WeatherData | null;
  cities: City[];
  error: string | null;
  query: string;
}

type Operation =
  | { kind: 'search'; name: string }
  | { kind: 'select'; city: City }
  | { kind: 'location' };

function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocalização não suportada.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10_000 });
  });
}

function getLocationErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    if (error.code === 1) {
      return 'A permissão de localização foi negada. Você ainda pode buscar uma cidade.';
    }
    if (error.code === 2) {
      return 'Não foi possível determinar sua localização. Tente novamente ou busque uma cidade.';
    }
    if (error.code === 3) {
      return 'A solicitação de localização demorou demais. Tente novamente ou busque uma cidade.';
    }
  }
  return 'Não foi possível acessar a localização neste navegador. Use a busca manual.';
}

function getErrorMessage(error: unknown): string {
  if (error instanceof WeatherServiceError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Ocorreu um erro inesperado ao carregar o clima.';
}

export default function useWeather() {
  const [state, setState] = useState<WeatherState>({
    status: 'idle',
    data: null,
    cities: [],
    error: null,
    query: '',
  });
  const requestId = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const lastOperation = useRef<Operation | null>(null);

  useEffect(
    () => () => {
      requestId.current += 1;
      controller.current?.abort();
    },
    [],
  );

  function beginRequest() {
    controller.current?.abort();
    const nextController = new AbortController();
    controller.current = nextController;
    requestId.current += 1;
    return { id: requestId.current, signal: nextController.signal };
  }

  async function search(name: string): Promise<void> {
    const query = name.trim();
    if (!query) {
      controller.current?.abort();
      requestId.current += 1;
      setState({
        status: 'idle',
        data: null,
        cities: [],
        error: 'Digite o nome de uma cidade.',
        query: '',
      });
      return;
    }

    lastOperation.current = { kind: 'search', name: query };
    const request = beginRequest();
    setState({ status: 'loading', data: null, cities: [], error: null, query });

    try {
      const cities = await searchCities(query, request.signal);
      if (request.id !== requestId.current) return;
      setState({
        status: cities.length ? 'success' : 'empty',
        data: null,
        cities,
        error: null,
        query,
      });
    } catch (error) {
      if (request.id !== requestId.current) return;
      setState({
        status: 'error',
        data: null,
        cities: [],
        error: getErrorMessage(error),
        query,
      });
    }
  }

  async function selectCity(city: City): Promise<void> {
    lastOperation.current = { kind: 'select', city };
    const request = beginRequest();
    setState((current) => ({
      ...current,
      status: 'loading',
      data: null,
      error: null,
    }));

    try {
      const data = await getWeather(city, request.signal);
      if (request.id !== requestId.current) return;
      setState((current) => ({ ...current, status: 'success', data, error: null }));
    } catch (error) {
      if (request.id !== requestId.current) return;
      setState((current) => ({
        ...current,
        status: 'error',
        data: null,
        error: getErrorMessage(error),
      }));
    }
  }

  async function locate(): Promise<void> {
    lastOperation.current = { kind: 'location' };
    const request = beginRequest();
    setState((current) => ({
      ...current,
      status: 'loading',
      data: null,
      cities: [],
      error: null,
    }));

    let position: GeolocationPosition;
    try {
      position = await getCurrentPosition();
    } catch (error) {
      if (request.id !== requestId.current) return;
      setState((current) => ({
        ...current,
        status: 'error',
        data: null,
        error: getLocationErrorMessage(error),
      }));
      return;
    }

    if (request.id !== requestId.current) return;
    try {
      const data = await getWeatherForCoordinates(
        position.coords.latitude,
        position.coords.longitude,
        request.signal,
      );
      if (request.id !== requestId.current) return;
      setState((current) => ({ ...current, status: 'success', data, error: null }));
    } catch (error) {
      if (request.id !== requestId.current) return;
      setState((current) => ({
        ...current,
        status: 'error',
        data: null,
        error: getErrorMessage(error),
      }));
    }
  }

  async function retry(): Promise<void> {
    const operation = lastOperation.current;
    if (!operation) return;
    if (operation.kind === 'search') {
      await search(operation.name);
    } else if (operation.kind === 'location') {
      await locate();
    } else {
      await selectCity(operation.city);
    }
  }

  return {
    ...state,
    search,
    selectCity,
    locate,
    retry,
  };
}
