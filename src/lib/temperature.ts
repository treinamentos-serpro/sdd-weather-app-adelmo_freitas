import type { Unit } from '../types/weather';
import { formatNumber } from './format';

export function convertTemperature(celsius: number, unit: Unit): number {
  return unit === 'fahrenheit' ? (celsius * 9) / 5 + 32 : celsius;
}

export function formatTemperature(celsius: number, unit: Unit): string {
  return `${formatNumber(convertTemperature(celsius, unit))} ${unit === 'celsius' ? '°C' : '°F'}`;
}
