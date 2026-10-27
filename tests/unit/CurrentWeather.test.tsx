import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import CurrentWeather from '../../src/components/CurrentWeather';
import { weatherFixture } from '../../src/fixtures/weather';

describe('CurrentWeather', () => {
  it('converte temperatura e sensação sem alterar métricas ou fixture', () => {
    const { rerender } = render(
      <CurrentWeather city={weatherFixture.city} current={weatherFixture.current} unit="celsius" />,
    );
    expect(screen.getByText('22,4 °C')).toBeVisible();
    expect(screen.getByText('Sensação térmica: 23,1 °C')).toBeVisible();
    rerender(
      <CurrentWeather
        city={weatherFixture.city}
        current={weatherFixture.current}
        unit="fahrenheit"
      />,
    );
    expect(screen.getByText('72,3 °F')).toBeVisible();
    expect(screen.getByText('Sensação térmica: 73,6 °F')).toBeVisible();
    for (const value of ['64%', '12,5 km/h', '0 mm', '1.013,2 hPa']) {
      expect(screen.getByText(value)).toBeVisible();
    }
    expect(weatherFixture.current?.temperatureC).toBe(22.4);
  });

  it('identifica seções e métricas ausentes sem fabricar valores', () => {
    const { rerender } = render(<CurrentWeather city={null} current={null} unit="celsius" />);
    expect(screen.getByRole('heading', { name: /Localização atual/ })).toBeVisible();
    expect(screen.getByText('Clima atual indisponível para este local.')).toBeVisible();
    if (!weatherFixture.current) throw new Error('Fixture sem clima atual');
    rerender(
      <CurrentWeather
        city={null}
        current={{ ...weatherFixture.current, precipitationMm: null, pressureHpa: undefined }}
        unit="celsius"
      />,
    );
    expect(screen.getAllByText('Indisponível')).toHaveLength(2);
  });
});
