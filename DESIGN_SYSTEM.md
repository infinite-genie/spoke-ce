# Spoke Design System Specification

> **Spoke** — a self-hostable team communication platform. The name evokes a wheel: a central hub with spokes radiating out to each workspace. This document is the **single source of truth** for all visual design. Every client — web (Next.js), desktop (Tauri), mobile (React Native/Expo) — MUST consume these tokens. No app defines its own colors, spacing, or type scale. Components are built ONLY from these primitives.

---

## 0. Architecture of the Design System

```
libs/design-tokens/      ← SOURCE OF TRUTH (platform-agnostic TS + JSON)
  ├── colors.ts
  ├── spacing.ts
  ├── typography.ts
  ├── radii.ts
  ├── shadows.ts
  ├── motion.ts
  ├── z-index.ts
  └── index.ts            ← exports a single `tokens` object + light/dark themes

libs/ui-web/             ← React components (div/span) consuming tokens via CSS vars
libs/ui-native/          ← React Native components (View/Text) consuming tokens via JS objects
```

**Rule:** `ui-web` and `ui-native` import the SAME token values. They differ only in render primitives. A `<Button variant="primary">` looks pixel-equivalent on every platform because both implementations read `tokens.color.primary` and `tokens.space[3]`.

### Token delivery per platform

- **Web/Desktop:** tokens compiled to CSS custom properties (`--color-primary`) at build time; components reference `var(--color-primary)`. Enables runtime theme switching.
- **Mobile:** tokens consumed as plain JS objects through a `ThemeProvider` (React Context). No CSS vars in RN.

### "Uniform UI" definition

Identical **look and feel** across web, desktop, and mobile — the technical implementation may differ per platform. Visual parity (colors, spacing, type scale, message layout, components) must match. The navigation shell may differ: 3-column on desktop, stacked screens on mobile. The shared design-token layer guarantees the look; the two component implementations satisfy each platform's render model.

### Optional: true single-codebase

If you later want ONE component implementation instead of two, use `react-native-web` + **Tamagui** (or Gluestack UI), which compile to both DOM and native from a shared token config. Trade-off: heavier toolchain, stricter component API. The two-implementation approach below is simpler and recommended unless code-sharing becomes a hard requirement.

---

## 1. Color Tokens

Spoke's identity: a deep indigo "hub" sidebar, clean content surface, purposeful accents. Defined as raw palette → semantic aliases. **Components only ever use semantic tokens**, never raw palette values.

### 1.1 Raw palette

```ts
const palette = {
  // Indigo (hub sidebar / brand) — Spoke's signature
  indigo950: '#16122B',
  indigo900: '#1E1A3C', // sidebar base
  indigo800: '#2A2456', // brand primary deep
  indigo700: '#372E70',
  indigo600: '#4A3E96',
  indigo500: '#5E4FB8', // brand primary
  indigo400: '#7E70D6',

  // Neutrals
  white: '#FFFFFF',
  gray50: '#F8F8FA',
  gray100: '#F3F3F6',
  gray200: '#E7E7EC',
  gray300: '#DADAE1',
  gray400: '#BCBCC6',
  gray500: '#85858F',
  gray600: '#5F5F69',
  gray700: '#454550',
  gray800: '#2C2C34',
  gray900: '#1C1C22', // primary text

  // Accents
  blue500: '#1F6FEB', // links, primary action
  blue600: '#1657C2',
  green500: '#1A8A5A', // success / online / send
  green400: '#27B377',
  red500: '#E0335E', // destructive / mention badge
  red600: '#C01F46',
  amber400: '#ECA72E', // warning / away
  cyan400: '#36BCF0', // info accent
};
```

### 1.2 Semantic tokens — LIGHT theme

