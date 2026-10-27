import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import useWeather from '../../src/hooks/useWeather';
import type { City, WeatherData } from '../../src/types/weather';

const serviceMocks = vi.hoisted(() => ({
  getWeather: vi.fn(),
  searchCities: vi.fn(),
}));

vi.mock('../../src/services/weatherService', () => ({
  getWeather: serviceMocks.getWeather,
  searchCities: serviceMocks.searchCities,
  WeatherServiceError: class WeatherServiceError extends Error {},
}));

const city: City = {
  id: 1,
  name: 'São Paulo',
  country: 'Brasil',
  latitude: -23.5,
  longitude: -46.6,
};

const weather: WeatherData = {
  city,
  timezone: 'America/Sao_Paulo',
  current: null,
  forecast: [],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useWeather', () => {
  it('inicia em idle e busca cidades sem selecionar automaticamente', async () => {
    serviceMocks.searchCities.mockResolvedValue([city]);
    const { result } = renderHook(() => useWeather());

    expect(result.current.status).toBe('idle');
    await act(async () => {
      await result.current.search('  São Paulo  ');
    });

    expect(serviceMocks.searchCities).toHaveBeenCalledWith(
      'São Paulo',
      expect.any(AbortSignal),
    );
    expect(serviceMocks.getWeather).not.toHaveBeenCalled();
    expect(result.current).toMatchObject({
      status: 'success',
      cities: [city],
      data: null,
      query: 'São Paulo',
    });
  });

  it('não chama services para busca vazia e distingue resultado vazio', async () => {
    const { result } = renderHook(() => useWeather());

    await act(async () => {
      await result.current.search('   ');
    });
    expect(serviceMocks.searchCities).not.toHaveBeenCalled();
    expect(result.current).toMatchObject({
      status: 'idle',
      error: 'Digite o nome de uma cidade.',
      query: '',
    });

    serviceMocks.searchCities.mockResolvedValue([]);
    await act(async () => {
      await result.current.search('Atlantis');
    });
    expect(result.current.status).toBe('empty');
  });

  it('carrega o clima somente após selecionar uma cidade', async () => {
    serviceMocks.getWeather.mockResolvedValue(weather);
    const { result } = renderHook(() => useWeather());

    await act(async () => {
      await result.current.selectCity(city);
    });

    expect(serviceMocks.getWeather).toHaveBeenCalledWith(city, expect.any(AbortSignal));
    expect(result.current).toMatchObject({ status: 'success', data: weather });
  });

  it('retry refaz a operação de busca que falhou', async () => {
    serviceMocks.searchCities
      .mockRejectedValueOnce(new Error('Falha temporária.'))
      .mockResolvedValueOnce([city]);
    const { result } = renderHook(() => useWeather());

    await act(async () => {
      await result.current.search('Recife');
    });
    expect(result.current).toMatchObject({ status: 'error', error: 'Falha temporária.' });

    await act(async () => {
      await result.current.retry();
    });

    expect(serviceMocks.searchCities).toHaveBeenCalledTimes(2);
    expect(result.current).toMatchObject({ status: 'success', cities: [city] });
  });

  it('retry refaz a última consulta de clima que falhou', async () => {
    serviceMocks.getWeather
      .mockRejectedValueOnce(new Error('Falha temporária.'))
      .mockResolvedValueOnce(weather);
    const { result } = renderHook(() => useWeather());

    await act(async () => {
      await result.current.selectCity(city);
    });
    expect(result.current).toMatchObject({ status: 'error', error: 'Falha temporária.' });

    await act(async () => {
      await result.current.retry();
    });

    expect(serviceMocks.getWeather).toHaveBeenCalledTimes(2);
    expect(result.current).toMatchObject({ status: 'success', data: weather });
  });

  it('ignora respostas de uma operação substituída', async () => {
    let resolveFirst: (cities: City[]) => void = () => {};
    serviceMocks.searchCities
      .mockImplementationOnce(
        () =>
          new Promise<City[]>((resolve) => {
            resolveFirst = resolve;
          }),
      )
      .mockResolvedValueOnce([city]);
    const { result } = renderHook(() => useWeather());

    let firstRequest: Promise<void> | undefined;
    await act(async () => {
      firstRequest = result.current.search('Antiga');
      await result.current.search('Atual');
    });
    resolveFirst([]);
    await act(async () => {
      await firstRequest;
    });

    await waitFor(() => expect(result.current.cities).toEqual([city]));
    expect(result.current.query).toBe('Atual');
  });
});
