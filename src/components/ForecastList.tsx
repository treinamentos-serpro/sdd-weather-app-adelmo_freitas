import { useId } from 'react';
import type { ForecastDay, Unit } from '../types/weather';
import ForecastCard from './ForecastCard';

interface ForecastListProps {
  forecast: ForecastDay[];
  unit: Unit;
}

export default function ForecastList({ forecast, unit }: ForecastListProps) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className="min-w-0">
      <h2 id={headingId} className="mb-4 text-xl font-semibold text-white">
        Previsão de 5 dias
      </h2>
      {forecast.length ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
          {forecast.map((day) => (
            <li key={day.date} className="min-w-0">
              <ForecastCard day={day} unit={unit} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-slate-300">Previsão indisponível para este local.</p>
      )}
    </section>
  );
}