```ts
export const lightTheme = {
  color: {
    // Surfaces
    bgApp: palette.white,
    bgSidebar: palette.indigo900,
    bgSidebarHover: palette.indigo700,
    bgSidebarActive: palette.blue500,
    bgSecondary: palette.gray50,
    bgHover: palette.gray100,
    bgSelected: '#EAF1FD',
    bgOverlay: 'rgba(0,0,0,0.45)',
    bgInput: palette.white,
    bgElevated: palette.white,

    // Text
    textPrimary: palette.gray900,
    textSecondary: palette.gray600,
    textTertiary: palette.gray500,
    textOnBrand: palette.white,
    textOnSidebar: 'rgba(255,255,255,0.72)',
    textOnSidebarActive: palette.white,
    textLink: palette.blue500,
    textDanger: palette.red500,
    textSuccess: palette.green500,

    // Border
    border: palette.gray200,
    borderStrong: palette.gray300,
    borderFocus: palette.blue500,

    // Interactive
    primary: palette.indigo500,
    primaryHover: palette.indigo600,
    actionSend: palette.green500,
    actionSendHover: palette.green400,

    // Status (presence)
    online: palette.green500,
    away: palette.amber400,
    dnd: palette.red500,
    offline: palette.gray400,

    // Badges
    mentionBadge: palette.red500,
    unreadBadge: palette.white,
  },
};
```

### 1.3 Semantic tokens — DARK theme

```ts
export const darkTheme = {
  color: {
    bgApp: palette.gray900,
    bgSidebar: palette.indigo950,
    bgSidebarHover: '#241F45',
    bgSidebarActive: palette.blue500,
    bgSecondary: '#222228',
    bgHover: '#27272E',
    bgSelected: '#1B2D4A',
    bgOverlay: 'rgba(0,0,0,0.65)',
    bgInput: '#222228',
    bgElevated: '#26262D',

    textPrimary: '#D2D2D6',
    textSecondary: '#ABABB2',
    textTertiary: palette.gray500,
    textOnBrand: palette.white,
    textOnSidebar: 'rgba(255,255,255,0.62)',
    textOnSidebarActive: palette.white,
    textLink: '#5AA0F2',
    textDanger: '#E0335E',
    textSuccess: '#27B377',

    border: '#34343B',
    borderStrong: '#44444B',
    borderFocus: '#5AA0F2',

    primary: palette.indigo400,
    primaryHover: palette.indigo500,
    actionSend: palette.green400,
    actionSendHover: palette.green500,

    online: palette.green400,
    away: palette.amber400,
    dnd: palette.red500,
    offline: palette.gray600,

    mentionBadge: palette.red500,
    unreadBadge: palette.gray900,
  },
};
```

**Both themes expose identical keys.** Switching theme never breaks a component because every semantic key exists in both.

---

## 2. Spacing Tokens

4px base grid. Use the scale — never hardcode pixel values in components.

```ts
export const space = {
  0: 0,
  px: 1,
  0.5: 2,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
};
```

Semantic layout aliases:

```ts
export const layout = {
  sidebarWidth: 260,
  workspaceRailWidth: 68, // thin left rail with workspace (tenant) icons
  threadPanelWidth: 380,
  messageGutter: space[4],
  messageRowPaddingY: space[2],
  inputBarMinHeight: 44,
  headerHeight: 49,
  touchTarget: 44, // min tap size on mobile
};
```

---

## 3. Typography Tokens

System font stack (loads instantly, no licensing). Mobile uses platform defaults.

```ts
export const fontFamily = {
  sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif',
  mono: '"SF Mono", Menlo, Consolas, "Roboto Mono", monospace',
};

export const fontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 16,
  lg: 18,
  xl: 22,
  '2xl': 28,
};

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

export const lineHeight = { tight: 1.2, base: 1.46, relaxed: 1.6 };
```

React Native components leave fontFamily unset to get the platform default (San Francisco / Roboto).

Type style presets (use these, not raw values):

