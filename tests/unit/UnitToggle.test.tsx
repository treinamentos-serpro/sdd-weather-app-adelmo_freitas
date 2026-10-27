import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import UnitToggle from '../../src/components/UnitToggle';

describe('UnitToggle', () => {
  it('identifica o grupo e deriva o botão ativo das props', () => {
    const { rerender } = render(<UnitToggle unit="celsius" onChange={vi.fn()} />);
    expect(screen.getByRole('group', { name: 'Unidade de temperatura' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Celsius', pressed: true })).toBeVisible();
    rerender(<UnitToggle unit="fahrenheit" onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Fahrenheit', pressed: true })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Celsius', pressed: false })).toBeVisible();
  });

  it('permite navegação por Tab e ativação por Enter e Espaço', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<UnitToggle unit="celsius" onChange={onChange} />);
    await user.tab();
    expect(screen.getByRole('button', { name: 'Celsius' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onChange).toHaveBeenLastCalledWith('celsius');
    await user.tab();
    expect(screen.getByRole('button', { name: 'Fahrenheit' })).toHaveFocus();
    await user.keyboard(' ');
    expect(onChange).toHaveBeenLastCalledWith('fahrenheit');
  });
});
