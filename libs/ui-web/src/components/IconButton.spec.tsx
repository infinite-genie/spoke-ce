import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { space, layout } from '@spoke/design-tokens';
import { IconButton } from './IconButton.js';

describe('IconButton', () => {
  it('exposes the label as the accessible name and is focusable', () => {
    render(<IconButton icon="Search" label="Search" />);
    const btn = screen.getByRole('button', { name: 'Search' });
    expect(btn).toHaveClass('spk-iconbutton', 'spk-focusable');
    expect(btn.querySelector('svg')).not.toBeNull();
  });

  it('is square, sized from the scale (md default)', () => {
    render(<IconButton icon="Search" label="Search" />);
    const btn = screen.getByRole('button', { name: 'Search' });
    expect(btn.style.width).toBe(`${space[10]}px`);
    expect(btn.style.height).toBe(`${space[10]}px`);
  });

  it('uses the mobile touch-target size at lg', () => {
    render(<IconButton icon="Search" label="Search" size="lg" />);
    expect(screen.getByRole('button', { name: 'Search' }).style.width).toBe(`${layout.touchTarget}px`);
  });

  it('shows a spinner and disables while loading', () => {
    render(<IconButton icon="Search" label="Search" loading />);
    expect(screen.getByRole('button', { name: 'Search' })).toBeDisabled();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('fires onClick', async () => {
    const onClick = vi.fn();
    render(<IconButton icon="Search" label="Search" onClick={onClick} />);
    await userEvent.click(screen.getByRole('button', { name: 'Search' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
