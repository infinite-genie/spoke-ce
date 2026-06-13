import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { textStyle } from '@spoke/design-tokens';
import { Text } from './Text.js';

describe('Text', () => {
  it('renders a span with the spk-text class and default messageBody type', () => {
    render(<Text>hi</Text>);
    const el = screen.getByText('hi');
    expect(el.tagName).toBe('SPAN');
    expect(el).toHaveClass('spk-text');
    expect(el.style.fontSize).toBe(`${textStyle.messageBody.fontSize}px`);
    expect(el.style.fontWeight).toBe(textStyle.messageBody.fontWeight);
  });

  it('applies a chosen textStyle preset, including non-size keys', () => {
    render(<Text variant="sectionHeader">SECTION</Text>);
    const el = screen.getByText('SECTION');
    expect(el.style.fontSize).toBe(`${textStyle.sectionHeader.fontSize}px`);
    expect(el.style.textTransform).toBe('uppercase');
  });

  it('uses the mono family for the code preset', () => {
    render(<Text variant="code">x()</Text>);
    expect(screen.getByText('x()').style.fontFamily).toBe(textStyle.code.fontFamily);
  });

  it('exposes the color token via a custom property (default textPrimary)', () => {
    render(<Text>a</Text>);
    expect(screen.getByText('a').style.getPropertyValue('--spk-fg')).toBe(
      'var(--color-textPrimary)',
    );
    render(<Text color="textTertiary">b</Text>);
    expect(screen.getByText('b').style.getPropertyValue('--spk-fg')).toBe(
      'var(--color-textTertiary)',
    );
  });

  it('clamps to numberOfLines', () => {
    render(<Text numberOfLines={2}>long</Text>);
    const el = screen.getByText('long');
    expect(el.style.getPropertyValue('-webkit-line-clamp')).toBe('2');
    expect(el.style.overflow).toBe('hidden');
  });

  it('can render as a different element', () => {
    render(<Text as="p">para</Text>);
    expect(screen.getByText('para').tagName).toBe('P');
  });
});