```ts
export const textStyle = {
  messageBody: {
    fontSize: fontSize.base,
    lineHeight: lineHeight.base,
    fontWeight: fontWeight.regular,
  },
  senderName: { fontSize: fontSize.base, fontWeight: fontWeight.bold },
  timestamp: { fontSize: fontSize.xs },
  channelName: { fontSize: fontSize.md, fontWeight: fontWeight.bold },
  sidebarItem: { fontSize: fontSize.base, fontWeight: fontWeight.regular },
  sectionHeader: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    textTransform: 'uppercase',
  },
  code: { fontFamily: fontFamily.mono, fontSize: fontSize.sm },
};
```

Presets are purely typographic; components apply text colors (e.g. timestamps use textTertiary) from the active theme.

---

## 4. Radii, Shadows, Motion, Z-index

```ts
export const radius = { none: 0, sm: 4, base: 6, md: 8, lg: 12, xl: 16, full: 9999 };

export const shadow = {
  sm: '0 1px 2px rgba(0,0,0,0.08)',
  base: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)',
  md: '0 4px 12px rgba(0,0,0,0.15)',
  lg: '0 8px 24px rgba(0,0,0,0.18)',
  popover: '0 6px 18px rgba(0,0,0,0.22)',
};
// RN elevation map: sm→2, base→3, md→6, lg→12, popover→10

export const motion = {
  duration: { fast: 100, base: 160, slow: 240 },
  easing: {
    standard: 'cubic-bezier(0.2, 0, 0, 1)',
    emphasized: 'cubic-bezier(0.05, 0.7, 0.1, 1.0)',
  },
};

export const zIndex = {
  base: 0,
  sticky: 100,
  dropdown: 1000,
  overlay: 1100,
  modal: 1200,
  popover: 1300,
  toast: 1400,
  tooltip: 1500,
};
```

---

## 5. Core Component Inventory

Every component must exist in BOTH `ui-web` and `ui-native` with the same prop API. Build in this order (each is a TDD unit).

### Tier 1 — Primitives

| Component       | Key props                                                                             | Notes                                               |
| --------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `Box` / `Stack` | `padding`, `gap`, `direction`, `align`, `justify`                                     | layout primitive; maps to div/View                  |
| `Text`          | `variant` (textStyle key), `color`, `numberOfLines`                                   |                                                     |
| `Button`        | `variant` (primary/secondary/ghost/danger), `size`, `loading`, `disabled`, `iconLeft` |                                                     |
| `IconButton`    | `icon`, `size`, `label` (a11y)                                                        |                                                     |
| `Icon`          | `name`, `size`, `color`                                                               | shared set (Lucide web, lucide-react-native mobile) |
| `Avatar`        | `src`, `name`, `size`, `presence`                                                     | presence dot reads status tokens                    |
| `Input`         | `value`, `onChange`, `error`, `prefix`, `suffix`                                      |                                                     |
| `Badge`         | `count`, `variant` (mention/unread)                                                   |                                                     |
| `Spinner`       | `size`                                                                                |                                                     |
| `Divider`       | `orientation`                                                                         |                                                     |

### Tier 2 — Composite

| Component           | Purpose                                              |
| ------------------- | ---------------------------------------------------- |
| `Tooltip`           | hover / long-press hints                             |
| `Menu` / `MenuItem` | context menus, overflow actions                      |
| `Modal`             | dialogs (create channel, settings, create workspace) |
| `Popover`           | emoji picker, reactions, profile peek                |
| `Toast`             | transient notifications                              |
| `Tabs`              | thread / files / pins switching                      |
| `SearchField`       | message search input with results                    |

### Tier 3 — Domain (chat-specific)

