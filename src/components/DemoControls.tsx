import { useId } from 'react';
import type { DemoStatus } from '../hooks/useWeatherDemo';

interface DemoControlsProps {
  status: DemoStatus;
  onChange: (status: DemoStatus) => void;
}

const states: { value: DemoStatus; label: string }[] = [
  { value: 'idle', label: 'Inicial' },
  { value: 'loading', label: 'Carregando' },
  { value: 'empty', label: 'Sem resultados' },
  { value: 'error', label: 'Erro' },
  { value: 'success', label: 'Sucesso' },
];

export default function DemoControls({ status, onChange }: DemoControlsProps) {
  const id = useId();
  return (
    <aside
      aria-label="Controles de demonstração"
      className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200"
    >
      <p>Demo sem API · Dados fictícios de São Paulo, de 27 a 31/10/2026.</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label htmlFor={id}>Simular estado</label>
        <select
          id={id}
          value={status}
          onChange={(event) => {
            const selected = states.find((state) => state.value === event.target.value);
            if (selected) onChange(selected.value);
          }}
          className="min-h-11 max-w-full rounded-lg border border-white/20 bg-night-800 px-3 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
        >
          {states.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
    </aside>
  );
}
