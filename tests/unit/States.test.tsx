import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import EmptyState from '../../src/components/states/EmptyState';
import ErrorState from '../../src/components/states/ErrorState';
import LoadingState from '../../src/components/states/LoadingState';

describe('estados de UI', () => {
  it('anuncia carregamento por status', () => {
    render(<LoadingState />);
    expect(screen.getByRole('status')).toHaveTextContent('Carregando o clima');
  });

  it('anuncia o erro e permite retry por teclado', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<ErrorState message="Falha simulada." onRetry={onRetry} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Falha simulada.');
    await user.tab();
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('exibe título e dica no estado vazio e aceita conteúdo de idle', () => {
    const { rerender } = render(<EmptyState />);
    expect(screen.getByRole('status')).toHaveTextContent('Nenhuma cidade encontrada');
    expect(screen.getByText('Confira o nome da cidade e tente uma nova busca.')).toBeVisible();
    rerender(<EmptyState title="Busque uma cidade" hint="Use São Paulo para testar." />);
    expect(screen.getByRole('heading', { name: 'Busque uma cidade' })).toBeVisible();
    expect(screen.getByText('Use São Paulo para testar.')).toBeVisible();
  });
});
