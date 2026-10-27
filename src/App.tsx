import { useEffect, useRef, useState } from 'react';
import CityResults from './components/CityResults';
import CurrentWeather from './components/CurrentWeather';
import ForecastList from './components/ForecastList';
import SearchBar from './components/SearchBar';
import EmptyState from './components/states/EmptyState';
import ErrorState from './components/states/ErrorState';
import LoadingState from './components/states/LoadingState';
import UnitToggle from './components/UnitToggle';
import useWeather from './hooks/useWeather';
import type { Unit } from './types/weather';

const UNIT_STORAGE_KEY = 'weather-unit';

function isStorageError(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === 'QuotaExceededError' || error.name === 'SecurityError')
  );
}

function getStoredUnit(): Unit {
  try {
    return window.localStorage.getItem(UNIT_STORAGE_KEY) === 'fahrenheit'
      ? 'fahrenheit'
      : 'celsius';
  } catch (error) {
    if (isStorageError(error)) return 'celsius';
    throw error;
  }
}

export default function App() {
  const [unit, setUnit] = useState<Unit>(getStoredUnit);
  const { status, data, cities, error, search, selectCity, locate, retry } = useWeather();
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(UNIT_STORAGE_KEY, unit);
    } catch (error) {
      if (!isStorageError(error)) throw error;
    }
  }, [unit]);

  useEffect(() => {
    if (status === 'success') mainRef.current?.focus();
  }, [status]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-night-900 via-night-800 to-night-900 text-slate-100">
      <a
        href="#main-content"
        className="sr-only z-10 rounded-lg bg-accent-400 px-4 py-3 font-semibold text-night-900 focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        Pular para o conteúdo
      </a>
      <header className="border-b border-white/10 bg-night-900/80">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:items-end">
          <div className="shrink-0">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              <span aria-hidden="true" className="mr-2 text-sun">
                ☀
              </span>
              WeatherView
            </h1>
            <p className="mt-1 text-sm text-slate-300">Seu dia, com mais clareza.</p>
          </div>
          <SearchBar onSearch={search} onLocate={locate} disabled={status === 'loading'} />
          <UnitToggle unit={unit} onChange={setUnit} />
        </div>
      </header>
      <main
        ref={mainRef}
        id="main-content"
        tabIndex={-1}
        aria-busy={status === 'loading'}
        className="mx-auto max-w-6xl space-y-6 px-4 py-8 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-400 sm:px-6"
      >
        {status === 'idle' && (
          <EmptyState
            title="Como está o clima por aí?"
            hint="Busque uma cidade para consultar o clima atual e a previsão dos próximos cinco dias."
          />
        )}
        {status === 'loading' && <LoadingState />}
        {status === 'empty' && <EmptyState />}
        {status === 'error' && (
          <ErrorState message={error ?? 'Não foi possível carregar o clima.'} onRetry={retry} />
        )}
        {status === 'success' && !data && cities.length > 0 && (
          <CityResults cities={cities} onSelectCity={selectCity} />
        )}
        {data && (
          <>
            <p role="status" className="sr-only">
              Consulta de clima de {data.city?.name ?? 'sua localização'} concluída. Consulte
              abaixo a disponibilidade dos dados atuais e da previsão.
            </p>
            <CurrentWeather city={data.city} current={data.current} unit={unit} />
            <ForecastList forecast={data.forecast} unit={unit} />
          </>
        )}
      </main>
      <footer className="px-4 pb-8 text-center text-sm text-slate-300">
        Dados meteorológicos fornecidos pela Open-Meteo.
      </footer>
    </div>
  );
}
