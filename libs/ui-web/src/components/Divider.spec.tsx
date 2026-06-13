import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { space } from '@spoke/design-tokens';
import { Divider } from './Divider.js';

describe('Divider', () => {
  it('is a horizontal separator by default carrying the border token', () => {
    render(<Divider />);
    const el = screen.getByRole('separator');
    expect(el).toHaveClass('spk-divider');
    expect(el).toHaveAttribute('aria-orientation', 'horizontal');
    expect(el.style.getPropertyValue('--spk-bg')).toBe('var(--color-border)');
    expect(el.style.height).toBe(`${space.px}px`);
  });

  it('supports a vertical orientation', () => {
    render(<Divider orientation="vertical" />);
    const el = screen.getByRole('separator');
    expect(el).toHaveAttribute('aria-orientation', 'vertical');
    expect(el.style.width).toBe(`${space.px}px`);
  });
});
