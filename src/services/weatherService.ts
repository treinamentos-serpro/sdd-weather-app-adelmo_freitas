import { getWeatherCondition } from '../lib/weatherCodes';
import type { City, CurrentWeather, ForecastDay, WeatherData } from '../types/weather';

const GEOCODING_ENDPOINT = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_ENDPOINT = 'https://api.open-meteo.com/v1/forecast';
const REQUEST_TIMEOUT_MS = 10_000;

export type WeatherServiceErrorKind = 'api' | 'invalid-response' | 'network' | 'timeout';

const ERROR_MESSAGES: Record<WeatherServiceErrorKind, string> = {
  api: 'O serviço está indisponível no momento. Tente novamente.',
  'invalid-response': 'O serviço retornou dados inválidos. Tente novamente.',
  network: 'Não foi possível conectar. Verifique sua conexão e tente novamente.',
  timeout: 'A consulta excedeu o limite de 10 segundos. Verifique sua conexão e tente novamente.',
};

export class WeatherServiceError extends Error {
  constructor(
    message: string,
    readonly kind: WeatherServiceErrorKind,
  ) {
    super(message);
    this.name = 'WeatherServiceError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function optionalNumber(value: unknown): number | null {
  return isFiniteNumber(value) ? value : null;
}

function isAbortError(error: unknown): boolean {
  return isRecord(error) && error.name === 'AbortError';
}

export async function fetchWithTimeout<T>(
  request: (signal: AbortSignal) => Promise<T>,
  signal?: AbortSignal,
): Promise<T> {
  const controller = new AbortController();
  const abortRequest = () => controller.abort(signal?.reason);
  if (signal?.aborted) {
    abortRequest();
  } else {
    signal?.addEventListener('abort', abortRequest, { once: true });
  }

  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await request(controller.signal);
  } catch (error) {
    if (error instanceof WeatherServiceError) throw error;
    if (isAbortError(error)) {
      throw new WeatherServiceError(ERROR_MESSAGES.timeout, 'timeout');
    }
    throw new WeatherServiceError(ERROR_MESSAGES.network, 'network');
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener('abort', abortRequest);
  }
}

function mapCurrent(value: unknown): CurrentWeather | null {
  if (
    !isRecord(value) ||
    typeof value.time !== 'string' ||
    !isFiniteNumber(value.temperature_2m) ||
    !isFiniteNumber(value.apparent_temperature) ||
    !isFiniteNumber(value.weather_code) ||
    !isFiniteNumber(value.relative_humidity_2m) ||
    !isFiniteNumber(value.wind_speed_10m)
  ) {
    return null;
  }

  return {
    time: value.time,
    temperatureC: value.temperature_2m,
    apparentTemperatureC: value.apparent_temperature,
    weatherCode: value.weather_code,
    condition: getWeatherCondition(value.weather_code).description,
    relativeHumidityPercent: value.relative_humidity_2m,
    windSpeedKmh: value.wind_speed_10m,
    precipitationMm: optionalNumber(value.precipitation),
    pressureHpa: optionalNumber(value.surface_pressure),
  };
}

function mapForecastDay(date: string, daily: Record<string, unknown>, index: number): ForecastDay {
  const weatherCode = Array.isArray(daily.weather_code)
    ? optionalNumber(daily.weather_code[index])
    : null;
  const minTemperatureC = Array.isArray(daily.temperature_2m_min)
    ? optionalNumber(daily.temperature_2m_min[index])
    : null;
  const maxTemperatureC = Array.isArray(daily.temperature_2m_max)
    ? optionalNumber(daily.temperature_2m_max[index])
    : null;
  const precipitationProbabilityPercent = Array.isArray(daily.precipitation_probability_max)
    ? optionalNumber(daily.precipitation_probability_max[index])
    : null;
  const available =
    weatherCode !== null &&
    minTemperatureC !== null &&
    maxTemperatureC !== null &&
    precipitationProbabilityPercent !== null;

  return {
    date,
    available,
    weatherCode,
    condition: weatherCode === null ? null : getWeatherCondition(weatherCode).description,
    minTemperatureC,
    maxTemperatureC,
    precipitationProbabilityPercent,
  };
}

