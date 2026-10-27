import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ForecastList from '../../src/components/ForecastList';
import { weatherFixture } from '../../src/fixtures/weather';
import type { ForecastDay } from '../../src/types/weather';

describe('ForecastList', () => {
  it('exibe cinco dias com datas, condições e valores nas duas unidades', () => {
    const { rerender } = render(<ForecastList forecast={weatherFixture.forecast} unit="celsius" />);
    expect(screen.getAllByRole('listitem')).toHaveLength(5);
    const first = screen.getAllByRole('article')[0];
    expect(within(first).getByRole('heading', { name: /27\/10/ })).toBeVisible();
    expect(within(first).getByText('25,1 °C')).toBeVisible();
    expect(within(first).getByText('17,2 °C')).toBeVisible();
    expect(within(first).getByText('Parcialmente nublado')).toBeVisible();
    rerender(<ForecastList forecast={weatherFixture.forecast} unit="fahrenheit" />);
    expect(within(first).getByText('77,2 °F')).toBeVisible();
    expect(within(first).getByText('63 °F')).toBeVisible();
    expect(within(first).getByText('10%')).toBeVisible();
    expect(screen.queryByText(/°C/)).not.toBeInTheDocument();
  });

  it('não inventa valores em dias incompletos nem oculta os demais', () => {
    const day: ForecastDay = {
      date: '2026-10-27',
      available: false,
      weatherCode: null,
      condition: null,
      minTemperatureC: null,
      maxTemperatureC: null,
      precipitationProbabilityPercent: null,
    };
    render(<ForecastList forecast={[day, ...weatherFixture.forecast.slice(1)]} unit="celsius" />);
    expect(screen.getAllByRole('article')).toHaveLength(5);
    const first = screen.getAllByRole('article')[0];
    expect(within(first).getByText('Previsão indisponível para este dia.')).toBeVisible();
    expect(within(first).queryByText(/°C|%/)).not.toBeInTheDocument();
    expect(screen.getByText('24,3 °C')).toBeVisible();
  });

  it('informa ausência da previsão', () => {
    render(<ForecastList forecast={[]} unit="celsius" />);
    expect(screen.getByText('Previsão indisponível para este local.')).toBeVisible();
  });
});
