import { describe, expect, it } from 'vitest';
import { formatDay, formatNumber } from '../../src/lib/format';
import { convertTemperature, formatTemperature } from '../../src/lib/temperature';
import { getWeatherCondition } from '../../src/lib/weatherCodes';

describe('helpers meteorológicos', () => {
  it.each([
    [0, 32],
    [-40, -40],
    [22.4, 72.32],
  ])('converte %s °C sem arredondar o modelo', (celsius, fahrenheit) => {
    expect(convertTemperature(celsius, 'fahrenheit')).toBeCloseTo(fahrenheit);
    expect(convertTemperature(celsius, 'celsius')).toBe(celsius);
  });

  it('formata números e unidades em pt-BR', () => {
    expect(formatNumber(12.5)).toBe('12,5');
    expect(formatTemperature(22.4, 'fahrenheit')).toBe('72,3 °F');
  });

  it('preserva a data-calendário inclusive na virada do ano', () => {
    expect(formatDay('2026-12-31')).toContain('31/12');
    expect(formatDay('2027-01-01')).toContain('01/01');
  });

  it.each([
    0, 1, 2, 3, 45, 48, 51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86,
    95, 96, 99,
  ])('traduz o código WMO %s', (code) => {
    expect(getWeatherCondition(code).description).not.toBe('Condição indisponível');
    expect(getWeatherCondition(code).icon).toBeTruthy();
  });

  it('oferece uma condição neutra para código desconhecido', () => {
    expect(getWeatherCondition(999).description).toBe('Condição indisponível');
  });
});
