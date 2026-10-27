import { formatDay, formatNumber } from '../lib/format';
import { formatTemperature } from '../lib/temperature';
import { getWeatherCondition } from '../lib/weatherCodes';
import type { ForecastDay, Unit } from '../types/weather';

interface ForecastCardProps {
  day: ForecastDay;
  unit: Unit;
}

export default function ForecastCard({ day, unit }: ForecastCardProps) {
  const { weatherCode, minTemperatureC, maxTemperatureC, precipitationProbabilityPercent } = day;
  const complete =
    day.available &&
    weatherCode !== null &&
    minTemperatureC !== null &&
    maxTemperatureC !== null &&
    precipitationProbabilityPercent !== null;

  return (
    <article className="h-full min-w-0 rounded-2xl border border-white/10 bg-white/5 p-4 text-center backdrop-blur-md">
      <h3 className="font-semibold text-slate-100">
        <time dateTime={day.date}>{formatDay(day.date)}</time>
      </h3>
      {complete ? (
        <>
          <span aria-hidden="true" className="my-4 block text-4xl text-sun">
            {getWeatherCondition(weatherCode).icon}
          </span>
          <p className="min-h-12 text-sm text-slate-200">
            {day.condition || getWeatherCondition(weatherCode).description}
          </p>
          <dl className="mt-3 space-y-2 text-sm">
            <div>
              <dt className="text-slate-300">Máxima</dt>
              <dd className="font-semibold text-white">
                {formatTemperature(maxTemperatureC, unit)}
              </dd>
            </div>
            <div>
              <dt className="text-slate-300">Mínima</dt>
              <dd className="text-slate-100">{formatTemperature(minTemperatureC, unit)}</dd>
            </div>
            <div>
              <dt className="text-slate-300">Chance de chuva</dt>
              <dd className="text-accent-400">{formatNumber(precipitationProbabilityPercent)}%</dd>
            </div>
          </dl>
        </>
      ) : (
        <p className="mt-4 text-sm text-slate-300">Previsão indisponível para este dia.</p>
      )}
    </article>
  );
}
