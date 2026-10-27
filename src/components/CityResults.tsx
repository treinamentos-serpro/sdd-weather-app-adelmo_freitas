import { useId } from 'react';
import type { City } from '../types/weather';

interface CityResultsProps {
  cities: City[];
  onSelectCity: (city: City) => void;
}

export default function CityResults({ cities, onSelectCity }: CityResultsProps) {
  const headingId = useId();

  return (
    <section
      aria-labelledby={headingId}
      className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md"
    >
      <h2 id={headingId} className="mb-3 text-xl font-semibold text-white">
        Selecione uma cidade
      </h2>
      <ul className="space-y-2">
        {cities.map((city) => {
          const location = [city.admin1, city.country].filter(Boolean).join(', ');
          const label = [city.name, location].filter(Boolean).join(', ');

          return (
            <li key={city.id}>
              <button
                type="button"
                aria-label={`Selecionar ${label}`}
                onClick={() => onSelectCity(city)}
                className="flex min-h-11 w-full flex-col items-start justify-center rounded-xl border border-white/10 bg-night-800/70 px-4 py-2 text-left transition-colors hover:border-accent-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
              >
                <span className="font-semibold text-white">{city.name}</span>
                {location && <span className="text-sm text-slate-300">{location}</span>}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
