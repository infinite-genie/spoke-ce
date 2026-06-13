import { describe, it, expect } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from './ThemeProvider.js';

function ThemeReadout() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button type="button" onClick={toggleTheme}>
      current:{theme}
    </button>
  );
}

describe('ThemeProvider', () => {
  it('renders children inside a data-theme container defaulting to light', () => {
    render(
      <ThemeProvider>
        <span>hello</span>
      </ThemeProvider>,
    );
    const scope = screen.getByText('hello').closest('[data-theme]');
    expect(scope).toHaveAttribute('data-theme', 'light');
  });

  it('honors an explicit defaultTheme', () => {
    render(
      <ThemeProvider defaultTheme="dark">
        <span>hi</span>
      </ThemeProvider>,
    );
    expect(screen.getByText('hi').closest('[data-theme]')).toHaveAttribute('data-theme', 'dark');
  });

  it('injects the theme variable stylesheet once', () => {
    render(
      <ThemeProvider>
        <span>x</span>
      </ThemeProvider>,
    );
    const styles = document.querySelectorAll('style[data-spoke-theme]');
    expect(styles).toHaveLength(1);
    expect(styles[0]?.textContent).toContain('--color-primary:');
    expect(styles[0]?.textContent).toContain('.spk-focusable:focus-visible');
  });

  it('toggles theme via useTheme', () => {
    render(
      <ThemeProvider>
        <ThemeReadout />
      </ThemeProvider>,
    );
    const btn = screen.getByRole('button');
    expect(btn).toHaveTextContent('current:light');
    act(() => btn.click());
    expect(btn).toHaveTextContent('current:dark');
  });
});