function mapCity(value: unknown): City {
  if (
    !isRecord(value) ||
    !isFiniteNumber(value.id) ||
    typeof value.name !== 'string' ||
    typeof value.country !== 'string' ||
    !isFiniteNumber(value.latitude) ||
    !isFiniteNumber(value.longitude) ||
    (value.admin1 !== undefined && typeof value.admin1 !== 'string') ||
    (value.country_code !== undefined && typeof value.country_code !== 'string') ||
    (value.timezone !== undefined && typeof value.timezone !== 'string')
  ) {
    throw new WeatherServiceError('Resposta inválida da busca de cidades.', 'invalid-response');
  }

  return {
    id: value.id,
    name: value.name,
    country: value.country,
    latitude: value.latitude,
    longitude: value.longitude,
    ...(typeof value.admin1 === 'string' ? { admin1: value.admin1 } : {}),
    ...(typeof value.country_code === 'string' ? { countryCode: value.country_code } : {}),
    ...(typeof value.timezone === 'string' ? { timezone: value.timezone } : {}),
  };
}

export async function searchCities(name: string, signal?: AbortSignal): Promise<City[]> {
  const query = name.trim();
  if (!query) return [];

  const url = `${GEOCODING_ENDPOINT}?name=${encodeURIComponent(query)}&count=5&language=pt&format=json`;

  const { response, payload } = await fetchWithTimeout(async (requestSignal) => {
    const response = await fetch(url, { signal: requestSignal });
    if (!response.ok) return { response, payload: null };
    try {
      return { response, payload: (await response.json()) as unknown };
    } catch (error) {
      if (isAbortError(error)) throw error;
      throw new WeatherServiceError('Resposta inválida da busca de cidades.', 'invalid-response');
    }
  }, signal);

  if (!response.ok) {
    throw new WeatherServiceError(ERROR_MESSAGES.api, 'api');
  }

  if (!isRecord(payload) || payload.error === true) {
    throw new WeatherServiceError(ERROR_MESSAGES['invalid-response'], 'invalid-response');
  }
  if (payload.results === undefined) return [];
  if (!Array.isArray(payload.results)) {
    throw new WeatherServiceError(ERROR_MESSAGES['invalid-response'], 'invalid-response');
  }

  return payload.results.map(mapCity);
}

export async function getWeather(city: City, signal?: AbortSignal): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    current:
      'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,surface_pressure,precipitation,weather_code',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
    temperature_unit: 'celsius',
    wind_speed_unit: 'kmh',
    timezone: 'auto',
    forecast_days: '5',
  });

  const { response, payload } = await fetchWithTimeout(async (requestSignal) => {
    const response = await fetch(`${FORECAST_ENDPOINT}?${params}`, { signal: requestSignal });
    if (!response.ok) return { response, payload: null };
    try {
      return { response, payload: (await response.json()) as unknown };
    } catch (error) {
      if (isAbortError(error)) throw error;
      throw new WeatherServiceError('Resposta inválida da previsão.', 'invalid-response');
    }
  }, signal);

  if (!response.ok) {
    throw new WeatherServiceError(ERROR_MESSAGES.api, 'api');
  }

  if (
    !isRecord(payload) ||
    payload.error === true ||
    typeof payload.timezone !== 'string' ||
    !isRecord(payload.current) ||
    !isRecord(payload.daily)
  ) {
    throw new WeatherServiceError(ERROR_MESSAGES['invalid-response'], 'invalid-response');
  }

  const daily = payload.daily;
  const dates = daily.time;
  if (!Array.isArray(dates) || dates.length < 5) {
    throw new WeatherServiceError(ERROR_MESSAGES['invalid-response'], 'invalid-response');
  }
  const forecastDates = dates.slice(0, 5);
  if (!forecastDates.every((date): date is string => typeof date === 'string')) {
    throw new WeatherServiceError(ERROR_MESSAGES['invalid-response'], 'invalid-response');
  }

  return {
    city,
    timezone: payload.timezone,
    current: mapCurrent(payload.current),
    forecast: forecastDates.map((date, index) => mapForecastDay(date, daily, index)),
  };
}
