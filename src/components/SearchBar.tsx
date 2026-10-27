import { useId, useRef, useState } from 'react';

interface SearchBarProps {
  onSearch: (city: string) => void;
  onLocate?: () => void;
  disabled?: boolean;
}

export default function SearchBar({ onSearch, onLocate, disabled = false }: SearchBarProps) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [city, setCity] = useState('');
  const [error, setError] = useState('');

  return (
    <form
      role="search"
      aria-label="Buscar cidade"
      className="w-full min-w-0"
      onSubmit={(event) => {
        event.preventDefault();
        if (disabled) return;
        const query = city.trim();
        if (!query) {
          setError('Digite o nome de uma cidade.');
          inputRef.current?.focus();
          return;
        }
        setError('');
        onSearch(query);
      }}
    >
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-slate-200">
        Cidade
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          ref={inputRef}
          id={id}
          type="search"
          value={city}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(event) => {
            setCity(event.target.value);
            setError('');
          }}
          placeholder="Ex.: São Paulo"
          autoComplete="address-level2"
          className="min-h-11 w-full min-w-0 rounded-xl border border-white/20 bg-white/5 px-4 text-white backdrop-blur-md placeholder:text-slate-400 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400 disabled:cursor-not-allowed disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={disabled}
          className="min-h-11 rounded-xl bg-accent-400 px-5 font-semibold text-night-900 transition-colors hover:bg-accent-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Buscar
        </button>
      </div>
      {onLocate && (
        <button
          type="button"
          onClick={onLocate}
          disabled={disabled}
          className="mt-2 min-h-11 rounded-xl border border-white/20 bg-white/5 px-4 font-medium text-slate-100 transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Usar minha localização
        </button>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-2 text-sm text-rose-200">
          {error}
        </p>
      )}
    </form>
  );
}
