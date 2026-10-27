import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getWeather,
  searchCities,
  WeatherServiceError,
} from '../../src/services/weatherService';
import type { City } from '../../src/types/weather';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('searchCities', () => {
  it('retorna lista vazia sem chamar a rede para nomes vazios', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(searchCities('   ')).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('codifica o nome e mapeia os resultados para City', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          results: [
            {
              id: 1,
              name: 'São João-d’Oeste',
              admin1: 'São Paulo',
              country: 'Brasil',
              country_code: 'BR',
              latitude: -23.5,
              longitude: -46.6,
              timezone: 'America/Sao_Paulo',
            },
          ],
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(searchCities(' São João-d’Oeste ')).resolves.toEqual([
      {
        id: 1,
        name: 'São João-d’Oeste',
        admin1: 'São Paulo',
        country: 'Brasil',
        countryCode: 'BR',
        latitude: -23.5,
        longitude: -46.6,
        timezone: 'America/Sao_Paulo',
      },
    ]);
    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain('name=S%C3%A3o%20Jo%C3%A3o-d%E2%80%99Oeste');
    expect(new URL(url).searchParams.get('name')).toBe('São João-d’Oeste');
    expect(url).toContain('count=10&language=pt&format=json');
  });

  it('permite resultados sem os campos opcionais e retorna lista vazia quando não há locais', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            results: [
              {
                id: 2,
                name: 'Recife',
                country: 'Brasil',
                latitude: -8.05,
                longitude: -34.9,
              },
            ],
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(searchCities('Recife')).resolves.toEqual([
      { id: 2, name: 'Recife', country: 'Brasil', latitude: -8.05, longitude: -34.9 },
    ]);
    await expect(searchCities('Atlantis')).resolves.toEqual([]);
  });

  it('lança WeatherServiceError em resposta HTTP não-ok ou payload inválido', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ results: 'inválido' }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const httpError = searchCities('Recife');
    await expect(httpError).rejects.toMatchObject({
      name: 'WeatherServiceError',
      kind: 'api',
    });
    await expect(httpError).rejects.toBeInstanceOf(WeatherServiceError);
    await expect(searchCities('Recife')).rejects.toMatchObject({ kind: 'invalid-response' });
  });
});

describe('getWeather', () => {
  const city: City = {
    id: 1,
    name: 'São Paulo',
    country: 'Brasil',
    latitude: -23.5,
    longitude: -46.6,
  };
  const dates = [
    '2026-10-27',
    '2026-10-28',
    '2026-10-29',
    '2026-10-30',
    '2026-10-31',
  ];

  it('envia os parâmetros de forecast e mapeia clima atual e cinco dias', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          timezone: 'America/Sao_Paulo',
          current: {
            time: '2026-10-27T14:00',
            temperature_2m: 22.4,
            apparent_temperature: 23.1,
            weather_code: 2,
            relative_humidity_2m: 64,
            wind_speed_10m: 12.5,
          },
          daily: {
            time: dates,
            weather_code: [2, 61, 3, 0, 1],
            temperature_2m_min: [17.2, 18, 19, 16, 17],
            temperature_2m_max: [25.1, 24.3, 26, 23, 24],
            precipitation_probability_max: [10, 70, 0, 5, 15],
          },
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await getWeather(city);

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url] = fetchMock.mock.calls[0] as [string];
    const params = new URL(url).searchParams;
    expect(params.get('latitude')).toBe('-23.5');
    expect(params.get('longitude')).toBe('-46.6');
    expect(params.get('current')).toContain('temperature_2m');
    expect(params.get('daily')).toContain('precipitation_probability_max');
    expect(params.get('temperature_unit')).toBe('celsius');
    expect(params.get('wind_speed_unit')).toBe('kmh');
    expect(params.get('timezone')).toBe('auto');
    expect(params.get('forecast_days')).toBe('5');
    expect(result.city).toEqual(city);
    expect(result.timezone).toBe('America/Sao_Paulo');
    expect(result.current).toEqual({
      time: '2026-10-27T14:00',
      temperatureC: 22.4,
      apparentTemperatureC: 23.1,
      weatherCode: 2,
      condition: 'Parcialmente nublado',
      relativeHumidityPercent: 64,
      windSpeedKmh: 12.5,
    });
    expect(result.forecast).toHaveLength(5);
    expect(result.forecast[0]).toMatchObject({
      date: dates[0],
      available: true,
      condition: 'Parcialmente nublado',
      minTemperatureC: 17.2,
      maxTemperatureC: 25.1,
      precipitationProbabilityPercent: 10,
    });
  });

  it('marca campos diários ausentes como indisponíveis e não fabrica valores', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            timezone: 'UTC',
            current: {},
            daily: {
              time: dates,
              weather_code: [0],
              temperature_2m_min: [null],
              temperature_2m_max: [20],
              precipitation_probability_max: [null],
            },
          }),
          { status: 200 },
        ),
      ),
    );

    const result = await getWeather(city);

    expect(result.current).toBeNull();
    expect(result.forecast[0]).toMatchObject({
      available: false,
      weatherCode: 0,
      minTemperatureC: null,
      maxTemperatureC: 20,
      precipitationProbabilityPercent: null,
    });
    expect(result.forecast[1].weatherCode).toBeNull();
  });

  it('lança WeatherServiceError quando current ou daily estão ausentes', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ timezone: 'UTC', daily: { time: dates } }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ timezone: 'UTC', current: {} }), { status: 200 }),
      );
    vi.stubGlobal('fetch', fetchMock);

    await expect(getWeather(city)).rejects.toMatchObject({
      name: 'WeatherServiceError',
      kind: 'invalid-response',
      message: 'Resposta incompleta da previsão.',
    });
    await expect(getWeather(city)).rejects.toBeInstanceOf(WeatherServiceError);
  });
});

describe('fetchWithTimeout', () => {
  it('converte AbortError em timeout após 10 segundos e limpa o timer', async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url: string, init?: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () => {
              reject(new DOMException('Aborted', 'AbortError'));
            });
          }),
      ),
    );

    const request = searchCities('Recife');
    const timeoutAssertion = expect(request).rejects.toMatchObject({
      message: 'A requisição demorou demais.',
      kind: 'timeout',
    });
    await vi.advanceTimersByTimeAsync(10_000);

    await timeoutAssertion;
    expect(vi.getTimerCount()).toBe(0);
  });

  it('converte falha de rede e limpa o timer após falha ou resposta', async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('offline'))
      .mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(searchCities('Recife')).rejects.toMatchObject({
      message: 'Falha de rede.',
      kind: 'network',
    });
    expect(vi.getTimerCount()).toBe(0);

    await expect(searchCities('Recife')).resolves.toEqual([]);
    expect(vi.getTimerCount()).toBe(0);
  });
});
