import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { space } from '@spoke/design-tokens';
import { Icon } from './Icon.js';

describe('Icon', () => {
  it('renders an svg sized from the space scale (default md)', () => {
    const { container } = render(<Icon name="Check" />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute('width')).toBe(String(space[5]));
  });

  it('honors the size prop', () => {
    const { container } = render(<Icon name="Check" size="lg" />);
    expect(container.querySelector('svg')?.getAttribute('width')).toBe(String(space[6]));
  });

  it('applies the color token to stroke', () => {
    const { container } = render(<Icon name="Check" color="textLink" />);
    expect(container.querySelector('svg')?.getAttribute('stroke')).toBe('var(--color-textLink)');
  });

  it('is aria-hidden without a label', () => {
    const { container } = render(<Icon name="Check" />);
    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('is an img role with an accessible name when labeled', () => {
    render(<Icon name="Check" label="done" />);
    expect(screen.getByRole('img', { name: 'done' })).toBeInTheDocument();
  });
});
