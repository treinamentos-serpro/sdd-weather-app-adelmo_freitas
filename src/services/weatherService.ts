import type { City } from '../types/weather';

const GEOCODING_ENDPOINT = 'https://geocoding-api.open-meteo.com/v1/search';

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
