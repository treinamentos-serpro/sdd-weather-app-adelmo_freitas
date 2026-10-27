import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import SearchBar from '../../src/components/SearchBar';

describe('SearchBar', () => {
  it('envia pelo teclado removendo espaços e preservando caracteres', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);
    expect(screen.getByRole('search', { name: 'Buscar cidade' })).toBeVisible();
    await user.type(
      screen.getByRole('searchbox', { name: 'Cidade' }),
      "  São João-d'Oeste  {Enter}",
    );
    expect(onSearch).toHaveBeenCalledExactlyOnceWith("São João-d'Oeste");
  });

  it.each(['', '   '])('rejeita entrada vazia %j com mensagem e foco', async (value) => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);
    const input = screen.getByRole('searchbox', { name: 'Cidade' });
    if (value) await user.type(input, value);
    await user.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(onSearch).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Digite o nome de uma cidade.');
    expect(input).toHaveFocus();
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('desabilita os controles e não envia busca', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchBar disabled onSearch={onSearch} />);
    expect(screen.getByRole('searchbox')).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(onSearch).not.toHaveBeenCalled();
  });
});
