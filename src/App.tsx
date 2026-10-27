import { useState } from 'react';
import CurrentWeather from './components/CurrentWeather';
import DemoControls from './components/DemoControls';
import ForecastList from './components/ForecastList';
import SearchBar from './components/SearchBar';
import EmptyState from './components/states/EmptyState';
import ErrorState from './components/states/ErrorState';
import LoadingState from './components/states/LoadingState';
import UnitToggle from './components/UnitToggle';
import useWeatherDemo from './hooks/useWeatherDemo';
import type { Unit } from './types/weather';

export default function App() {
  const [unit, setUnit] = useState<Unit>('celsius');
  const { status, data, search, retry, preview } = useWeatherDemo();

  return (
    <div className="min-h-screen bg-gradient-to-br from-night-900 via-night-800 to-night-900 text-slate-100">
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
          <SearchBar onSearch={search} disabled={status === 'loading'} />
          <UnitToggle unit={unit} onChange={setUnit} />
        </div>
      </header>
      <main id="main-content" className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        <DemoControls status={status} onChange={preview} />
        {status === 'idle' && (
          <EmptyState
            title="Como está o clima por aí?"
            hint="Busque São Paulo para explorar o exemplo. Outras cidades não possuem dados nesta demo."
          />
        )}
        {status === 'loading' && <LoadingState />}
        {status === 'empty' && (
          <EmptyState hint="Esta demo só contém São Paulo. Busque esse nome para ver o clima de exemplo." />
        )}
        {status === 'error' && (
          <ErrorState
            message="Falha simulada para testar a interface. Tente novamente para carregar os dados de exemplo."
            onRetry={retry}
          />
        )}
        {data && (
          <>
            <CurrentWeather city={data.city} current={data.current} unit={unit} />
            <ForecastList forecast={data.forecast} unit={unit} />
          </>
        )}
      </main>
      <footer className="px-4 pb-8 text-center text-sm text-slate-300">
        Protótipo de UI · Sem consultas meteorológicas reais.
      </footer>
    </div>
  );
}
