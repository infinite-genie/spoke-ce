import { lightTheme, darkTheme, type Theme } from '@spoke/design-tokens';

export type ColorKey = keyof Theme['color'];

/** Reference a themed color as a CSS custom property (resolved by ThemeProvider). */
export function cssVar(key: ColorKey): string {
  return `var(--color-${key})`;
}

function declarations(theme: Theme): string {
  return (Object.keys(theme.color) as ColorKey[])
    .map((k) => `  --color-${k}: ${theme.color[k]};`)
    .join('\n');
}

/** CSS defining every color token as a custom property: light on :root, dark under [data-theme='dark']. */
export function buildThemeCss(): string {
  return [
    `:root {\n${declarations(lightTheme)}\n}`,
    `[data-theme='dark'] {\n${declarations(darkTheme)}\n}`,
  ].join('\n\n');
}
