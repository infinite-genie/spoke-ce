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
- **Type every style object as `StyleWithVars`** (exported from `theme/themeVars.ts`; it is
  `CSSProperties` intersected with a string-valued `--*` custom-property record) — never
  `as CSSProperties` casts. This allows the `--spk-*` custom properties with no cast and keeps `tsc` clean.
- **Dimensions/type → ordinary inline style** read from tokens (numbers render as `px`).
- Every component forwards `className` and `style` (user values win — spread `style` last).
  Container/primitive components (Box/Text) also forward `role` + `aria-*` + `data-*`;
  components extending a native element (Button/IconButton via `ComponentPropsWithoutRef`)
  inherit those automatically.
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
double as CI render coverage via `src/stories.smoke.spec.tsx` (`composeStories` renders
every variant of every component).

## Component-sizing convention

Component dimensions with no dedicated design token derive from the 4px `space` scale
(e.g. Avatar md = `space[8]` = 32, Icon md = `space[5]` = 20, Button lg height =
`space[12]` = 48). This keeps everything token-referenced and on grid without adding
sizing tokens.

## Intentional pattern exceptions

- **`Icon` applies color directly** (lucide's `color`→`stroke` prop) rather than through a
  `--spk-*` custom property. No current component needs icon color to change via CSS state
  (e.g. on hover) — `IconButton` hover only changes the button background, the icon keeps a
  fixed token color — so routing icon color through a custom property would be unnecessary
  indirection. Revisit only if a component needs CSS-state-driven icon recoloring.

## Known missing tokens (flagged per DESIGN_PLUGIN_PROMPT.md, not worked around)

- No dedicated `dangerBg` / `dangerHover` semantic tokens — `Button`/`IconButton` danger
  variants reuse `textDanger` for background and have no distinct hover shade. Add these
  tokens (and a hover) in a future token amendment if a stronger danger affordance is
  wanted.

## Commands

`npx nx run-many -t lint typecheck test -p @spoke/ui-web` · `npx nx run @spoke/ui-web:build-storybook`
