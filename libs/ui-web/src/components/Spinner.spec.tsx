import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { space } from '@spoke/design-tokens';
import { Spinner } from './Spinner.js';

describe('Spinner', () => {
  it('has a status role with a default accessible label', () => {
    render(<Spinner />);
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
  });

  it('accepts a custom label', () => {
    render(<Spinner label="Saving" />);
    expect(screen.getByRole('status', { name: 'Saving' })).toBeInTheDocument();
  });

  it('sizes the svg from the space scale and carries the spin class', () => {
    render(<Spinner size="lg" />);
    const el = screen.getByRole('status');
    const svg = el.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe(String(space[6]));
    expect(svg).toHaveClass('spk-spin');
  });

  it('exposes the color token via a custom property', () => {
    render(<Spinner color="textLink" />);
    expect(screen.getByRole('status').style.getPropertyValue('--spk-fg')).toBe('var(--color-textLink)');
  });
});
