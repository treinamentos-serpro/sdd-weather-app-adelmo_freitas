import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import CurrentWeather from '../../src/components/CurrentWeather';
import UnitToggle from '../../src/components/UnitToggle';
import type { CurrentWeather as CurrentWeatherData, Unit } from '../../src/types/weather';

const current: CurrentWeatherData = {
  time: '2026-10-27T14:00',
  temperatureC: 0,
  apparentTemperatureC: 0,
  weatherCode: 0,
  condition: 'Céu limpo',
  relativeHumidityPercent: 50,
  windSpeedKmh: 5,
};

function WeatherWithUnitToggle() {
  const [unit, setUnit] = useState<Unit>('celsius');

  return (
    <>
      <UnitToggle unit={unit} onChange={setUnit} />
      <CurrentWeather city={null} current={current} unit={unit} />
    </>
  );
}

describe('conversão de unidade na apresentação', () => {
  it('converte clima atual de 0 °C para 32 °F ao selecionar Fahrenheit', async () => {
    const user = userEvent.setup();
    render(<WeatherWithUnitToggle />);

    expect(screen.getByText('0 °C')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Fahrenheit' }));

    expect(screen.getByText('32 °F')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Fahrenheit' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByText('5 km/h')).toBeVisible();
  });
});
