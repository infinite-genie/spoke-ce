import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { space } from '@spoke/design-tokens';
import { Box, Stack } from './Box.js';

describe('Box', () => {
  it('renders a div with the spk-box class', () => {
    render(<Box data-testid="b">hi</Box>);
    const el = screen.getByTestId('b');
    expect(el.tagName).toBe('DIV');
    expect(el).toHaveClass('spk-box');
  });

  it('maps padding and gap to the space scale (px)', () => {
    render(<Box data-testid="b" padding={4} gap={2} />);
    const el = screen.getByTestId('b');
    expect(el.style.padding).toBe(`${space[4]}px`);
    expect(el.style.gap).toBe(`${space[2]}px`);
  });

  it('applies flex layout props', () => {
    render(<Box data-testid="b" direction="column" align="center" justify="space-between" />);
    const el = screen.getByTestId('b');
    expect(el.style.display).toBe('flex');
    expect(el.style.flexDirection).toBe('column');
    expect(el.style.alignItems).toBe('center');
    expect(el.style.justifyContent).toBe('space-between');
  });

  it('exposes a background color token via a custom property', () => {
    render(<Box data-testid="b" background="bgSecondary" />);
    expect(screen.getByTestId('b').style.getPropertyValue('--spk-bg')).toBe(
      'var(--color-bgSecondary)',
    );
  });

  it('merges user className and style (user style wins)', () => {
    render(<Box data-testid="b" padding={4} className="mine" style={{ padding: 0 }} />);
    const el = screen.getByTestId('b');
    expect(el).toHaveClass('spk-box', 'mine');
    expect(el.style.padding).toBe('0px');
  });

  it('Stack defaults to a column direction', () => {
    render(<Stack data-testid="s" />);
    expect(screen.getByTestId('s').style.flexDirection).toBe('column');
  });
});
