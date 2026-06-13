# M1b — ui-web Tier 1 primitives + theme bridge + Storybook Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `@spoke/ui-web` React library — the design-token → CSS-custom-property bridge, a light/dark `ThemeProvider`, and all ten Tier 1 primitives — every visual value sourced from `@spoke/design-tokens`, with Storybook stories per variant.

**Architecture:** Components are plain React function components. **Colors** are applied as inline CSS *custom properties* (`--spk-bg: var(--color-primary)`, etc.) and mapped to real CSS properties by one shared stylesheet `primitives.css`; this keeps token references verbatim and jsdom-safe, and lets `:hover`/`:focus-visible`/`:disabled` states live in CSS using the same custom props. **Dimensions and type** are applied as ordinary inline style values read from `space`/`radius`/`fontSize`/`textStyle` (member access — never numeric literals, so the M1a token-guard passes). `buildThemeCss()` turns `lightTheme`/`darkTheme` into `:root` and `[data-theme='dark']` variable blocks; `ThemeProvider` injects that plus `primitives.css` once and toggles `data-theme`. Unit tests assert each variant carries the correct token (custom-prop value) and the correct a11y role/label; Storybook + a `composeStories` render test enforce a story per variant.

**Tech Stack:** React 19, TypeScript 5.8 (strict), Vitest + jsdom + @testing-library/react + @testing-library/jest-dom, lucide-react (icons), Storybook 8 (`@storybook/react-vite`), Nx package-based targets (`lint`/`typecheck`/`test`/`build-storybook`).

---

## Conventions every task in this plan follows

