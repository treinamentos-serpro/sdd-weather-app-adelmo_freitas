import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App';

function finishLoading() {
  act(() => vi.advanceTimersByTime(500));
}

function search(city: string) {
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: city } });
  fireEvent.submit(screen.getByRole('search'));
}

describe('App sem API', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('inicia em idle, busca o mock, converte todos os valores e limpa dados antigos', () => {
    vi.useFakeTimers();
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Como está o clima por aí?' })).toBeVisible();
    expect(screen.queryByText('22,4 °C')).not.toBeInTheDocument();
    search('  sao paulo  ');
    expect(screen.getByRole('status')).toHaveTextContent('Carregando');
    expect(screen.getByRole('searchbox')).toBeDisabled();
    finishLoading();
    expect(screen.getByText('22,4 °C')).toBeVisible();
    expect(screen.getAllByRole('article')).toHaveLength(5);
    fireEvent.click(screen.getByRole('button', { name: 'Fahrenheit' }));
    expect(screen.getByText('72,3 °F')).toBeVisible();
    expect(screen.queryByText(/\d.*°C/)).not.toBeInTheDocument();
    search('Recife');
    expect(screen.queryByText('72,3 °F')).not.toBeInTheDocument();
    finishLoading();
    expect(screen.getByRole('heading', { name: 'Nenhuma cidade encontrada' })).toBeVisible();
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('permite simular erro e recuperar com retry mantendo a unidade', () => {
    vi.useFakeTimers();
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Fahrenheit' }));
    fireEvent.change(screen.getByRole('combobox', { name: 'Simular estado' }), {
      target: { value: 'error' },
    });
    expect(screen.getByRole('alert')).toHaveTextContent('Falha simulada');
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(screen.getByRole('status')).toHaveTextContent('Carregando');
    finishLoading();
    expect(screen.getByText('72,3 °F')).toBeVisible();
  });

  it('cancela o timer ao trocar o estado e ao desmontar', () => {
    vi.useFakeTimers();
    const { unmount } = render(<App />);
    search('São Paulo');
    fireEvent.change(screen.getByRole('combobox', { name: 'Simular estado' }), {
      target: { value: 'idle' },
    });
    finishLoading();
    expect(screen.getByRole('heading', { name: 'Como está o clima por aí?' })).toBeVisible();
    search('São Paulo');
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
