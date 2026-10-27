import { getWeatherCondition } from '../lib/weatherCodes';
import type {
  City,
  CurrentWeather,
  ForecastDay,
  WeatherData,
} from '../types/weather';

const GEOCODING_ENDPOINT = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_ENDPOINT = 'https://api.open-meteo.com/v1/forecast';

export type WeatherServiceErrorKind = 'api' | 'invalid-response' | 'network' | 'timeout';

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
  };
}

function mapForecastDay(
  date: string,
  daily: Record<string, unknown>,
  index: number,
): ForecastDay {
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

export async function searchCities(name: string): Promise<City[]> {
  const query = name.trim();
  if (!query) return [];

  const url =
    `${GEOCODING_ENDPOINT}?name=${encodeURIComponent(query)}` +
    '&count=10&language=pt&format=json';

  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    throw new WeatherServiceError('Falha de rede.', 'network');
  }

  if (!response.ok) {
    throw new WeatherServiceError('Falha ao buscar cidades.', 'api');
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new WeatherServiceError('Resposta inválida da busca de cidades.', 'invalid-response');
  }

  if (!isRecord(payload) || payload.error === true) {
    throw new WeatherServiceError('Resposta inválida da busca de cidades.', 'invalid-response');
  }
  if (payload.results === undefined) return [];
  if (!Array.isArray(payload.results)) {
    throw new WeatherServiceError('Resposta inválida da busca de cidades.', 'invalid-response');
  }

  return payload.results.map(mapCity);
}

export async function getWeather(city: City): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    current:
      'temperature_2m,apparent_temperature,weather_code,relative_humidity_2m,wind_speed_10m',
    daily: 'weather_code,temperature_2m_min,temperature_2m_max,precipitation_probability_max',
    temperature_unit: 'celsius',
    wind_speed_unit: 'kmh',
    timezone: 'auto',
    forecast_days: '5',
  });

  let response: Response;
  try {
    response = await fetch(`${FORECAST_ENDPOINT}?${params}`);
  } catch {
    throw new WeatherServiceError('Falha de rede.', 'network');
  }

  if (!response.ok) {
    throw new WeatherServiceError('Falha ao consultar o clima.', 'api');
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new WeatherServiceError('Resposta inválida da previsão.', 'invalid-response');
  }

  if (
    !isRecord(payload) ||
    payload.error === true ||
    typeof payload.timezone !== 'string' ||
    !isRecord(payload.current) ||
    !isRecord(payload.daily)
  ) {
    throw new WeatherServiceError('Resposta incompleta da previsão.', 'invalid-response');
  }

  const daily = payload.daily;
  const dates = daily.time;
  if (!Array.isArray(dates) || dates.length < 5) {
    throw new WeatherServiceError('Resposta incompleta da previsão.', 'invalid-response');
  }
  const forecastDates = dates.slice(0, 5);
  if (!forecastDates.every((date): date is string => typeof date === 'string')) {
    throw new WeatherServiceError('Resposta incompleta da previsão.', 'invalid-response');
  }

  return {
    city,
    timezone: payload.timezone,
    current: mapCurrent(payload.current),
    forecast: forecastDates.map((date, index) => mapForecastDay(date, daily, index)),
  };
}