- **No raw colors, no magic numbers in `*.ts`/`*.tsx`** (enforced by `spoke/no-raw-colors` + `no-magic-numbers` on `libs/ui-web/**`). Colors come only from `cssVar(...)`; dimensions/type come only from `@spoke/design-tokens` member access. `*.spec.tsx`, `*.stories.tsx` are exempt by the existing eslint config.
- **Imports use the `.js` extension** for intra-package ESM specifiers (matches `libs/design-tokens` style, e.g. `import { cssVar } from '../theme/themeVars.js';`).
- **Color tokens → inline custom properties** named `--spk-bg`, `--spk-fg`, `--spk-bg-hover`, `--spk-border`, `--spk-presence`. **Type every style object as `StyleWithVars`** (exported from `theme/themeVars.ts`: `export type StyleWithVars = CSSProperties & Record<\`--${string}\`, string>;`) — do **NOT** use `as CSSProperties` casts. Example: `const style: StyleWithVars = { '--spk-bg': cssVar('primary'), minHeight: space[8], ...style };`. (Task 2's `themeVars.ts` exports this; the component task code blocks below still show the older `as CSSProperties` form — replace it with `StyleWithVars` typing when you implement them.)
- **Forward `aria-*`, `role`, and `data-*`** on container/primitive components (Box/Text) via a pass-through index signature (`[k: \`aria-${string}\`]` / `[k: \`data-${string}\`]: string | undefined` plus `role?: string`). Components that extend a native element's props (Button/IconButton via `ComponentPropsWithoutRef`) already get these.
- **Every component forwards `className` and `style`** (user values win — spread user `style` last, append `className` after the `spk-*` class).
- **Tests read tokens** by importing from `@spoke/design-tokens` and asserting against rendered values (e.g. `expect(el.style.getPropertyValue('--spk-bg')).toBe('var(--color-primary)')`, `expect(el.style.minHeight).toBe(\`${space[8]}px\`)`). Never hard-code the expected hex/px.
- **No Claude attribution** in any commit message (no `Co-Authored-By` trailer). Commits use `ronyv250289@gmail.com` (already the worktree's `user.email`).
- **Conventional commits**: `feat(ui-web): …`, `test(ui-web): …`, `chore(ui-web): …`, `docs(ui-web): …`.

---

## File Structure

```
libs/ui-web/
  package.json                 # @spoke/ui-web; scripts lint/typecheck/test/build-storybook; deps
  tsconfig.json                # extends base; jsx react-jsx; DOM libs
  vitest.config.ts             # jsdom env, globals, react plugin, tsconfig paths, setup file
  vitest.setup.ts              # imports @testing-library/jest-dom/vitest
  CLAUDE.md                    # package routing + styling conventions (Task 15)
  .storybook/
    main.ts                    # @storybook/react-vite; stories glob
    preview.tsx                # global ThemeProvider decorator + light/dark toolbar
  src/
    index.ts                   # public barrel: theme + every component
    theme/
      themeVars.ts             # cssVar(); buildThemeCss()
      themeVars.spec.ts
      primitivesCss.ts         # primitivesCss string (focus ring, states, spinner keyframes)
      ThemeProvider.tsx        # injects css, sets data-theme, useTheme()
      ThemeProvider.spec.tsx
    components/
      Box.tsx        Box.spec.tsx        Box.stories.tsx        # also exports Stack
      Text.tsx       Text.spec.tsx       Text.stories.tsx
      Icon.tsx       Icon.spec.tsx       Icon.stories.tsx
      Button.tsx     Button.spec.tsx     Button.stories.tsx
      IconButton.tsx IconButton.spec.tsx IconButton.stories.tsx
      Avatar.tsx     Avatar.spec.tsx     Avatar.stories.tsx
      Input.tsx      Input.spec.tsx      Input.stories.tsx
      Badge.tsx      Badge.spec.tsx      Badge.stories.tsx
      Spinner.tsx    Spinner.spec.tsx    Spinner.stories.tsx
      Divider.tsx    Divider.spec.tsx    Divider.stories.tsx
    stories.smoke.spec.tsx     # composeStories renders every story (Task 14)
tsconfig.base.json             # add "@spoke/ui-web" path (Task 1)
```

`primitives.css` content is authored as a TypeScript string export (`primitivesCss`) so no CSS loader is needed in Vitest; `ThemeProvider` injects it. Each component task that needs a CSS hook **appends its block** to `primitivesCss.ts`.

---

### Task 1: Scaffold `@spoke/ui-web`

**Files:**
- Create: `libs/ui-web/package.json`
- Create: `libs/ui-web/tsconfig.json`
- Create: `libs/ui-web/vitest.config.ts`
- Create: `libs/ui-web/vitest.setup.ts`
- Create: `libs/ui-web/src/index.ts`
- Create: `libs/ui-web/src/smoke.spec.ts`
- Modify: `tsconfig.base.json` (add `@spoke/ui-web` path)
- Modify (root): `package-lock.json` (via `npm install`)

- [ ] **Step 1: Write the package manifest**

`libs/ui-web/package.json`:

```json
{
  "name": "@spoke/ui-web",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "scripts": {
    "lint": "eslint src",
    "typecheck": "tsc --noEmit -p tsconfig.json",
    "test": "vitest run",
    "build-storybook": "storybook build --quiet"
  },
  "peerDependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "dependencies": {
    "lucide-react": "^0.460.0"
  },
  "devDependencies": {
    "@storybook/react": "^8.4.0",
    "@storybook/react-vite": "^8.4.0",
    "@testing-library/jest-dom": "^6.6.0",
    "@testing-library/react": "^16.1.0",
    "@testing-library/user-event": "^14.5.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "jsdom": "^25.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "storybook": "^8.4.0",
    "vite": "^6.0.0"
  }
}
```

> If npm reports a listed version is unavailable, install the latest stable of that package and keep the resolved version; note any swap in the commit body.

- [ ] **Step 2: TypeScript config**

`libs/ui-web/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src/**/*.ts", "src/**/*.tsx", "vitest.config.ts", ".storybook/**/*.ts", ".storybook/**/*.tsx"]
}
```

- [ ] **Step 3: Vitest config + setup**

`libs/ui-web/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths({ root: '../..' })],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
});
```

`libs/ui-web/vitest.setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 4: Public barrel + smoke test**

`libs/ui-web/src/index.ts`:

```ts
export const UI_WEB_PACKAGE = '@spoke/ui-web';
```

`libs/ui-web/src/smoke.spec.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { UI_WEB_PACKAGE } from './index.js';

describe('@spoke/ui-web', () => {
  it('exposes its package name', () => {
    expect(UI_WEB_PACKAGE).toBe('@spoke/ui-web');
  });
});
```

- [ ] **Step 5: Register the path alias**

In `tsconfig.base.json`, add to `compilerOptions.paths` (keep existing entries):

```json
"@spoke/ui-web": ["libs/ui-web/src/index.ts"]
```

- [ ] **Step 6: Install deps + sync lockfile**

Run: `npm install`
Expected: completes; `git status` shows `package-lock.json` modified and the new `libs/ui-web/**` files untracked. (Per project memory: a new workspace package **always** changes `package-lock.json` — it must be committed.)

- [ ] **Step 7: Verify the harness runs**

Run: `npx nx test @spoke/ui-web`
Expected: PASS — 1 test (`exposes its package name`). If Nx does not discover the project, run `npx nx reset` then retry.

Run: `npx nx run-many -t lint typecheck -p @spoke/ui-web`
Expected: PASS (no lint/type errors on the barrel + smoke test).

- [ ] **Step 8: Commit**

```bash
git add libs/ui-web tsconfig.base.json package-lock.json
git commit -m "feat(ui-web): scaffold @spoke/ui-web library with vitest + jsdom harness"
```

---

### Task 2: Theme bridge — `cssVar()` and `buildThemeCss()`

**Files:**
- Create: `libs/ui-web/src/theme/themeVars.ts`
- Test: `libs/ui-web/src/theme/themeVars.spec.ts`

- [ ] **Step 1: Write the failing test**

`libs/ui-web/src/theme/themeVars.spec.ts`:

```ts
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
      expect(css).toContain(`--color-${k}: ${lightTheme.color[k as keyof typeof lightTheme.color]};`);
      expect(css).toContain(`--color-${k}: ${darkTheme.color[k as keyof typeof darkTheme.color]};`);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx nx test @spoke/ui-web`
Expected: FAIL — `themeVars.js` not found / `cssVar` is not a function.

- [ ] **Step 3: Write minimal implementation**

`libs/ui-web/src/theme/themeVars.ts`:

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx nx test @spoke/ui-web`
Expected: PASS.

- [ ] **Step 5: Lint + typecheck**

Run: `npx nx run-many -t lint typecheck -p @spoke/ui-web`
Expected: PASS — no raw-color/magic-number violations (the only string templates are CSS variable names and interpolated token values).

- [ ] **Step 6: Commit**

```bash
git add libs/ui-web/src/theme/themeVars.ts libs/ui-web/src/theme/themeVars.spec.ts
git commit -m "feat(ui-web): add token->CSS-variable bridge (cssVar, buildThemeCss)"
```

---

### Task 3: `primitivesCss` base stylesheet

**Files:**
- Create: `libs/ui-web/src/theme/primitivesCss.ts`
- Test: `libs/ui-web/src/theme/primitivesCss.spec.ts`

This file is the single shared stylesheet. It starts with the focus-ring rule; later component tasks append their blocks.

- [ ] **Step 1: Write the failing test**

`libs/ui-web/src/theme/primitivesCss.spec.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { primitivesCss } from './primitivesCss.js';

describe('primitivesCss', () => {
  it('defines a keyboard focus ring using the borderFocus token', () => {
    expect(primitivesCss).toContain('.spk-focusable:focus-visible');
    expect(primitivesCss).toContain('var(--color-borderFocus)');
  });

  it('contains no raw hex colors', () => {
    expect(primitivesCss).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx nx test @spoke/ui-web`
Expected: FAIL — `primitivesCss.js` not found.

- [ ] **Step 3: Write minimal implementation**

`libs/ui-web/src/theme/primitivesCss.ts`:

```ts
/**
 * Shared stylesheet for ui-web primitives. Component color tokens arrive as inline
 * custom properties (--spk-bg, --spk-fg, ...); these rules map them to real CSS
 * properties and add :hover / :focus-visible / :disabled states. Reference only
 * CSS variables here — never raw hex.
 */
export const primitivesCss = `
.spk-focusable:focus-visible {
  outline: 2px solid var(--color-borderFocus);
  outline-offset: 2px;
}
`;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx nx test @spoke/ui-web`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add libs/ui-web/src/theme/primitivesCss.ts libs/ui-web/src/theme/primitivesCss.spec.ts
git commit -m "feat(ui-web): add shared primitives stylesheet with focus-ring rule"
```

---

### Task 4: `ThemeProvider`

**Files:**
- Create: `libs/ui-web/src/theme/ThemeProvider.tsx`
- Test: `libs/ui-web/src/theme/ThemeProvider.spec.tsx`
- Modify: `libs/ui-web/src/index.ts`

- [ ] **Step 1: Write the failing test**

`libs/ui-web/src/theme/ThemeProvider.spec.tsx`:

```tsx
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx nx test @spoke/ui-web`
Expected: FAIL — `ThemeProvider.js` not found.

- [ ] **Step 3: Write minimal implementation**

`libs/ui-web/src/theme/ThemeProvider.tsx`:

```tsx
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { buildThemeCss } from './themeVars.js';
import { primitivesCss } from './primitivesCss.js';

export type ThemeName = 'light' | 'dark';

interface ThemeContextValue {
  theme: ThemeName;
  setTheme: (t: ThemeName) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}

const THEME_CSS = `${buildThemeCss()}\n${primitivesCss}`;

export interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: ThemeName;
}

export function ThemeProvider({ children, defaultTheme = 'light' }: ThemeProviderProps) {
  const [theme, setTheme] = useState<ThemeName>(defaultTheme);
  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme,
      toggleTheme: () => setTheme((t) => (t === 'light' ? 'dark' : 'light')),
    }),
    [theme],
  );

  return (
    <ThemeContext.Provider value={value}>
      <style data-spoke-theme>{THEME_CSS}</style>
      <div data-theme={theme}>{children}</div>
    </ThemeContext.Provider>
  );
}
```

> The `<style data-spoke-theme>` is rendered by the provider; each provider instance owns one. Tests mount a single provider, so the "exactly one" assertion holds. App code mounts one provider at the root.

- [ ] **Step 4: Export from the barrel**

Replace `libs/ui-web/src/index.ts` with:

```ts
export { cssVar, buildThemeCss, type ColorKey } from './theme/themeVars.js';
export { primitivesCss } from './theme/primitivesCss.js';
export {
  ThemeProvider,
  useTheme,
  type ThemeName,
  type ThemeProviderProps,
} from './theme/ThemeProvider.js';
```

> Delete `libs/ui-web/src/smoke.spec.ts` and the `UI_WEB_PACKAGE` export — the barrel now exports real API. (If you prefer, keep the smoke test but update it to import `cssVar`.)

- [ ] **Step 5: Run test to verify it passes**

Run: `npx nx test @spoke/ui-web`
Expected: PASS — ThemeProvider suite green.

- [ ] **Step 6: Lint + typecheck**

Run: `npx nx run-many -t lint typecheck -p @spoke/ui-web`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add libs/ui-web/src
git rm --cached libs/ui-web/src/smoke.spec.ts 2>/dev/null || true
git commit -m "feat(ui-web): add ThemeProvider with light/dark variable injection"
```

---

### Task 5: `Box` / `Stack` layout primitive

**Files:**
- Create: `libs/ui-web/src/components/Box.tsx`
- Test: `libs/ui-web/src/components/Box.spec.tsx`
- Modify: `libs/ui-web/src/theme/primitivesCss.ts` (append `.spk-box` block)
- Modify: `libs/ui-web/src/index.ts`

This task establishes the **canonical component pattern** every later component follows: forward `className`/`style`, color tokens via `--spk-*` custom props, dimensions via `space`/etc. member access.

- [ ] **Step 1: Write the failing test**

`libs/ui-web/src/components/Box.spec.tsx`:

```tsx
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
    expect(screen.getByTestId('b').style.getPropertyValue('--spk-bg')).toBe('var(--color-bgSecondary)');
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx nx test @spoke/ui-web`
Expected: FAIL — `Box.js` not found.

- [ ] **Step 3: Write minimal implementation**

`libs/ui-web/src/components/Box.tsx`:

```tsx
import { type CSSProperties, type ReactNode } from 'react';
import { space } from '@spoke/design-tokens';
import { cssVar, type ColorKey } from '../theme/themeVars.js';

type SpaceKey = keyof typeof space;

export interface BoxProps {
  children?: ReactNode;
  padding?: SpaceKey;
  gap?: SpaceKey;
  direction?: CSSProperties['flexDirection'];
  align?: CSSProperties['alignItems'];
  justify?: CSSProperties['justifyContent'];
  background?: ColorKey;
  className?: string;
  style?: CSSProperties;
  /** test/data hooks and aria pass through */
  [key: `data-${string}`]: string | undefined;
}

export function Box({
  children,
  padding,
  gap,
  direction = 'row',
  align,
  justify,
  background,
  className,
  style,
  ...rest
}: BoxProps) {
  const composed = {
    display: 'flex',
    flexDirection: direction,
    alignItems: align,
    justifyContent: justify,
    padding: padding === undefined ? undefined : space[padding],
    gap: gap === undefined ? undefined : space[gap],
    ...(background ? { '--spk-bg': cssVar(background) } : {}),
    ...style,
  } as CSSProperties;

  return (
    <div className={['spk-box', className].filter(Boolean).join(' ')} style={composed} {...rest}>
      {children}
    </div>
  );
}

export function Stack(props: BoxProps) {
  return <Box direction="column" {...props} />;
}
```

- [ ] **Step 4: Append the CSS hook**

Append to `libs/ui-web/src/theme/primitivesCss.ts` (inside the template literal, before the closing backtick):

```css
.spk-box {
  background: var(--spk-bg, transparent);
}
```

- [ ] **Step 5: Export from the barrel**

Add to `libs/ui-web/src/index.ts`:

```ts
export { Box, Stack, type BoxProps } from './components/Box.js';
```

- [ ] **Step 6: Run tests + lint + typecheck**

Run: `npx nx run-many -t test lint typecheck -p @spoke/ui-web`
Expected: PASS — Box suite green; no token-guard violations (only `space[...]` member access and `cssVar(...)`).

- [ ] **Step 7: Commit**

```bash
git add libs/ui-web/src
git commit -m "feat(ui-web): add Box/Stack layout primitive"
```

---

### Task 6: `Text`

**Files:**
- Create: `libs/ui-web/src/components/Text.tsx`
- Test: `libs/ui-web/src/components/Text.spec.tsx`
- Modify: `libs/ui-web/src/theme/primitivesCss.ts` (append `.spk-text` block)
- Modify: `libs/ui-web/src/index.ts`

- [ ] **Step 1: Write the failing test**

`libs/ui-web/src/components/Text.spec.tsx`:

```tsx
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
    expect(screen.getByText('a').style.getPropertyValue('--spk-fg')).toBe('var(--color-textPrimary)');
    render(<Text color="textTertiary">b</Text>);
    expect(screen.getByText('b').style.getPropertyValue('--spk-fg')).toBe('var(--color-textTertiary)');
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx nx test @spoke/ui-web`
Expected: FAIL — `Text.js` not found.

- [ ] **Step 3: Write minimal implementation**

`libs/ui-web/src/components/Text.tsx`:

```tsx
import { createElement, type CSSProperties, type ReactNode } from 'react';
import { textStyle } from '@spoke/design-tokens';
import { cssVar, type ColorKey } from '../theme/themeVars.js';

export type TextVariant = keyof typeof textStyle;

export interface TextProps {
  children?: ReactNode;
  variant?: TextVariant;
  color?: ColorKey;
  numberOfLines?: number;
  as?: 'span' | 'p' | 'div' | 'label';
  className?: string;
  style?: CSSProperties;
}

export function Text({
  children,
  variant = 'messageBody',
  color = 'textPrimary',
  numberOfLines,
  as = 'span',
  className,
  style,
}: TextProps) {
  const clamp: CSSProperties = numberOfLines
    ? {
        display: '-webkit-box',
        WebkitLineClamp: numberOfLines,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }
    : {};

  const composed = {
    ...textStyle[variant],
    '--spk-fg': cssVar(color),
    ...clamp,
    ...style,
  } as CSSProperties;

  return createElement(
    as,
    { className: ['spk-text', className].filter(Boolean).join(' '), style: composed },
    children,
  );
}
```

- [ ] **Step 4: Append the CSS hook**

Append inside the `primitivesCss` template (before the closing backtick):

```css
.spk-text {
  color: var(--spk-fg, var(--color-textPrimary));
}
```

- [ ] **Step 5: Export from the barrel**

Add to `libs/ui-web/src/index.ts`:

```ts
export { Text, type TextProps, type TextVariant } from './components/Text.js';
```

- [ ] **Step 6: Run tests + lint + typecheck**

Run: `npx nx run-many -t test lint typecheck -p @spoke/ui-web`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add libs/ui-web/src
git commit -m "feat(ui-web): add Text primitive with textStyle presets"
```

---

### Task 7: `Icon`

**Files:**
- Create: `libs/ui-web/src/components/Icon.tsx`
- Test: `libs/ui-web/src/components/Icon.spec.tsx`
- Modify: `libs/ui-web/src/index.ts`

- [ ] **Step 1: Write the failing test**

`libs/ui-web/src/components/Icon.spec.tsx`:

```tsx
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx nx test @spoke/ui-web`
Expected: FAIL — `Icon.js` not found.

- [ ] **Step 3: Write minimal implementation**

`libs/ui-web/src/components/Icon.tsx`:

```tsx
import { type CSSProperties } from 'react';
import { icons } from 'lucide-react';
import { space } from '@spoke/design-tokens';
import { cssVar, type ColorKey } from '../theme/themeVars.js';

const ICON_SIZE = { sm: space[4], md: space[5], lg: space[6] } as const;

export type IconName = keyof typeof icons;
export type IconSize = keyof typeof ICON_SIZE;

export interface IconProps {
  name: IconName;
  size?: IconSize;
  color?: ColorKey;
  /** When provided, the icon is exposed to assistive tech with this name. */
  label?: string;
  className?: string;
  style?: CSSProperties;
}

export function Icon({ name, size = 'md', color, label, className, style }: IconProps) {
  const Glyph = icons[name];
  return (
    <Glyph
      width={ICON_SIZE[size]}
      height={ICON_SIZE[size]}
      color={color ? cssVar(color) : undefined}
      className={className}
      style={style}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  );
}
```

- [ ] **Step 4: Export from the barrel**

Add to `libs/ui-web/src/index.ts`:

```ts
export { Icon, type IconProps, type IconName, type IconSize } from './components/Icon.js';
```

- [ ] **Step 5: Run tests + lint + typecheck**

Run: `npx nx run-many -t test lint typecheck -p @spoke/ui-web`
Expected: PASS. If lucide renders `width` as a number string differently, adjust the assertion to read the actual attribute — but do **not** hard-code a pixel literal; keep it `String(space[...])`.

- [ ] **Step 6: Commit**

```bash
git add libs/ui-web/src
git commit -m "feat(ui-web): add Icon primitive wrapping lucide-react"
```

---

### Task 8: `Spinner`

**Files:**
- Create: `libs/ui-web/src/components/Spinner.tsx`
- Test: `libs/ui-web/src/components/Spinner.spec.tsx`
- Modify: `libs/ui-web/src/theme/primitivesCss.ts` (append `.spk-spinner` + keyframes)
- Modify: `libs/ui-web/src/index.ts`

Built before `Button`/`IconButton` because their loading state renders a `Spinner`.

- [ ] **Step 1: Write the failing test**

`libs/ui-web/src/components/Spinner.spec.tsx`:

```tsx
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx nx test @spoke/ui-web`
Expected: FAIL — `Spinner.js` not found.

- [ ] **Step 3: Write minimal implementation**

`libs/ui-web/src/components/Spinner.tsx`:

```tsx
import { type CSSProperties } from 'react';
import { space } from '@spoke/design-tokens';
import { cssVar, type ColorKey } from '../theme/themeVars.js';

const SPINNER_SIZE = { sm: space[4], md: space[5], lg: space[6] } as const;

export interface SpinnerProps {
  size?: keyof typeof SPINNER_SIZE;
  color?: ColorKey;
  label?: string;
  className?: string;
  style?: CSSProperties;
}

export function Spinner({ size = 'md', color = 'textSecondary', label = 'Loading', className, style }: SpinnerProps) {
  const px = SPINNER_SIZE[size];
  const composed = { '--spk-fg': cssVar(color), ...style } as CSSProperties;
  return (
    <span
      role="status"
      aria-label={label}
      className={['spk-spinner', className].filter(Boolean).join(' ')}
      style={composed}
    >
      <svg className="spk-spin" width={px} height={px} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
        <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </span>
  );
}
```

> The SVG geometry strings (`"0 0 24 24"`, `cx`/`r`/etc.) are SVG attribute strings, not styled pixel values — they're exempt from `no-magic-numbers` (which scans numeric literals in code, not string attributes) and carry no color.

- [ ] **Step 4: Append the CSS hook**

Append inside the `primitivesCss` template (before the closing backtick):

```css
.spk-spinner {
  display: inline-flex;
  color: var(--spk-fg, var(--color-textSecondary));
}
@keyframes spk-spin {
  to { transform: rotate(360deg); }
}
.spk-spin {
  animation: spk-spin 0.7s linear infinite;
}
@media (prefers-reduced-motion: reduce) {
  .spk-spin { animation-duration: 2s; }
}
```

- [ ] **Step 5: Export from the barrel**

Add to `libs/ui-web/src/index.ts`:

```ts
export { Spinner, type SpinnerProps } from './components/Spinner.js';
```

- [ ] **Step 6: Run tests + lint + typecheck**

Run: `npx nx run-many -t test lint typecheck -p @spoke/ui-web`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add libs/ui-web/src
git commit -m "feat(ui-web): add Spinner primitive"
```

---

### Task 9: `Button`

**Files:**
- Create: `libs/ui-web/src/components/Button.tsx`
- Test: `libs/ui-web/src/components/Button.spec.tsx`
- Modify: `libs/ui-web/src/theme/primitivesCss.ts` (append `.spk-button` block)
- Modify: `libs/ui-web/src/index.ts`

- [ ] **Step 1: Write the failing test**

`libs/ui-web/src/components/Button.spec.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { space, radius } from '@spoke/design-tokens';
import { Button } from './Button.js';

describe('Button', () => {
  it('renders a focusable button with the primary tokens by default', () => {
    render(<Button>Save</Button>);
    const btn = screen.getByRole('button', { name: 'Save' });
    expect(btn).toHaveClass('spk-button', 'spk-focusable');
    expect(btn.style.getPropertyValue('--spk-bg')).toBe('var(--color-primary)');
    expect(btn.style.getPropertyValue('--spk-fg')).toBe('var(--color-textOnBrand)');
    expect(btn.style.getPropertyValue('--spk-bg-hover')).toBe('var(--color-primaryHover)');
    expect(btn.style.borderRadius).toBe(`${radius.md}px`);
  });

  it('omits a background for the ghost variant and keeps a hover token', () => {
    render(<Button variant="ghost">Ghost</Button>);
    const btn = screen.getByRole('button', { name: 'Ghost' });
    expect(btn.style.getPropertyValue('--spk-bg')).toBe('');
    expect(btn.style.getPropertyValue('--spk-bg-hover')).toBe('var(--color-bgHover)');
  });

  it('maps the danger variant to the danger token', () => {
    render(<Button variant="danger">Delete</Button>);
    expect(screen.getByRole('button', { name: 'Delete' }).style.getPropertyValue('--spk-bg')).toBe(
      'var(--color-textDanger)',
    );
  });

  it('gives the secondary variant a border token', () => {
    render(<Button variant="secondary">More</Button>);
    expect(screen.getByRole('button', { name: 'More' }).style.getPropertyValue('--spk-border')).toBe(
      'var(--color-borderStrong)',
    );
  });

  it('sizes height from the space scale', () => {
    render(<Button size="lg">Big</Button>);
    expect(screen.getByRole('button', { name: 'Big' }).style.minHeight).toBe(`${space[12]}px`);
  });

  it('shows a spinner and disables while loading', () => {
    render(<Button loading>Save</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('fires onClick when enabled and not when disabled', async () => {
    const onClick = vi.fn();
    const { rerender } = render(<Button onClick={onClick}>Go</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
    rerender(<Button onClick={onClick} disabled>Go</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx nx test @spoke/ui-web`
Expected: FAIL — `Button.js` not found.

- [ ] **Step 3: Write minimal implementation**

`libs/ui-web/src/components/Button.tsx`:

```tsx
import { type ComponentPropsWithoutRef, type CSSProperties, type ReactNode } from 'react';
import { space, radius, fontSize, fontWeight } from '@spoke/design-tokens';
import { cssVar, type ColorKey } from '../theme/themeVars.js';
import { Spinner } from './Spinner.js';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

const VARIANT_TOKENS: Record<
  ButtonVariant,
  { bg?: ColorKey; fg: ColorKey; bgHover: ColorKey; border?: ColorKey }
> = {
  primary: { bg: 'primary', fg: 'textOnBrand', bgHover: 'primaryHover' },
  secondary: { bg: 'bgSecondary', fg: 'textPrimary', bgHover: 'bgHover', border: 'borderStrong' },
  ghost: { fg: 'textPrimary', bgHover: 'bgHover' },
  danger: { bg: 'textDanger', fg: 'textOnBrand', bgHover: 'textDanger' },
};

const SIZE_TOKENS: Record<ButtonSize, { minHeight: number; paddingX: number; fontSize: number }> = {
  sm: { minHeight: space[8], paddingX: space[3], fontSize: fontSize.sm },
  md: { minHeight: space[10], paddingX: space[4], fontSize: fontSize.base },
  lg: { minHeight: space[12], paddingX: space[5], fontSize: fontSize.md },
};

export interface ButtonProps extends Omit<ComponentPropsWithoutRef<'button'>, 'style' | 'className'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  iconLeft?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  iconLeft,
  disabled,
  type = 'button',
  children,
  className,
  style,
  ...rest
}: ButtonProps) {
  const v = VARIANT_TOKENS[variant];
  const s = SIZE_TOKENS[size];
  const composed = {
    '--spk-fg': cssVar(v.fg),
    '--spk-bg-hover': cssVar(v.bgHover),
    ...(v.bg ? { '--spk-bg': cssVar(v.bg) } : {}),
    ...(v.border ? { '--spk-border': cssVar(v.border) } : {}),
    minHeight: s.minHeight,
    paddingLeft: s.paddingX,
    paddingRight: s.paddingX,
    borderRadius: radius.md,
    fontSize: s.fontSize,
    fontWeight: fontWeight.semibold,
    gap: space[2],
    ...style,
  } as CSSProperties;

  return (
    <button
      type={type}
      className={['spk-button', 'spk-focusable', className].filter(Boolean).join(' ')}
      style={composed}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Spinner size={size === 'lg' ? 'md' : 'sm'} color={v.fg} /> : iconLeft}
      {children}
    </button>
  );
}
```

- [ ] **Step 4: Append the CSS hook**

Append inside the `primitivesCss` template (before the closing backtick):

```css
.spk-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--spk-bg, transparent);
  color: var(--spk-fg);
  border: 1px solid var(--spk-border, transparent);
  font-family: inherit;
  cursor: pointer;
}
.spk-button:hover:not(:disabled) {
  background: var(--spk-bg-hover);
}
.spk-button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
```

- [ ] **Step 5: Export from the barrel**

Add to `libs/ui-web/src/index.ts`:

```ts
export { Button, type ButtonProps, type ButtonVariant, type ButtonSize } from './components/Button.js';
```

- [ ] **Step 6: Run tests + lint + typecheck**

Run: `npx nx run-many -t test lint typecheck -p @spoke/ui-web`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add libs/ui-web/src
git commit -m "feat(ui-web): add Button primitive with variants, sizes, loading"
```

---

### Task 10: `IconButton`

**Files:**
- Create: `libs/ui-web/src/components/IconButton.tsx`
- Test: `libs/ui-web/src/components/IconButton.spec.tsx`
- Modify: `libs/ui-web/src/theme/primitivesCss.ts` (append `.spk-iconbutton` block)
- Modify: `libs/ui-web/src/index.ts`

- [ ] **Step 1: Write the failing test**

`libs/ui-web/src/components/IconButton.spec.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { space, layout } from '@spoke/design-tokens';
import { IconButton } from './IconButton.js';

describe('IconButton', () => {
  it('exposes the label as the accessible name and is focusable', () => {
    render(<IconButton icon="Search" label="Search" />);
    const btn = screen.getByRole('button', { name: 'Search' });
    expect(btn).toHaveClass('spk-iconbutton', 'spk-focusable');
    expect(btn.querySelector('svg')).not.toBeNull();
  });

  it('is square, sized from the scale (md default)', () => {
    render(<IconButton icon="Search" label="Search" />);
    const btn = screen.getByRole('button', { name: 'Search' });
    expect(btn.style.width).toBe(`${space[10]}px`);
    expect(btn.style.height).toBe(`${space[10]}px`);
  });

  it('uses the mobile touch-target size at lg', () => {
    render(<IconButton icon="Search" label="Search" size="lg" />);
    expect(screen.getByRole('button', { name: 'Search' }).style.width).toBe(`${layout.touchTarget}px`);
  });

  it('shows a spinner and disables while loading', () => {
    render(<IconButton icon="Search" label="Search" loading />);
    expect(screen.getByRole('button', { name: 'Search' })).toBeDisabled();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('fires onClick', async () => {
    const onClick = vi.fn();
    render(<IconButton icon="Search" label="Search" onClick={onClick} />);
    await userEvent.click(screen.getByRole('button', { name: 'Search' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx nx test @spoke/ui-web`
Expected: FAIL — `IconButton.js` not found.

- [ ] **Step 3: Write minimal implementation**

`libs/ui-web/src/components/IconButton.tsx`:

```tsx
import { type ComponentPropsWithoutRef, type CSSProperties } from 'react';
import { space, radius, layout } from '@spoke/design-tokens';
import { cssVar, type ColorKey } from '../theme/themeVars.js';
import { Icon, type IconName, type IconSize } from './Icon.js';
import { Spinner } from './Spinner.js';

export type IconButtonVariant = 'ghost' | 'primary' | 'danger';
export type IconButtonSize = 'sm' | 'md' | 'lg';

const BTN_SIZE: Record<IconButtonSize, number> = {
  sm: space[8],
  md: space[10],
  lg: layout.touchTarget,
};
const ICON_FOR: Record<IconButtonSize, IconSize> = { sm: 'sm', md: 'md', lg: 'md' };

const VARIANT_TOKENS: Record<IconButtonVariant, { bg?: ColorKey; fg: ColorKey; bgHover: ColorKey }> = {
  ghost: { fg: 'textSecondary', bgHover: 'bgHover' },
  primary: { bg: 'primary', fg: 'textOnBrand', bgHover: 'primaryHover' },
  danger: { fg: 'textDanger', bgHover: 'bgHover' },
};

export interface IconButtonProps
  extends Omit<ComponentPropsWithoutRef<'button'>, 'style' | 'className'> {
  icon: IconName;
  /** Required accessible name. */
  label: string;
  size?: IconButtonSize;
  variant?: IconButtonVariant;
  loading?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function IconButton({
  icon,
  label,
  size = 'md',
  variant = 'ghost',
  loading = false,
  disabled,
  type = 'button',
  className,
  style,
  ...rest
}: IconButtonProps) {
  const dim = BTN_SIZE[size];
  const v = VARIANT_TOKENS[variant];
  const composed = {
    '--spk-fg': cssVar(v.fg),
    '--spk-bg-hover': cssVar(v.bgHover),
    ...(v.bg ? { '--spk-bg': cssVar(v.bg) } : {}),
    width: dim,
    height: dim,
    borderRadius: radius.base,
    ...style,
  } as CSSProperties;

  return (
    <button
      type={type}
      aria-label={label}
      className={['spk-iconbutton', 'spk-focusable', className].filter(Boolean).join(' ')}
      style={composed}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Spinner size="sm" color={v.fg} /> : <Icon name={icon} size={ICON_FOR[size]} color={v.fg} />}
    </button>
  );
}
```

- [ ] **Step 4: Append the CSS hook**

Append inside the `primitivesCss` template (before the closing backtick):

```css
.spk-iconbutton {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--spk-bg, transparent);
  color: var(--spk-fg);
  border: none;
  cursor: pointer;
}
.spk-iconbutton:hover:not(:disabled) {
  background: var(--spk-bg-hover);
}
.spk-iconbutton:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
```

- [ ] **Step 5: Export from the barrel**

Add to `libs/ui-web/src/index.ts`:

```ts
export {
  IconButton,
  type IconButtonProps,
  type IconButtonVariant,
  type IconButtonSize,
} from './components/IconButton.js';
```

- [ ] **Step 6: Run tests + lint + typecheck**

Run: `npx nx run-many -t test lint typecheck -p @spoke/ui-web`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add libs/ui-web/src
git commit -m "feat(ui-web): add IconButton primitive"
```

---

### Task 11: `Avatar`

**Files:**
- Create: `libs/ui-web/src/components/Avatar.tsx`
- Test: `libs/ui-web/src/components/Avatar.spec.tsx`
- Modify: `libs/ui-web/src/theme/primitivesCss.ts` (append `.spk-avatar` + `.spk-presence` blocks)
- Modify: `libs/ui-web/src/index.ts`

- [ ] **Step 1: Write the failing test**

`libs/ui-web/src/components/Avatar.spec.tsx`:

```tsx
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx nx test @spoke/ui-web`
Expected: FAIL — `Avatar.js` not found.

- [ ] **Step 3: Write minimal implementation**

`libs/ui-web/src/components/Avatar.tsx`:

```tsx
import { type CSSProperties } from 'react';
import { space, fontSize, fontWeight } from '@spoke/design-tokens';
import { cssVar, type ColorKey } from '../theme/themeVars.js';

export type Presence = 'online' | 'away' | 'dnd' | 'offline';
export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

const AVATAR_SIZE: Record<AvatarSize, number> = {
  sm: space[6],
  md: space[8],
  lg: space[10],
  xl: space[12],
};
const AVATAR_FONT: Record<AvatarSize, number> = {
  sm: fontSize.xs,
  md: fontSize.sm,
  lg: fontSize.base,
  xl: fontSize.md,
};
const DOT_SIZE: Record<AvatarSize, number> = {
  sm: space[2],
  md: space[2],
  lg: space[3],
  xl: space[3],
};
const PRESENCE_TOKEN: Record<Presence, ColorKey> = {
  online: 'online',
  away: 'away',
  dnd: 'dnd',
  offline: 'offline',
};

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase();
}

export interface AvatarProps {
  name: string;
  src?: string;
  size?: AvatarSize;
  presence?: Presence;
  className?: string;
  style?: CSSProperties;
}

export function Avatar({ name, src, size = 'md', presence, className, style }: AvatarProps) {
  const dim = AVATAR_SIZE[size];
  const composed = {
    '--spk-bg': cssVar('bgSecondary'),
    '--spk-fg': cssVar('textSecondary'),
    width: dim,
    height: dim,
    borderRadius: space[2],
    fontSize: AVATAR_FONT[size],
    fontWeight: fontWeight.semibold,
    ...style,
  } as CSSProperties;

  const dotStyle = {
    '--spk-presence': cssVar(PRESENCE_TOKEN[presence ?? 'offline']),
    width: DOT_SIZE[size],
    height: DOT_SIZE[size],
  } as CSSProperties;

  // The accessible image role lives on the <img> when there's a src, otherwise on the
  // initials wrapper — never both (a nested role="img" would make getByRole ambiguous).
  const labelProps = src ? {} : { role: 'img', 'aria-label': name };

  return (
    <span
      className={['spk-avatar', className].filter(Boolean).join(' ')}
      style={composed}
      {...labelProps}
    >
      {src ? <img src={src} alt={name} /> : initials(name)}
      {presence ? <span className="spk-presence" style={dotStyle} aria-hidden="true" /> : null}
    </span>
  );
}
```

- [ ] **Step 4: Append the CSS hook**

Append inside the `primitivesCss` template (before the closing backtick):

```css
.spk-avatar {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: visible;
  background: var(--spk-bg);
  color: var(--spk-fg);
  user-select: none;
}
.spk-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: inherit;
}
.spk-presence {
  position: absolute;
  right: 0;
  bottom: 0;
  border-radius: 9999px;
  background: var(--spk-presence);
  box-shadow: 0 0 0 2px var(--color-bgApp);
}
```

- [ ] **Step 5: Export from the barrel**

Add to `libs/ui-web/src/index.ts`:

```ts
export { Avatar, type AvatarProps, type AvatarSize, type Presence } from './components/Avatar.js';
```

- [ ] **Step 6: Run tests + lint + typecheck**

Run: `npx nx run-many -t test lint typecheck -p @spoke/ui-web`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add libs/ui-web/src
git commit -m "feat(ui-web): add Avatar primitive with presence dot"
```

---

### Task 12: `Input`

**Files:**
- Create: `libs/ui-web/src/components/Input.tsx`
- Test: `libs/ui-web/src/components/Input.spec.tsx`
- Modify: `libs/ui-web/src/theme/primitivesCss.ts` (append `.spk-input` block)
- Modify: `libs/ui-web/src/index.ts`

- [ ] **Step 1: Write the failing test**

`libs/ui-web/src/components/Input.spec.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from './Input.js';

describe('Input', () => {
  it('renders a textbox reflecting value and accessible name', () => {
    render(<Input value="hello" onChange={() => {}} aria-label="Message" />);
    const input = screen.getByRole('textbox', { name: 'Message' });
    expect(input).toHaveValue('hello');
  });

  it('calls onChange with the new string value', async () => {
    const onChange = vi.fn();
    render(<Input value="" onChange={onChange} aria-label="Message" />);
    await userEvent.type(screen.getByRole('textbox', { name: 'Message' }), 'a');
    expect(onChange).toHaveBeenCalledWith('a');
  });

  it('uses the danger border token when error is set', () => {
    const { container } = render(<Input value="" onChange={() => {}} aria-label="Email" error />);
    const wrap = container.querySelector('.spk-input') as HTMLElement;
    expect(wrap.style.getPropertyValue('--spk-border')).toBe('var(--color-textDanger)');
  });

  it('uses the normal border token without error', () => {
    const { container } = render(<Input value="" onChange={() => {}} aria-label="Email" />);
    const wrap = container.querySelector('.spk-input') as HTMLElement;
    expect(wrap.style.getPropertyValue('--spk-border')).toBe('var(--color-border)');
  });

  it('renders prefix and suffix slots', () => {
    render(
      <Input value="" onChange={() => {}} aria-label="Search" prefix={<span>P</span>} suffix={<span>S</span>} />,
    );
    expect(screen.getByText('P')).toBeInTheDocument();
    expect(screen.getByText('S')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx nx test @spoke/ui-web`
Expected: FAIL — `Input.js` not found.

- [ ] **Step 3: Write minimal implementation**

`libs/ui-web/src/components/Input.tsx`:

```tsx
import { type CSSProperties, type ReactNode } from 'react';
import { space, radius, fontSize } from '@spoke/design-tokens';
import { cssVar } from '../theme/themeVars.js';

export interface InputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: boolean;
  prefix?: ReactNode;
  suffix?: ReactNode;
  type?: string;
  disabled?: boolean;
  id?: string;
  'aria-label'?: string;
  className?: string;
  style?: CSSProperties;
}

export function Input({
  value,
  onChange,
  placeholder,
  error = false,
  prefix,
  suffix,
  type = 'text',
  disabled = false,
  id,
  'aria-label': ariaLabel,
  className,
  style,
}: InputProps) {
  const composed = {
    '--spk-bg': cssVar('bgInput'),
    '--spk-fg': cssVar('textPrimary'),
    '--spk-border': cssVar(error ? 'textDanger' : 'border'),
    gap: space[2],
    paddingLeft: space[3],
    paddingRight: space[3],
    minHeight: space[10],
    borderRadius: radius.base,
    fontSize: fontSize.base,
    ...style,
  } as CSSProperties;

  return (
    <div className={['spk-input', className].filter(Boolean).join(' ')} style={composed}>
      {prefix}
      <input
        id={id}
        aria-label={ariaLabel}
        aria-invalid={error || undefined}
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
      {suffix}
    </div>
  );
}
```

- [ ] **Step 4: Append the CSS hook**

Append inside the `primitivesCss` template (before the closing backtick):

```css
.spk-input {
  display: inline-flex;
  align-items: center;
  background: var(--spk-bg);
  color: var(--spk-fg);
  border: 1px solid var(--spk-border);
}
.spk-input:focus-within {
  outline: 2px solid var(--color-borderFocus);
  outline-offset: 0;
}
.spk-input input {
  flex: 1;
  min-width: 0;
  background: transparent;
  border: none;
  outline: none;
  color: inherit;
  font: inherit;
}
.spk-input input::placeholder {
  color: var(--color-textTertiary);
}
```

- [ ] **Step 5: Export from the barrel**

Add to `libs/ui-web/src/index.ts`:

```ts
export { Input, type InputProps } from './components/Input.js';
```

- [ ] **Step 6: Run tests + lint + typecheck**

Run: `npx nx run-many -t test lint typecheck -p @spoke/ui-web`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add libs/ui-web/src
git commit -m "feat(ui-web): add Input primitive with prefix/suffix and error state"
```

---

### Task 13: `Badge`

**Files:**
- Create: `libs/ui-web/src/components/Badge.tsx`
- Test: `libs/ui-web/src/components/Badge.spec.tsx`
- Modify: `libs/ui-web/src/theme/primitivesCss.ts` (append `.spk-badge` block)
- Modify: `libs/ui-web/src/index.ts`

- [ ] **Step 1: Write the failing test**

`libs/ui-web/src/components/Badge.spec.tsx`:

```tsx
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
    expect(screen.getByText('5').style.getPropertyValue('--spk-bg')).toBe('var(--color-unreadBadge)');
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
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx nx test @spoke/ui-web`
Expected: FAIL — `Badge.js` not found.

- [ ] **Step 3: Write minimal implementation**

`libs/ui-web/src/components/Badge.tsx`:

```tsx
import { type CSSProperties } from 'react';
import { space, fontSize, fontWeight } from '@spoke/design-tokens';
import { cssVar, type ColorKey } from '../theme/themeVars.js';

export type BadgeVariant = 'mention' | 'unread';

const VARIANT_TOKENS: Record<BadgeVariant, { bg: ColorKey; fg: ColorKey }> = {
  mention: { bg: 'mentionBadge', fg: 'textOnBrand' },
  unread: { bg: 'unreadBadge', fg: 'textPrimary' },
};

export interface BadgeProps {
  count: number;
  variant?: BadgeVariant;
  /** Display cap; counts above show "<max>+". */
  max?: number;
  className?: string;
  style?: CSSProperties;
}

export function Badge({ count, variant = 'mention', max = 99, className, style }: BadgeProps) {
  if (count <= 0) return null;
  const v = VARIANT_TOKENS[variant];
  const label = count > max ? `${max}+` : `${count}`;
  const composed = {
    '--spk-bg': cssVar(v.bg),
    '--spk-fg': cssVar(v.fg),
    minWidth: space[4],
    height: space[4],
    paddingLeft: space[1],
    paddingRight: space[1],
    borderRadius: space[4],
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  } as CSSProperties;

  return (
    <span
      className={['spk-badge', className].filter(Boolean).join(' ')}
      style={{ ...composed, ...style }}
      aria-label={`${count} ${variant === 'mention' ? 'mentions' : 'unread'}`}
    >
      {label}
    </span>
  );
}
```

- [ ] **Step 4: Append the CSS hook**

Append inside the `primitivesCss` template (before the closing backtick):

```css
.spk-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--spk-bg);
  color: var(--spk-fg);
  box-sizing: border-box;
}
```

- [ ] **Step 5: Export from the barrel**

Add to `libs/ui-web/src/index.ts`:

```ts
export { Badge, type BadgeProps, type BadgeVariant } from './components/Badge.js';
```

- [ ] **Step 6: Run tests + lint + typecheck**

Run: `npx nx run-many -t test lint typecheck -p @spoke/ui-web`
Expected: PASS. (`max = 99` is a default-value literal — exempt via the eslint `ignoreDefaultValues` option.)

- [ ] **Step 7: Commit**

```bash
git add libs/ui-web/src
git commit -m "feat(ui-web): add Badge primitive (mention/unread)"
```

---

### Task 14: `Divider`

**Files:**
- Create: `libs/ui-web/src/components/Divider.tsx`
- Test: `libs/ui-web/src/components/Divider.spec.tsx`
- Modify: `libs/ui-web/src/theme/primitivesCss.ts` (append `.spk-divider` block)
- Modify: `libs/ui-web/src/index.ts`

- [ ] **Step 1: Write the failing test**

`libs/ui-web/src/components/Divider.spec.tsx`:

```tsx
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx nx test @spoke/ui-web`
Expected: FAIL — `Divider.js` not found.

- [ ] **Step 3: Write minimal implementation**

`libs/ui-web/src/components/Divider.tsx`:

```tsx
import { type CSSProperties } from 'react';
import { space } from '@spoke/design-tokens';
import { cssVar } from '../theme/themeVars.js';

export type DividerOrientation = 'horizontal' | 'vertical';

export interface DividerProps {
  orientation?: DividerOrientation;
  className?: string;
  style?: CSSProperties;
}

export function Divider({ orientation = 'horizontal', className, style }: DividerProps) {
  const composed = {
    '--spk-bg': cssVar('border'),
    ...(orientation === 'horizontal'
      ? { width: '100%', height: space.px }
      : { width: space.px, alignSelf: 'stretch' }),
    ...style,
  } as CSSProperties;

  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={['spk-divider', className].filter(Boolean).join(' ')}
      style={composed}
    />
  );
}
```

- [ ] **Step 4: Append the CSS hook**

Append inside the `primitivesCss` template (before the closing backtick):

```css
.spk-divider {
  background: var(--spk-bg);
  border: none;
  flex-shrink: 0;
}
```

- [ ] **Step 5: Export from the barrel**

Add to `libs/ui-web/src/index.ts`:

```ts
export { Divider, type DividerProps, type DividerOrientation } from './components/Divider.js';
```

- [ ] **Step 6: Run tests + lint + typecheck**

Run: `npx nx run-many -t test lint typecheck -p @spoke/ui-web`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add libs/ui-web/src
git commit -m "feat(ui-web): add Divider primitive"
```

---

### Task 15: Storybook + per-variant stories + CI render coverage

**Files:**
- Create: `libs/ui-web/.storybook/main.ts`
- Create: `libs/ui-web/.storybook/preview.tsx`
- Create: one `*.stories.tsx` per component (10 files, listed below)
- Create: `libs/ui-web/src/stories.smoke.spec.tsx`
- Modify: `libs/ui-web/vitest.setup.ts` (register Storybook project annotations)

Stories are authored here (not in the component tasks) so the whole set lands together and the `composeStories` render test can enforce "a story per variant" in CI. Stories and specs are exempt from the token-guard, so they may pass literal prop values freely.

- [ ] **Step 1: Storybook config**

`libs/ui-web/.storybook/main.ts`:

```ts
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: [],
  framework: { name: '@storybook/react-vite', options: {} },
};

export default config;
```

`libs/ui-web/.storybook/preview.tsx`:

```tsx
import type { Preview } from '@storybook/react';
import { ThemeProvider, type ThemeName } from '../src/theme/ThemeProvider.js';

const preview: Preview = {
  decorators: [
    (Story, ctx) => (
      <ThemeProvider defaultTheme={(ctx.globals.theme as ThemeName) ?? 'light'}>
        <Story />
      </ThemeProvider>
    ),
  ],
  globalTypes: {
    theme: {
      description: 'Theme',
      defaultValue: 'light',
      toolbar: { icon: 'circlehollow', items: ['light', 'dark'], dynamicTitle: true },
    },
  },
};

export default preview;
```

- [ ] **Step 2: Register annotations for the render test**

Replace `libs/ui-web/vitest.setup.ts` with:

```ts
import '@testing-library/jest-dom/vitest';
import { setProjectAnnotations } from '@storybook/react';
import preview from './.storybook/preview';

setProjectAnnotations(preview);
```

- [ ] **Step 3: Write the failing render-coverage test**

`libs/ui-web/src/stories.smoke.spec.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { composeStories } from '@storybook/react';

const modules = import.meta.glob('./components/*.stories.tsx', { eager: true });

describe('storybook coverage', () => {
  it('has a story module for every component', () => {
    expect(Object.keys(modules).length).toBeGreaterThanOrEqual(10);
  });

  for (const [path, mod] of Object.entries(modules)) {
    const stories = composeStories(mod as Parameters<typeof composeStories>[0]);
    const names = Object.keys(stories);
    it(`${path} exports at least one story`, () => {
      expect(names.length).toBeGreaterThan(0);
    });
    for (const [name, Story] of Object.entries(stories)) {
      it(`renders ${path} → ${name}`, () => {
        const { unmount } = render(<Story />);
        unmount();
      });
    }
  }
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npx nx test @spoke/ui-web`
Expected: FAIL — no `*.stories.tsx` modules yet, so the "≥10 modules" assertion fails.

- [ ] **Step 5: Author one CSF3 story file per component**

Each file uses a `Meta` default export and named story objects (one per meaningful variant). Create all ten:

`libs/ui-web/src/components/Box.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Box, Stack } from './Box.js';
import { Text } from './Text.js';

const meta: Meta<typeof Box> = { title: 'Primitives/Box', component: Box };
export default meta;
type Story = StoryObj<typeof Box>;

export const Row: Story = {
  args: { gap: 2, padding: 4, background: 'bgSecondary', children: <Text>Row layout</Text> },
};
export const Column: StoryObj<typeof Stack> = {
  render: () => (
    <Stack gap={2} padding={4}>
      <Text>One</Text>
      <Text>Two</Text>
    </Stack>
  ),
};
```

`libs/ui-web/src/components/Text.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Text } from './Text.js';

const meta: Meta<typeof Text> = { title: 'Primitives/Text', component: Text };
export default meta;
type Story = StoryObj<typeof Text>;

export const MessageBody: Story = { args: { children: 'The quick brown fox.' } };
export const SectionHeader: Story = { args: { variant: 'sectionHeader', children: 'Channels' } };
export const Code: Story = { args: { variant: 'code', children: 'npm run test' } };
export const Tertiary: Story = { args: { color: 'textTertiary', children: '12:45 PM' } };
```

`libs/ui-web/src/components/Icon.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Icon } from './Icon.js';

const meta: Meta<typeof Icon> = { title: 'Primitives/Icon', component: Icon };
export default meta;
type Story = StoryObj<typeof Icon>;

export const Default: Story = { args: { name: 'Hash', label: 'channel' } };
export const Large: Story = { args: { name: 'Send', size: 'lg', color: 'actionSend', label: 'send' } };
```

`libs/ui-web/src/components/Button.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button.js';

const meta: Meta<typeof Button> = { title: 'Primitives/Button', component: Button };
export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = { args: { children: 'Send' } };
export const Secondary: Story = { args: { variant: 'secondary', children: 'Cancel' } };
export const Ghost: Story = { args: { variant: 'ghost', children: 'Skip' } };
export const Danger: Story = { args: { variant: 'danger', children: 'Delete' } };
export const Loading: Story = { args: { loading: true, children: 'Saving' } };
```

`libs/ui-web/src/components/IconButton.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { IconButton } from './IconButton.js';

const meta: Meta<typeof IconButton> = { title: 'Primitives/IconButton', component: IconButton };
export default meta;
type Story = StoryObj<typeof IconButton>;

export const Ghost: Story = { args: { icon: 'Search', label: 'Search' } };
export const Primary: Story = { args: { icon: 'Plus', label: 'Add', variant: 'primary' } };
export const Loading: Story = { args: { icon: 'Send', label: 'Send', loading: true } };
```

`libs/ui-web/src/components/Avatar.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Avatar } from './Avatar.js';

const meta: Meta<typeof Avatar> = { title: 'Primitives/Avatar', component: Avatar };
export default meta;
type Story = StoryObj<typeof Avatar>;

export const Initials: Story = { args: { name: 'Ada Lovelace' } };
export const Online: Story = { args: { name: 'Grace Hopper', presence: 'online' } };
export const Dnd: Story = { args: { name: 'Alan Turing', presence: 'dnd', size: 'lg' } };
```

`libs/ui-web/src/components/Input.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Input } from './Input.js';

const meta: Meta<typeof Input> = { title: 'Primitives/Input', component: Input };
export default meta;
type Story = StoryObj<typeof Input>;

function Controlled(args: { error?: boolean }) {
  const [value, setValue] = useState('');
  return <Input value={value} onChange={setValue} aria-label="Demo" placeholder="Type…" error={args.error} />;
}

export const Default: Story = { render: () => <Controlled /> };
export const Error: Story = { render: () => <Controlled error /> };
```

`libs/ui-web/src/components/Badge.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './Badge.js';

const meta: Meta<typeof Badge> = { title: 'Primitives/Badge', component: Badge };
export default meta;
type Story = StoryObj<typeof Badge>;

export const Mention: Story = { args: { count: 3 } };
export const Unread: Story = { args: { count: 12, variant: 'unread' } };
export const Capped: Story = { args: { count: 250 } };
```

`libs/ui-web/src/components/Spinner.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Spinner } from './Spinner.js';

const meta: Meta<typeof Spinner> = { title: 'Primitives/Spinner', component: Spinner };
export default meta;
type Story = StoryObj<typeof Spinner>;

export const Default: Story = {};
export const Large: Story = { args: { size: 'lg', color: 'primary' } };
```

`libs/ui-web/src/components/Divider.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Divider } from './Divider.js';

const meta: Meta<typeof Divider> = { title: 'Primitives/Divider', component: Divider };
export default meta;
type Story = StoryObj<typeof Divider>;

export const Horizontal: Story = {};
export const Vertical: Story = {
  render: () => (
    <div style={{ display: 'flex', height: 24 }}>
      <Divider orientation="vertical" />
    </div>
  ),
};
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx nx test @spoke/ui-web`
Expected: PASS — coverage test finds 10 modules and renders every composed story.

- [ ] **Step 7: Verify the Storybook build compiles**

Run: `npx nx run @spoke/ui-web:build-storybook`
Expected: builds without error (output under `libs/ui-web/storybook-static`). Add `storybook-static` to `.gitignore` if it appears untracked:

```bash
echo "storybook-static/" >> libs/ui-web/.gitignore
```

- [ ] **Step 8: Lint + typecheck**

Run: `npx nx run-many -t lint typecheck -p @spoke/ui-web`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add libs/ui-web
git commit -m "feat(ui-web): add Storybook with per-variant stories and CI render coverage"
```

---

### Task 16: Package `CLAUDE.md` + root routing entry

**Files:**
- Create: `libs/ui-web/CLAUDE.md`
- Modify: `CLAUDE.md` (root — add the routing line)

- [ ] **Step 1: Write the package guide**

`libs/ui-web/CLAUDE.md`:

````markdown
# @spoke/ui-web

React (DOM) implementation of the Spoke design system. Visual parity twin of
`libs/ui-native`; both consume `@spoke/design-tokens` and expose the same prop API.

## Styling rules (enforced by the M1a token-guard on `libs/ui-web/**/*.{ts,tsx}`)

- **Never** write a raw hex/rgb/hsl color or a magic pixel number in `.ts`/`.tsx`.
  Colors come only from `cssVar('<colorKey>')`; dimensions and type come only from
  `@spoke/design-tokens` member access (`space[4]`, `radius.md`, `fontSize.base`,
  `textStyle.messageBody`). `*.spec.tsx` and `*.stories.tsx` are exempt.
- **Colors → inline CSS custom properties.** A component sets `--spk-bg`, `--spk-fg`,
  `--spk-bg-hover`, `--spk-border`, `--spk-presence` inline (e.g.
  `{ '--spk-bg': cssVar('primary') }`), and `theme/primitivesCss.ts` maps those to real
  CSS properties plus `:hover` / `:focus-visible` / `:disabled` states. This keeps token
  references verbatim (and jsdom-testable) and is the only way to express pseudo-states.
- **Dimensions/type → ordinary inline style** read from tokens (numbers render as `px`).
- Every component forwards `className` and `style` (user values win — spread `style` last).
- Interactive components add `spk-focusable`; the focus ring always uses `borderFocus`.

## Theming

`buildThemeCss()` emits `:root` (light) + `[data-theme='dark']` variable blocks from
`lightTheme`/`darkTheme`. `<ThemeProvider>` injects that + `primitivesCss` once and sets
`data-theme`; `useTheme()` exposes `{ theme, setTheme, toggleTheme }`. Mount one provider
at the app root.

## Testing

Vitest + jsdom + @testing-library. Assert (1) the right a11y role/name, (2) the correct
token — read the inline custom property (`el.style.getPropertyValue('--spk-bg')` →
`var(--color-…)`) or the resolved token px — never a hard-coded hex/px. Storybook stories
double as CI render coverage via `src/stories.smoke.spec.tsx` (`composeStories`).

## Component-sizing convention

Component dimensions with no dedicated design token derive from the 4px `space` scale
(e.g. Avatar md = `space[8]` = 32, Icon md = `space[5]` = 20, Button lg height =
`space[12]` = 48). This keeps everything token-referenced and on grid without adding
sizing tokens.

## Known missing tokens (flagged per DESIGN_PLUGIN_PROMPT.md, not worked around)

- No dedicated `dangerBg` / `dangerHover` semantic tokens — `Button`/`IconButton` danger
  variants reuse `textDanger` for background and have no distinct hover shade. Add these
  tokens (and a hover) in a future token amendment if a stronger danger affordance is
  wanted.

## Commands

`npx nx run-many -t lint typecheck test -p @spoke/ui-web` · `npx nx run @spoke/ui-web:build-storybook`
````

- [ ] **Step 2: Add the root routing line**

In `CLAUDE.md` (root), under "## Routing — read the CLAUDE.md of the package you are working in", add after the design-tokens line:

```markdown
- `libs/ui-web/CLAUDE.md` — web component library (Tier 1+ primitives)
```

- [ ] **Step 3: Commit**

```bash
git add libs/ui-web/CLAUDE.md CLAUDE.md
git commit -m "docs(ui-web): add package CLAUDE.md and root routing entry"
```

---

## Final milestone verification (before opening the PR)

Run the full CI-parity gate from the repo root (per the project's lockfile/CI-parity memory and the `reproducing-ci-workflows-locally` skill). **`npm ci` first** — it is the only strict lockfile check:

- [ ] `npm ci` — Expected: clean install, no `EUSAGE` lockfile error. (A new workspace package always adds entries to `package-lock.json`; confirm they were committed in Task 1.)
- [ ] `npm run format:check` — Expected: all files formatted (run `npm run format` to fix, then commit).
- [ ] `npx nx run-many -t lint typecheck test --skip-nx-cache` — Expected: all projects (`@spoke/design-tokens`, `@spoke/shared-types`, `@spoke/eslint-rules`, `@spoke/ui-web`) green. ui-web: theme bridge + ThemeProvider + 10 components + storybook coverage all passing; zero token-guard violations.
- [ ] `npx nx run @spoke/ui-web:build-storybook` — Expected: Storybook compiles.
- [ ] Confirm the M1a token-guard is actually exercising the new code: temporarily insert a raw hex (e.g. `color: '#fff'`) into a non-spec/non-story `.tsx`, run `npx nx run @spoke/ui-web:lint`, confirm it **fails** with `spoke/no-raw-colors`, then revert. (Proves the guard covers ui-web — do not commit the probe.)

Then open the PR:

- [ ] Push the branch and open a PR titled **"M1b: ui-web Tier 1 primitives + theme bridge + Storybook"**, body `Closes #15`. No Claude attribution in the body or commits.
- [ ] Watch CI: `gh pr checks <n> --watch` → the `quality` job must pass.

## Self-review checklist (run by the implementer at the end)

- [ ] Every DESIGN_SYSTEM.md §5 Tier 1 component exists in `ui-web` with the documented prop API: Box/Stack, Text, Button, IconButton, Icon, Avatar, Input, Badge, Spinner, Divider.
- [ ] Light **and** dark both expressed: `buildThemeCss()` emits both; ThemeProvider toggles; Storybook has a theme toolbar.
- [ ] Accessibility: every interactive element has a role/label; focus ring uses `borderFocus`; IconButton requires `label`; touch target reaches `layout.touchTarget` at `lg`.
- [ ] No raw colors / magic numbers anywhere outside `*.spec.tsx` / `*.stories.tsx` (token-guard green, plus the manual probe in verification).
- [ ] `package-lock.json` committed with the new workspace package.

## Out of scope (subsequent M1 chunks)

- `libs/ui-native` Tier 1 (M1c) — same prop API, RN primitives, Storybook RN.
- Tier 2 composite + Tier 3 domain components, both platforms (M1d / M1e).
- GitNexus analyze/setup + the per-folder CLAUDE.md sweep across the repo (M1f).
- Pushing the built library to a claude.ai/design Design System project via `/design-sync` (optional, user-driven; the token references in `DESIGN_PLUGIN_PROMPT.md` are now all real).
