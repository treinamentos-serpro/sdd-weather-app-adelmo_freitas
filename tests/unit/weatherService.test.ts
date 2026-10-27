import { afterEach, describe, expect, it, vi } from 'vitest';
import { searchCities, WeatherServiceError } from '../../src/services/weatherService';

afterEach(() => {
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
