import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { space, radius } from '@spoke/design-tokens';
import { Button } from './Button.js';

describe('Button', () => {
  it('renders a focusable button with the primary tokens by default', () => {
    render(<Button>Save</Button>);
    const btn = screen.getByRole('button', { name: 'Save' });
    expect(btn).toHaveClass('spk-button', 'spk-focusable');
    expect(btn.style.getPropertyValue('--spk-bg')).toBe('var(--color-primary)');
    expect(btn.style.getPropertyValue('--spk-fg')).toBe('var(--color-textOnBrand)');
    expect(btn.style.getPropertyValue('--spk-bg-hover')).toBe('var(--color-primaryHover)');
    expect(btn.style.borderRadius).toBe(`${radius.md}px`);
  });

  it('omits a background for the ghost variant and keeps a hover token', () => {
    render(<Button variant="ghost">Ghost</Button>);
    const btn = screen.getByRole('button', { name: 'Ghost' });
    expect(btn.style.getPropertyValue('--spk-bg')).toBe('');
    expect(btn.style.getPropertyValue('--spk-bg-hover')).toBe('var(--color-bgHover)');
  });

  it('maps the danger variant to the danger token', () => {
    render(<Button variant="danger">Delete</Button>);
    expect(screen.getByRole('button', { name: 'Delete' }).style.getPropertyValue('--spk-bg')).toBe(
      'var(--color-textDanger)',
    );
  });

  it('gives the secondary variant a border token', () => {
    render(<Button variant="secondary">More</Button>);
    expect(
      screen.getByRole('button', { name: 'More' }).style.getPropertyValue('--spk-border'),
    ).toBe('var(--color-borderStrong)');
  });

  it('sizes height from the space scale', () => {
    render(<Button size="lg">Big</Button>);
    expect(screen.getByRole('button', { name: 'Big' }).style.minHeight).toBe(`${space[12]}px`);
  });

  it('shows a spinner and disables while loading', () => {
    render(<Button loading>Save</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('fires onClick when enabled and not when disabled', async () => {
    const onClick = vi.fn();
    const { rerender } = render(<Button onClick={onClick}>Go</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
    rerender(
      <Button onClick={onClick} disabled>
        Go
      </Button>,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
