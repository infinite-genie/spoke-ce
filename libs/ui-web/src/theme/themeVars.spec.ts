import { describe, it, expect } from 'vitest';
import { lightTheme, darkTheme } from '@spoke/design-tokens';
import { cssVar, buildThemeCss } from './themeVars.js';

describe('cssVar', () => {
  it('maps a color key to a CSS custom-property reference', () => {
    expect(cssVar('primary')).toBe('var(--color-primary)');
    expect(cssVar('bgApp')).toBe('var(--color-bgApp)');
  });
});

describe('buildThemeCss', () => {
  const css = buildThemeCss();

  it('defines light theme on :root', () => {
    expect(css).toContain(':root {');
    expect(css).toContain(`--color-bgApp: ${lightTheme.color.bgApp};`);
    expect(css).toContain(`--color-primary: ${lightTheme.color.primary};`);
  });

  it('overrides under [data-theme=dark]', () => {
    expect(css).toContain("[data-theme='dark'] {");
    expect(css).toContain(`--color-bgApp: ${darkTheme.color.bgApp};`);
  });

  it('emits one declaration per color key in both themes', () => {
    const keys = Object.keys(lightTheme.color);
    for (const k of keys) {
      expect(css).toContain(
        `--color-${k}: ${lightTheme.color[k as keyof typeof lightTheme.color]};`,
      );
      expect(css).toContain(`--color-${k}: ${darkTheme.color[k as keyof typeof darkTheme.color]};`);
    }
  });
});
