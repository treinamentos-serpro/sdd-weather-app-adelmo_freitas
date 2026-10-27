import { describe, expect, it } from 'vitest';
import { weatherFixture } from '../../src/fixtures/weather';

describe('fixture de clima', () => {
  it('oferece uma cidade, clima atual e cinco datas consecutivas fixas', () => {
    expect(weatherFixture.city?.name).toBe('São Paulo');
    expect(weatherFixture.current?.temperatureC).toBe(22.4);
    expect(weatherFixture.forecast.map((day) => day.date)).toEqual([
      '2026-10-27',
      '2026-10-28',
      '2026-10-29',
      '2026-10-30',
      '2026-10-31',
    ]);
    expect(weatherFixture.forecast.every((day) => day.available)).toBe(true);
  });
});
