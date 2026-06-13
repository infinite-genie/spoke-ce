import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from './Badge.js';

describe('Badge', () => {
  it('renders the count with the mention token by default', () => {
    render(<Badge count={3} />);
    const el = screen.getByText('3');
    expect(el).toHaveClass('spk-badge');
    expect(el.style.getPropertyValue('--spk-bg')).toBe('var(--color-mentionBadge)');
  });

  it('uses the unread token for the unread variant', () => {
    render(<Badge count={5} variant="unread" />);
    expect(screen.getByText('5').style.getPropertyValue('--spk-bg')).toBe(
      'var(--color-unreadBadge)',
    );
  });

  it('renders nothing when count is zero or negative', () => {
    const { container } = render(<Badge count={0} />);
    expect(container.querySelector('.spk-badge')).toBeNull();
  });

  it('caps large counts', () => {
    render(<Badge count={250} />);
    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('has an accessible label', () => {
    render(<Badge count={2} variant="mention" />);
    expect(screen.getByLabelText('2 mentions')).toBeInTheDocument();
  });

  it('uses a singular noun for a count of one', () => {
    render(<Badge count={1} variant="mention" />);
    expect(screen.getByLabelText('1 mention')).toBeInTheDocument();
  });
});
