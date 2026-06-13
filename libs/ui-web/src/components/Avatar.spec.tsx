import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { space } from '@spoke/design-tokens';
import { Avatar } from './Avatar.js';

describe('Avatar', () => {
  it('renders initials from the name when there is no src', () => {
    render(<Avatar name="Ada Lovelace" />);
    const el = screen.getByRole('img', { name: 'Ada Lovelace' });
    expect(el).toHaveTextContent('AL');
    expect(el).toHaveClass('spk-avatar');
  });

  it('renders the image when src is provided', () => {
    const { container } = render(<Avatar name="Ada" src="https://x/a.png" />);
    const img = container.querySelector('img');
    expect(img?.getAttribute('src')).toBe('https://x/a.png');
    expect(img?.getAttribute('alt')).toBe('Ada');
  });

  it('sizes from the space scale (md default)', () => {
    render(<Avatar name="Ada" />);
    const el = screen.getByRole('img', { name: 'Ada' });
    expect(el.style.width).toBe(`${space[8]}px`);
  });

  it('shows a presence dot carrying the status token', () => {
    const { container } = render(<Avatar name="Ada" presence="online" />);
    const dot = container.querySelector('.spk-presence') as HTMLElement | null;
    expect(dot).not.toBeNull();
    expect(dot?.style.getPropertyValue('--spk-presence')).toBe('var(--color-online)');
  });

  it('omits the presence dot when no presence is given', () => {
    const { container } = render(<Avatar name="Ada" />);
    expect(container.querySelector('.spk-presence')).toBeNull();
  });
});
