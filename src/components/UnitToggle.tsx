import type { Unit } from '../types/weather';

interface UnitToggleProps {
  unit: Unit;
  onChange: (unit: Unit) => void;
}

export default function UnitToggle({ unit, onChange }: UnitToggleProps) {
  return (
    <div
      role="group"
      aria-label="Unidade de temperatura"
      className="inline-flex shrink-0 gap-1 self-start rounded-xl border border-white/10 bg-white/5 p-1 backdrop-blur-md"
    >
      {(['celsius', 'fahrenheit'] as const).map((value) => (
        <button
          key={value}
          type="button"
          aria-label={value === 'celsius' ? 'Celsius' : 'Fahrenheit'}
          aria-pressed={unit === value}
          onClick={() => onChange(value)}
          className={`min-h-11 min-w-11 rounded-lg px-3 font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400 ${
            unit === value ? 'bg-accent-400 text-night-900' : 'text-slate-200 hover:bg-white/10'
          }`}
        >
          {value === 'celsius' ? '°C' : '°F'}
        </button>
      ))}
    </div>
  );
}
