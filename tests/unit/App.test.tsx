import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App';

const city = {
  id: 1,
  name: 'São Paulo',
  admin1: 'São Paulo',
  country: 'Brasil',
  country_code: 'BR',
  latitude: -23.5,
  longitude: -46.6,
  timezone: 'America/Sao_Paulo',
};

const forecast = {
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
    time: ['2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31'],
    weather_code: [2, 61, 3, 0, 1],
    temperature_2m_min: [17.2, 18, 19, 16, 17],
    temperature_2m_max: [25.1, 24.3, 26, 23, 24],
    precipitation_probability_max: [10, 70, 0, 5, 15],
  },
};

function search(name: string) {
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: name } });
  fireEvent.submit(screen.getByRole('search'));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('App com Open-Meteo', () => {
  it('busca cidades, exige seleção explícita e exibe previsão em ambas as unidades', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ results: [city] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(forecast), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Como está o clima por aí?' })).toBeVisible();
    search('São Paulo');
    await screen.findByRole('button', { name: 'Selecionar São Paulo, São Paulo, Brasil' });
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(screen.queryByText('22,4 °C')).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'Selecionar São Paulo, São Paulo, Brasil' }),
    );
    await waitFor(() => expect(screen.getByText('22,4 °C')).toBeVisible());
    expect(screen.getAllByRole('article')).toHaveLength(5);

    fireEvent.click(screen.getByRole('button', { name: 'Fahrenheit' }));
    expect(screen.getByText('72,3 °F')).toBeVisible();
    expect(screen.queryByText(/\d.*°C/)).not.toBeInTheDocument();

    search('Recife');
    await screen.findByRole('heading', { name: 'Nenhuma cidade encontrada' });
    expect(screen.queryByText('72,3 °F')).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('comunica erro da API e permite retry mantendo a unidade selecionada', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ results: [city] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(forecast), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Fahrenheit' }));
    search('São Paulo');
    expect(await screen.findByRole('alert')).toHaveTextContent('O serviço está indisponível');

    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    fireEvent.click(
      await screen.findByRole('button', { name: 'Selecionar São Paulo, São Paulo, Brasil' }),
    );
    await waitFor(() => expect(screen.getByText('72,3 °F')).toBeVisible());
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('permite retry manual quando a consulta de forecast falha', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ results: [city] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(forecast), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    render(<App />);

    search('São Paulo');
    fireEvent.click(
      await screen.findByRole('button', { name: 'Selecionar São Paulo, São Paulo, Brasil' }),
    );
    expect(await screen.findByRole('alert')).toHaveTextContent('O serviço está indisponível');

    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    await waitFor(() => expect(screen.getByText('22,4 °C')).toBeVisible());
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1][0]).toContain('/v1/forecast');
    expect(fetchMock.mock.calls[2][0]).toContain('/v1/forecast');
  });

  it('mantém homônimos distinguíveis e consulta somente a cidade selecionada', async () => {
    const illinois = {
      ...city,
      id: 2,
      name: 'Springfield',
      admin1: 'Illinois',
      country: 'Estados Unidos',
      latitude: 39.8,
      longitude: -89.6,
    };
    const ohio = {
      ...illinois,
      id: 3,
      admin1: 'Ohio',
      latitude: 39.96,
      longitude: -83,
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ results: [illinois, ohio] }), { status: 200 }),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify(forecast), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    render(<App />);

    search('Springfield');
    expect(
      await screen.findByRole('button', {
        name: 'Selecionar Springfield, Illinois, Estados Unidos',
      }),
    ).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Selecionar Springfield, Ohio, Estados Unidos' }),
    ).toBeVisible();
    expect(fetchMock).toHaveBeenCalledOnce();

    fireEvent.click(
      screen.getByRole('button', { name: 'Selecionar Springfield, Ohio, Estados Unidos' }),
    );
    await waitFor(() =>
      expect(
        screen.getByRole('heading', {
          name: 'Clima atual · Springfield, Ohio, Estados Unidos',
        }),
      ).toBeVisible(),
    );
    expect(new URL(fetchMock.mock.calls[1][0] as string).searchParams.get('latitude')).toBe(
      '39.96',
    );
  });

  it('valida busca vazia sem chamar a rede', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    render(<App />);

    search('   ');

    expect(screen.getByRole('alert')).toHaveTextContent('Digite o nome de uma cidade.');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
