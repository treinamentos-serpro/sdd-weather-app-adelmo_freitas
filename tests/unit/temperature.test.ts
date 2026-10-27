import { describe, expect, it } from 'vitest';
import { convertTemperature, formatTemperature } from '../../src/lib/temperature';

describe('conversão e apresentação de temperatura', () => {
  it.each([
    [0, 32],
    [100, 212],
    [-40, -40],
  ])('converte %s °C para %s °F', (celsius, fahrenheit) => {
    expect(convertTemperature(celsius, 'fahrenheit')).toBe(fahrenheit);
  });

  it('mantém Celsius e não arredonda o valor usado no modelo', () => {
    expect(convertTemperature(22.46, 'celsius')).toBe(22.46);
  });

  it('arredonda a apresentação para uma casa decimal e inclui a unidade', () => {
    expect(formatTemperature(22.46, 'celsius')).toBe('22,5 °C');
    expect(formatTemperature(0, 'fahrenheit')).toBe('32 °F');
  });
});
