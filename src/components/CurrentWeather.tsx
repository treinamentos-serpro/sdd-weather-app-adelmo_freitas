import { useId } from 'react';
import { formatNumber } from '../lib/format';
import { formatTemperature } from '../lib/temperature';
import { getWeatherCondition } from '../lib/weatherCodes';
import type { City, CurrentWeather as CurrentWeatherData, Unit } from '../types/weather';

interface CurrentWeatherProps {
  city: City | null;
  current: CurrentWeatherData | null;
  unit: Unit;
}

export default function CurrentWeather({ city, current, unit }: CurrentWeatherProps) {
  const headingId = useId();
  const location = city
    ? [city.name, city.admin1, city.country].filter(Boolean).join(', ')
    : 'Localização atual';

  return (
    <section
      aria-labelledby={headingId}
      className="min-w-0 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-glass backdrop-blur-md sm:p-8"
    >
      <h2 id={headingId} className="break-words text-xl font-semibold text-white sm:text-2xl">
        Clima atual · {location}
      </h2>
      {current ? (
        <>
          <div className="mt-6 flex flex-wrap items-center gap-4 sm:gap-6">
            <span aria-hidden="true" className="text-6xl text-sun">
              {getWeatherCondition(current.weatherCode).icon}
            </span>
            <p className="text-5xl font-bold tracking-tight text-white sm:text-7xl">
              {formatTemperature(current.temperatureC, unit)}
            </p>
          </div>
          <p className="mt-4 text-xl text-slate-100">
            {current.condition || getWeatherCondition(current.weatherCode).description}
          </p>
          <p className="mt-2 text-slate-300">
            Sensação térmica: {formatTemperature(current.apparentTemperatureC, unit)}
          </p>
          <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              ['Umidade', `${formatNumber(current.relativeHumidityPercent)}%`],
              ['Vento', `${formatNumber(current.windSpeedKmh)} km/h`],
              [
                'Precipitação',
                current.precipitationMm == null
                  ? 'Indisponível'
                  : `${formatNumber(current.precipitationMm)} mm`,
              ],
              [
                'Pressão',
                current.pressureHpa == null
                  ? 'Indisponível'
                  : `${formatNumber(current.pressureHpa)} hPa`,
              ],
            ].map(([label, value]) => (
              <div key={label} className="min-w-0">
                <dt className="text-sm text-slate-300">{label}</dt>
                <dd className="mt-1 break-words font-semibold text-white">{value}</dd>
              </div>
            ))}
          </dl>
        </>
      ) : (
        <p className="mt-4 text-slate-300">Clima atual indisponível para este local.</p>
      )}
    </section>
  );
}
