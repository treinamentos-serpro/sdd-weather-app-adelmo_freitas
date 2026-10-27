import { useEffect, useState } from 'react';
import { weatherFixture } from '../fixtures/weather';

export type DemoStatus = 'idle' | 'loading' | 'empty' | 'error' | 'success';

const cityMatcher = new Intl.Collator('pt-BR', { sensitivity: 'base' });

export default function useWeatherDemo() {
  const [status, setStatus] = useState<DemoStatus>('idle');
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (status !== 'loading') return;
    const timer = window.setTimeout(() => {
      setStatus(cityMatcher.compare(query, 'São Paulo') === 0 ? 'success' : 'empty');
    }, 500);
    return () => window.clearTimeout(timer);
  }, [status, query]);

  function search(city: string) {
    setQuery(city.trim());
    setStatus('loading');
  }

  function preview(next: DemoStatus) {
    setQuery('São Paulo');
    setStatus(next);
  }

  return {
    status,
    data: status === 'success' ? weatherFixture : null,
    search,
    retry: () => search(query),
    preview,
  };
}