| Component                  | Purpose                                                                                       |
| -------------------------- | --------------------------------------------------------------------------------------------- |
| `WorkspaceRail`            | thin left icon rail — switches between workspaces (tenants)                                   |
| `WorkspaceSwitcher`        | menu to create/join/switch workspace                                                          |
| `Sidebar`                  | channel + DM list with section headers (scoped to active workspace)                           |
| `SidebarItem`              | channel/DM row with unread/mention badge, presence                                            |
| `ChannelHeader`            | name, topic, member count, header actions                                                     |
| `MessageList`              | virtualized scrollback (react-window web / FlashList native)                                  |
| `MessageRow`               | avatar + sender + timestamp + body + reactions; grouped consecutive messages                  |
| `MessageComposer`          | rich input: formatting, emoji, attach, send                                                   |
| `Reaction` / `ReactionBar` | emoji reactions with counts                                                                   |
| `ThreadPanel`              | right-side thread view                                                                        |
| `TypingIndicator`          | "X is typing…" fed by Centrifugo presence                                                     |
| `PresenceDot`              | online/away/dnd/offline                                                                       |
| `UnreadDivider`            | "New messages" separator line                                                                 |
| `DateSeparator`            | sticky day divider in scrollback                                                              |
| `CallBanner`               | in-channel banner ("Call in progress — N people") driven by Centrifugo signaling; Join button |
| `CallStage`                | active call view: participant video tiles grid + active-speaker highlight                     |
| `ParticipantTile`          | single participant: video/avatar, name, mute/speaking indicator                               |
| `CallControlBar`           | mic toggle, camera toggle, screen-share toggle, leave; reads action/danger tokens             |
| `ScreenShareView`          | focused screen-share track with presenter label                                               |
| `IncomingCallSheet`        | incoming DM-call prompt (accept/decline)                                                      |

---

## 6. Layout Specs (uniform look across platforms)

### Desktop / Web (≥1024px) — 3-column + workspace rail

```
┌──────┬─────────────┬──────────────────────────┬─────────────┐
│ rail │  sidebar    │  channel (header+list+    │  thread     │
│ 68px │  260px      │  composer)  flex-1        │  380px      │
│ (WS) │  (channels) │                           │  (optional) │
└──────┴─────────────┴──────────────────────────┴─────────────┘
```

The 68px rail holds one icon per workspace the user belongs to (multi-tenancy made visible). Selecting a workspace re-scopes the entire sidebar + content area to that tenant.

### Tablet (640–1023px) — 2-column

Rail collapses into the sidebar header; thread becomes an overlay panel.

### Mobile (<640px) — single-column, stack navigation

```
Workspace switcher → Channel list → Channel messages → Thread
```

Bottom tab bar: Home / DMs / Mentions / Search / You. Min 44px touch targets. Composer pinned above the keyboard (keyboard-avoiding view).

**Visual parity rule:** message rows, avatars, colors, spacing, and type scale are identical across all three. Only the navigation shell (columns vs. stack) changes.

---

## 7. Accessibility Baseline (non-negotiable)

- WCAG AA contrast on all text/background token pairs (verified in token tests).
- Every `IconButton` has an accessible `label`.
- Full keyboard nav on web/desktop (arrow keys in message list, `Esc` closes overlays).
- Focus rings use `borderFocus` token, never removed.
- Mobile: respects OS font scaling and reduce-motion.
- Screen-reader roles on all interactive components (RN `accessibilityRole`, web ARIA).

---

## 8. Testing the Design System (TDD)

- **Token tests:** assert light/dark expose identical keys; assert AA contrast ratios for every text-on-surface pair.
- **Component unit tests:** render each variant, assert it reads the correct token (no hardcoded hex/px).
- **Visual regression:** Storybook + Chromatic (or Playwright screenshots) for `ui-web`; Storybook RN for `ui-native`.
- **Lint guard:** custom ESLint rule forbidding raw hex colors and magic pixel numbers inside `ui-web`/`ui-native` — forces token usage.

---

## 9. Definition of Done for the Design System

1. `libs/design-tokens` exports `lightTheme`, `darkTheme`, `space`, `typography`, etc. with a shared key contract.
2. Both `ui-web` and `ui-native` implement all Tier 1–3 components with identical prop APIs.
3. Storybook runs for both libraries; every component has a story per variant.
4. Contrast + token-parity tests pass.
5. ESLint token-guard rule active and passing.
6. A sample screen (one channel with messages, within a workspace) renders visually equivalent on web, desktop, and mobile.
