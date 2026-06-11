# M0 Foundations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the Spoke Nx monorepo skeleton with `libs/shared-types` and `libs/design-tokens` (fully tested), local quality gates (ESLint, Prettier, commitlint, Husky), a GitHub Actions CI pipeline, and a GitHub Project bootstrap script.

**Architecture:** Package-based Nx workspace over npm workspaces — each lib is an npm package with its own `lint`/`typecheck`/`test` scripts that Nx discovers and caches; no Nx generators or executors needed at this stage. Token _values_ are copied verbatim from `DESIGN_SYSTEM.md` (the authoritative source — never invent or "improve" a value). Contracts are zod v4 schemas in `@spoke/shared-types`.

**Tech Stack:** Nx 21, TypeScript 5.8 (strict), Vitest 3, zod 4, ESLint 9 (flat config) + typescript-eslint 8, Prettier 3, Husky 9 + commitlint 19, GitHub Actions, `gh` CLI.

**Reference docs (in repo):** `docs/superpowers/specs/2026-06-11-spoke-architecture-design.md` (the spec), `DESIGN_SYSTEM.md` (token source of truth).

---

### Task 1: Nx workspace skeleton

**Files:**

- Create: `package.json`, `nx.json`, `tsconfig.base.json`, `.gitignore`, `.nvmrc`, `.editorconfig`

- [ ] **Step 1: Create root `package.json`**

```json
{
  "name": "spoke",
  "version": "0.0.0",
  "private": true,
  "license": "AGPL-3.0-only",
  "type": "module",
  "workspaces": ["apps/*", "libs/*", "tools/*"],
  "engines": { "node": ">=22" },
  "scripts": {
    "prepare": "husky",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  },
  "devDependencies": {
    "@commitlint/cli": "^19.8.0",
    "@commitlint/config-conventional": "^19.8.0",
    "@eslint/js": "^9.30.0",
    "eslint": "^9.30.0",
    "husky": "^9.1.7",
    "nx": "^21.3.0",
    "prettier": "^3.6.0",
    "typescript": "^5.8.3",
    "typescript-eslint": "^8.35.0",
    "vite-tsconfig-paths": "^5.1.4",
    "vitest": "^3.2.0"
  }
}
```

(`"prepare": "husky"` will print a harmless warning until Task 3 installs Husky's hook dir — that's expected.)

- [ ] **Step 2: Create `nx.json`**

```json
{
  "$schema": "https://raw.githubusercontent.com/nrwl/nx/master/packages/nx/schemas/nx-schema.json",
  "defaultBase": "main",
  "targetDefaults": {
    "lint": { "cache": true },
    "typecheck": { "cache": true },
    "test": { "cache": true }
  }
}
```

- [ ] **Step 3: Create `tsconfig.base.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "baseUrl": ".",
    "paths": {
      "@spoke/shared-types": ["libs/shared-types/src/index.ts"],
      "@spoke/design-tokens": ["libs/design-tokens/src/index.ts"]
    }
  }
}
```

- [ ] **Step 4: Create `.gitignore`, `.nvmrc`, `.editorconfig`**

`.gitignore`:

```
node_modules/
dist/
coverage/
.nx/cache
.nx/workspace-data
.env
*.local
```

`.nvmrc`:

```
22
```

`.editorconfig`:

```
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
indent_style = space
indent_size = 2
```

- [ ] **Step 5: Install and verify**

Run: `npm install && npx nx report`
Expected: install succeeds; `nx report` prints `nx : 21.x.x`. (Husky prepare warning is fine for now.)

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json nx.json tsconfig.base.json .gitignore .nvmrc .editorconfig
git commit -m "chore: scaffold Nx package-based monorepo workspace"
```

---

### Task 2: Prettier + ESLint (flat config)

**Files:**

- Create: `.prettierrc.json`, `.prettierignore`, `eslint.config.mjs`

- [ ] **Step 1: Create `.prettierrc.json` and `.prettierignore`**

`.prettierrc.json`:

```json
{
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100
}
```

`.prettierignore`:

```
node_modules/
dist/
coverage/
.nx/
package-lock.json
```

- [ ] **Step 2: Create `eslint.config.mjs`**

```js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['**/node_modules/**', '**/dist/**', '**/coverage/**', '.nx/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
);
```

- [ ] **Step 3: Verify both tools run clean**

Run: `npx prettier --check . && npx eslint .`
Expected: prettier reports all files formatted (run `npx prettier --write .` first if it flags the JSON/MD files just created); eslint exits 0 with no output (no TS files exist yet).

- [ ] **Step 4: Commit**

```bash
git add .prettierrc.json .prettierignore eslint.config.mjs
git commit -m "chore: add Prettier and ESLint flat config with typescript-eslint"
```

---

### Task 3: Husky + commitlint

**Files:**

- Create: `commitlint.config.mjs`, `.husky/commit-msg`, `.husky/pre-commit`

- [ ] **Step 1: Create `commitlint.config.mjs`**

```js
export default { extends: ['@commitlint/config-conventional'] };
```

- [ ] **Step 2: Initialize Husky and create hooks**

Run: `npx husky init`

Replace `.husky/pre-commit` contents with:

```
npx nx affected -t lint typecheck test --uncommitted
```

Create `.husky/commit-msg`:

```
npx --no-install commitlint --edit "$1"
```

- [ ] **Step 3: Verify commitlint rejects a bad message and accepts a good one**

Run: `echo "bad message" | npx commitlint`
Expected: FAIL — `subject may not be empty` / `type may not be empty`.

Run: `echo "feat: add thing" | npx commitlint`
Expected: exit 0, no errors.

- [ ] **Step 4: Commit (this also exercises the hooks for real)**

```bash
git add commitlint.config.mjs .husky/ package.json
git commit -m "chore: add Husky hooks and commitlint with conventional commits"
```

Expected: pre-commit runs `nx affected` (no projects yet → succeeds immediately); commit-msg passes.

---

### Task 4: `libs/shared-types` — workspace/tenant contracts (TDD)

**Files:**

- Create: `libs/shared-types/package.json`, `libs/shared-types/tsconfig.json`, `libs/shared-types/vitest.config.ts`
- Create: `libs/shared-types/src/index.ts`
- Test: `libs/shared-types/src/index.spec.ts`

Scope (spec §5/§6, YAGNI — channel/message schemas arrive in M4 when first used): `User`, `Workspace`, `WorkspaceRole`, `WorkspaceMember`, `WorkspaceContext`.

- [ ] **Step 1: Create the package scaffolding**

`libs/shared-types/package.json`:

```json
{
  "name": "@spoke/shared-types",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "scripts": {
    "lint": "eslint src",
    "typecheck": "tsc --noEmit -p tsconfig.json",
    "test": "vitest run"
  },
  "dependencies": { "zod": "^4.0.0" }
}
```

`libs/shared-types/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "include": ["src/**/*.ts", "vitest.config.ts"]
}
```

`libs/shared-types/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths({ root: '../..' })],
  test: { environment: 'node' },
});
```

Run: `npm install`
Expected: zod added; workspace links `@spoke/shared-types`.

- [ ] **Step 2: Write the failing test**

`libs/shared-types/src/index.spec.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  UserSchema,
  WorkspaceSchema,
  WorkspaceRoleSchema,
  WorkspaceMemberSchema,
  WorkspaceContextSchema,
} from '@spoke/shared-types';

const uuid = '0197a1f0-7e2a-7b3c-8d4e-5f6a7b8c9d0e';
const iso = '2026-06-11T12:00:00.000Z';

describe('UserSchema', () => {
  it('parses a valid user', () => {
    const user = {
      id: uuid,
      email: 'rony@example.com',
      displayName: 'Rony',
      avatarUrl: null,
      createdAt: iso,
    };
    expect(UserSchema.parse(user)).toEqual(user);
  });

  it('rejects an invalid email', () => {
    expect(
      UserSchema.safeParse({
        id: uuid,
        email: 'nope',
        displayName: 'R',
        avatarUrl: null,
        createdAt: iso,
      }).success,
    ).toBe(false);
  });
});

describe('WorkspaceSchema', () => {
  it('parses a valid workspace', () => {
    const ws = { id: uuid, name: 'Acme', slug: 'acme', createdAt: iso };
    expect(WorkspaceSchema.parse(ws)).toEqual(ws);
  });

  it('rejects a non-uuid id and an invalid slug', () => {
    expect(
      WorkspaceSchema.safeParse({ id: 'x', name: 'Acme', slug: 'acme', createdAt: iso }).success,
    ).toBe(false);
    expect(
      WorkspaceSchema.safeParse({ id: uuid, name: 'Acme', slug: 'Not A Slug!', createdAt: iso })
        .success,
    ).toBe(false);
  });
});

describe('WorkspaceRoleSchema', () => {
  it('accepts exactly owner | admin | member', () => {
    expect(WorkspaceRoleSchema.options).toEqual(['owner', 'admin', 'member']);
    expect(WorkspaceRoleSchema.safeParse('guest').success).toBe(false);
  });
});

describe('WorkspaceMemberSchema', () => {
  it('parses a valid membership', () => {
    const m = { workspaceId: uuid, userId: uuid, role: 'member', joinedAt: iso };
    expect(WorkspaceMemberSchema.parse(m)).toEqual(m);
  });
});

describe('WorkspaceContextSchema', () => {
  it('parses the guard-attached context', () => {
    const ctx = { userId: uuid, workspaceId: uuid, role: 'admin' };
    expect(WorkspaceContextSchema.parse(ctx)).toEqual(ctx);
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx nx test shared-types`
Expected: FAIL — cannot resolve `@spoke/shared-types` / `src/index.ts` does not exist.

- [ ] **Step 4: Write the implementation**

`libs/shared-types/src/index.ts`:

```ts
import { z } from 'zod';

export const UserSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  displayName: z.string().min(1).max(80),
  avatarUrl: z.url().nullable(),
  createdAt: z.iso.datetime(),
});
export type User = z.infer<typeof UserSchema>;

export const WorkspaceSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1).max(80),
  slug: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/),
  createdAt: z.iso.datetime(),
});
export type Workspace = z.infer<typeof WorkspaceSchema>;

export const WorkspaceRoleSchema = z.enum(['owner', 'admin', 'member']);
export type WorkspaceRole = z.infer<typeof WorkspaceRoleSchema>;

export const WorkspaceMemberSchema = z.object({
  workspaceId: z.uuid(),
  userId: z.uuid(),
  role: WorkspaceRoleSchema,
  joinedAt: z.iso.datetime(),
});
export type WorkspaceMember = z.infer<typeof WorkspaceMemberSchema>;

/** Attached to every request by TenantContextGuard (spec §4). */
export const WorkspaceContextSchema = z.object({
  userId: z.uuid(),
  workspaceId: z.uuid(),
  role: WorkspaceRoleSchema,
});
export type WorkspaceContext = z.infer<typeof WorkspaceContextSchema>;
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx nx test shared-types`
Expected: PASS — 5 test groups, all green.

Run: `npx nx run-many -t lint typecheck -p shared-types`
Expected: both pass.

- [ ] **Step 6: Commit**

```bash
git add libs/shared-types package-lock.json
git commit -m "feat(shared-types): add workspace/tenant zod contracts"
```

---

### Task 5: `libs/design-tokens` — token files + parity test (TDD)

**Files:**

- Create: `libs/design-tokens/package.json`, `libs/design-tokens/tsconfig.json`, `libs/design-tokens/vitest.config.ts`
- Create: `libs/design-tokens/src/colors.ts`, `spacing.ts`, `typography.ts`, `radii.ts`, `shadows.ts`, `motion.ts`, `z-index.ts`, `index.ts`
- Test: `libs/design-tokens/src/tokens.spec.ts`

**CRITICAL:** every value below is copied verbatim from `DESIGN_SYSTEM.md` §1–§4. If anything here ever disagrees with `DESIGN_SYSTEM.md`, the design doc wins. Never invent or adjust a value.

- [ ] **Step 1: Create the package scaffolding** — same three files as Task 4 with name `@spoke/design-tokens` and **no dependencies**:

`libs/design-tokens/package.json`:

```json
{
  "name": "@spoke/design-tokens",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "scripts": {
    "lint": "eslint src",
    "typecheck": "tsc --noEmit -p tsconfig.json",
    "test": "vitest run"
  }
}
```

`libs/design-tokens/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "include": ["src/**/*.ts", "vitest.config.ts"]
}
```

`libs/design-tokens/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths({ root: '../..' })],
  test: { environment: 'node' },
});
```

- [ ] **Step 2: Write the failing parity test**

`libs/design-tokens/src/tokens.spec.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { lightTheme, darkTheme, tokens } from '@spoke/design-tokens';

const sortedKeys = (o: Record<string, unknown>) => Object.keys(o).sort();

describe('theme key parity (DESIGN_SYSTEM.md §1.3: both themes expose identical keys)', () => {
  it('light and dark expose the same semantic color keys', () => {
    expect(sortedKeys(darkTheme.color)).toEqual(sortedKeys(lightTheme.color));
  });

  it('every semantic color value is a non-empty string', () => {
    for (const theme of [lightTheme, darkTheme]) {
      for (const [key, value] of Object.entries(theme.color)) {
        expect(typeof value, `${key}`).toBe('string');
        expect((value as string).length).toBeGreaterThan(0);
      }
    }
  });
});

describe('token object shape', () => {
  it('exposes the platform-agnostic token groups', () => {
    expect(sortedKeys(tokens)).toEqual(
      [
        'fontFamily',
        'fontSize',
        'fontWeight',
        'layout',
        'lineHeight',
        'motion',
        'radius',
        'shadow',
        'space',
        'textStyle',
        'zIndex',
      ].sort(),
    );
  });

  it('spot-checks values against DESIGN_SYSTEM.md', () => {
    expect(tokens.space[4]).toBe(16);
    expect(tokens.layout.workspaceRailWidth).toBe(68);
    expect(tokens.layout.sidebarWidth).toBe(260);
    expect(tokens.fontSize.base).toBe(15);
    expect(tokens.radius.full).toBe(9999);
    expect(tokens.zIndex.tooltip).toBe(1500);
    expect(tokens.motion.duration.base).toBe(160);
    expect(lightTheme.color.bgSidebar).toBe('#1E1A3C');
    expect(darkTheme.color.bgSidebar).toBe('#16122B');
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx nx test design-tokens`
Expected: FAIL — `@spoke/design-tokens` has no `src/index.ts`.

- [ ] **Step 4: Create the token files (verbatim from DESIGN_SYSTEM.md)**

`libs/design-tokens/src/colors.ts` — copy the **entire** `palette`, `lightTheme`, and `darkTheme` blocks from `DESIGN_SYSTEM.md` §1.1, §1.2, §1.3, exporting all three with `as const`. The file must contain every key shown in the design doc (palette: indigo950…cyan400; both themes: bgApp…unreadBadge) with the exact hex/rgba strings. Structure:

```ts
export const palette = {
  indigo950: '#16122B',
  indigo900: '#1E1A3C',
  indigo800: '#2A2456',
  indigo700: '#372E70',
  indigo600: '#4A3E96',
  indigo500: '#5E4FB8',
  indigo400: '#7E70D6',
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
  gray900: '#1C1C22',
  blue500: '#1F6FEB',
  blue600: '#1657C2',
  green500: '#1A8A5A',
  green400: '#27B377',
  red500: '#E0335E',
  red600: '#C01F46',
  amber400: '#ECA72E',
  cyan400: '#36BCF0',
} as const;

export const lightTheme = {
  color: {
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
    textPrimary: palette.gray900,
    textSecondary: palette.gray600,
    textTertiary: palette.gray500,
    textOnBrand: palette.white,
    textOnSidebar: 'rgba(255,255,255,0.72)',
    textOnSidebarActive: palette.white,
    textLink: palette.blue500,
    textDanger: palette.red500,
    textSuccess: palette.green500,
    border: palette.gray200,
    borderStrong: palette.gray300,
    borderFocus: palette.blue500,
    primary: palette.indigo500,
    primaryHover: palette.indigo600,
    actionSend: palette.green500,
    actionSendHover: palette.green400,
    online: palette.green500,
    away: palette.amber400,
    dnd: palette.red500,
    offline: palette.gray400,
    mentionBadge: palette.red500,
    unreadBadge: palette.white,
  },
} as const;

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
} as const;

export type Theme = { color: Record<keyof typeof lightTheme.color, string> };
```

`libs/design-tokens/src/spacing.ts`:

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
} as const;

export const layout = {
  sidebarWidth: 260,
  workspaceRailWidth: 68,
  threadPanelWidth: 380,
  messageGutter: space[4],
  messageRowPaddingY: space[2],
  inputBarMinHeight: 44,
  headerHeight: 49,
  touchTarget: 44,
} as const;
```

`libs/design-tokens/src/typography.ts`:

```ts
export const fontFamily = {
  sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif',
  mono: '"SF Mono", Menlo, Consolas, "Roboto Mono", monospace',
  sansNative: undefined,
} as const;

export const fontSize = { xs: 11, sm: 13, base: 15, md: 16, lg: 18, xl: 22, '2xl': 28 } as const;

export const fontWeight = { regular: '400', medium: '500', semibold: '600', bold: '700' } as const;

export const lineHeight = { tight: 1.2, base: 1.46, relaxed: 1.6 } as const;

export const textStyle = {
  messageBody: {
    fontSize: fontSize.base,
    lineHeight: lineHeight.base,
    fontWeight: fontWeight.regular,
  },
  senderName: { fontSize: fontSize.base, fontWeight: fontWeight.bold },
  timestamp: { fontSize: fontSize.xs, color: 'textTertiary' },
  channelName: { fontSize: fontSize.md, fontWeight: fontWeight.bold },
  sidebarItem: { fontSize: fontSize.base, fontWeight: fontWeight.regular },
  sectionHeader: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    textTransform: 'uppercase',
  },
  code: { fontFamily: fontFamily.mono, fontSize: fontSize.sm },
} as const;
```

`libs/design-tokens/src/radii.ts`:

```ts
export const radius = { none: 0, sm: 4, base: 6, md: 8, lg: 12, xl: 16, full: 9999 } as const;
```

`libs/design-tokens/src/shadows.ts`:

```ts
export const shadow = {
  sm: '0 1px 2px rgba(0,0,0,0.08)',
  base: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)',
  md: '0 4px 12px rgba(0,0,0,0.15)',
  lg: '0 8px 24px rgba(0,0,0,0.18)',
  popover: '0 6px 18px rgba(0,0,0,0.22)',
} as const;

/** RN elevation map per DESIGN_SYSTEM.md §4 */
export const shadowElevation = { sm: 2, base: 3, md: 6, lg: 12, popover: 10 } as const;
```

`libs/design-tokens/src/motion.ts`:

```ts
export const motion = {
  duration: { fast: 100, base: 160, slow: 240 },
  easing: { standard: 'cubic-bezier(0.2, 0, 0, 1)', emphasized: 'cubic-bezier(0.2, 0, 0, 1)' },
} as const;
```

`libs/design-tokens/src/z-index.ts`:

```ts
export const zIndex = {
  base: 0,
  sticky: 100,
  dropdown: 1000,
  overlay: 1100,
  modal: 1200,
  popover: 1300,
  toast: 1400,
  tooltip: 1500,
} as const;
```

`libs/design-tokens/src/index.ts`:

```ts
import { space, layout } from './spacing';
import { fontFamily, fontSize, fontWeight, lineHeight, textStyle } from './typography';
import { radius } from './radii';
import { shadow, shadowElevation } from './shadows';
import { motion } from './motion';
import { zIndex } from './z-index';

export { palette, lightTheme, darkTheme, type Theme } from './colors';
export {
  space,
  layout,
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  textStyle,
  radius,
  shadow,
  shadowElevation,
  motion,
  zIndex,
};
export { contrastRatio } from './contrast';

/** Platform-agnostic tokens (theme-independent). Themes carry `color`. */
export const tokens = {
  space,
  layout,
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  textStyle,
  radius,
  shadow,
  motion,
  zIndex,
} as const;
```

(`./contrast` doesn't exist until Task 6 — for this task, **omit** the `export { contrastRatio }` line and add it in Task 6. `shadowElevation` is exported standalone but deliberately not part of `tokens` — it's an RN rendering detail, not a design value.)

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx nx test design-tokens`
Expected: PASS — parity, value-type, shape, and spot-check tests green.

Run: `npx nx run-many -t lint typecheck -p design-tokens`
Expected: both pass.

- [ ] **Step 6: Commit**

```bash
git add libs/design-tokens
git commit -m "feat(design-tokens): add token source of truth from DESIGN_SYSTEM.md"
```

---

### Task 6: WCAG contrast utility + AA contrast tests (TDD)

**Files:**

- Create: `libs/design-tokens/src/contrast.ts`
- Test: `libs/design-tokens/src/contrast.spec.ts`
- Modify: `libs/design-tokens/src/index.ts` (add the `contrastRatio` export line shown in Task 5)

Contrast pairs and thresholds: AA normal text (≥4.5) for the primary reading pairs; AA large/UI (≥3.0) for tertiary/supplementary pairs (timestamps render at `fontSize.xs` as supplementary content; button labels are medium-weight UI text — full 4.5 enforcement for component-level pairs is revisited in M1 with real components). The pair list below is exhaustive for this task — do not silently add or drop pairs.

- [ ] **Step 1: Write the failing tests**

`libs/design-tokens/src/contrast.spec.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { contrastRatio, lightTheme, darkTheme } from '@spoke/design-tokens';

describe('contrastRatio', () => {
  it('computes 21:1 for black on white', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 0);
  });

  it('computes 1:1 for identical colors', () => {
    expect(contrastRatio('#5E4FB8', '#5E4FB8')).toBeCloseTo(1, 5);
  });

  it('composites rgba foregrounds over the background', () => {
    // 50% white over black ≈ #808080-ish, well below white-on-black contrast
    const r = contrastRatio('rgba(255,255,255,0.5)', '#000000');
    expect(r).toBeGreaterThan(3);
    expect(r).toBeLessThan(8);
  });
});

const AA_NORMAL = 4.5;
const AA_LARGE = 3.0;

const pairs45: ReadonlyArray<readonly [string, string]> = [
  ['textPrimary', 'bgApp'],
  ['textPrimary', 'bgSecondary'],
  ['textPrimary', 'bgElevated'],
  ['textSecondary', 'bgApp'],
  ['textOnSidebar', 'bgSidebar'],
  ['textOnSidebarActive', 'bgSidebarActive'],
  ['textLink', 'bgApp'],
] as const;

const pairs30: ReadonlyArray<readonly [string, string]> = [
  ['textTertiary', 'bgApp'],
  ['textOnBrand', 'primary'],
  ['textDanger', 'bgApp'],
] as const;

describe.each([
  ['light', lightTheme],
  ['dark', darkTheme],
] as const)('WCAG AA contrast — %s theme', (_name, theme) => {
  it.each(pairs45)('%s on %s ≥ 4.5:1', (fg, bg) => {
    const c = theme.color as Record<string, string>;
    expect(contrastRatio(c[fg]!, c[bg]!)).toBeGreaterThanOrEqual(AA_NORMAL);
  });

  it.each(pairs30)('%s on %s ≥ 3.0:1', (fg, bg) => {
    const c = theme.color as Record<string, string>;
    expect(contrastRatio(c[fg]!, c[bg]!)).toBeGreaterThanOrEqual(AA_LARGE);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx nx test design-tokens`
Expected: FAIL — `contrastRatio` is not exported.

- [ ] **Step 3: Implement `contrast.ts` and add the export**

`libs/design-tokens/src/contrast.ts`:

```ts
type Rgb = readonly [number, number, number];

function parseHex(hex: string): Rgb {
  const h = hex.replace('#', '');
  const full =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

/** Parses #rgb/#rrggbb or rgba(r,g,b,a); rgba is alpha-composited over `backdrop`. */
function parseColor(input: string, backdrop: Rgb): Rgb {
  const rgba = input.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/);
  if (rgba) {
    const [, r, g, b, a] = rgba;
    const alpha = a === undefined ? 1 : Number(a);
    return [Number(r), Number(g), Number(b)].map(
      (c, i) => c * alpha + backdrop[i]! * (1 - alpha),
    ) as unknown as Rgb;
  }
  if (input.startsWith('#')) return parseHex(input);
  throw new Error(`Unsupported color format: ${input}`);
}

function luminance([r, g, b]: Rgb): number {
  const lin = (c: number) => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** WCAG 2.x contrast ratio. `bg` must be opaque; rgba `fg` is composited over it. */
export function contrastRatio(fg: string, bg: string): number {
  const bgRgb = parseColor(bg, [255, 255, 255]);
  const fgRgb = parseColor(fg, bgRgb);
  const l1 = luminance(fgRgb);
  const l2 = luminance(bgRgb);
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}
```

In `libs/design-tokens/src/index.ts`, add (as shown in Task 5's index):

```ts
export { contrastRatio } from './contrast';
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx nx test design-tokens`
Expected: PASS — utility tests and all pair checks in both themes green. If a pair fails, do NOT change the threshold or the token: report it — the design doc owns the values.

- [ ] **Step 5: Commit**

```bash
git add libs/design-tokens
git commit -m "feat(design-tokens): add WCAG contrast utility and AA token tests"
```

---

### Task 7: GitHub Actions CI

**Files:**

- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create the workflow**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - name: Format check
        run: npx prettier --check .
      - name: Lint, typecheck, test
        run: npx nx run-many -t lint typecheck test
      - name: Commitlint (PR commits)
        if: github.event_name == 'pull_request'
        run: npx commitlint --from=${{ github.event.pull_request.base.sha }} --to=HEAD --verbose
```

- [ ] **Step 2: Verify locally (CI parity)**

Run: `npx prettier --check . && npx nx run-many -t lint typecheck test`
Expected: all green — identical commands to the workflow.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add quality workflow (format, lint, typecheck, test, commitlint)"
```

Note for the PR: branch protection (require the `quality` job before merge) is a GitHub-settings step the repo owner does once in the UI; record it in the PR description as a manual follow-up.

---

### Task 8: GitHub Project bootstrap script

**Files:**

- Create: `scripts/bootstrap-github-project.sh`

The script creates milestones M0–M10 (titles/descriptions from spec §13), one tracking issue per milestone, and a "Spoke Roadmap" GitHub Project containing them. It requires a GitHub remote and `gh auth login` with the `project` scope; it is run manually once, never in CI. `--dry-run` prints every action without calling `gh` mutations.

- [ ] **Step 1: Write the script**

```bash
#!/usr/bin/env bash
set -euo pipefail

DRY_RUN=0
[[ "${1:-}" == "--dry-run" ]] && DRY_RUN=1

run() {
  if [[ $DRY_RUN -eq 1 ]]; then echo "DRY-RUN: $*"; else "$@"; fi
}

command -v gh >/dev/null || { echo "ERROR: gh CLI is required" >&2; exit 1; }
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner) \
  || { echo "ERROR: no GitHub remote configured (push the repo first)" >&2; exit 1; }
echo "Repo: $REPO"

MILESTONES=(
  "M0 Foundations|Nx skeleton, shared-types, design-tokens, CI bootstrap, this script"
  "M1 Design system|Design plugin run, ui-web + ui-native + Storybook, token tests, GitNexus + per-folder CLAUDE.md"
  "M2 Infra|docker-compose (postgres, redis, centrifugo, livekit, minio, meilisearch, api, web) + configs + self-hosting draft"
  "M3 Identity & tenancy|Auth, workspaces, memberships, roles, invites, TenantContextGuard, scoped data layer, isolation tests"
  "M4 Messaging core|Channels/DMs, Centrifugo, messages, threads, reactions, presence, read state"
  "M5 Files + search|Presigned MinIO flow, attachments, Meilisearch index-per-workspace"
  "M6 Web client|Full v1 UI: workspace rail, sidebar, channel view, composer, threads, search, files"
  "M7 Calls|LiveKit tokens + lifecycle + webhooks, Centrifugo signaling, web call UI, screen share"
  "M8 Desktop|Tauri shell + screen-share publishing spike"
  "M9 Mobile|RN parity, LiveKit RN, screen-capture setup"
  "M10 Hardening|Full E2E in Docker, CI gates complete, self-hosting docs final"
)

existing_milestones=$([[ $DRY_RUN -eq 1 ]] && echo "" || gh api "repos/$REPO/milestones?state=all" -q '.[].title')

for entry in "${MILESTONES[@]}"; do
  title="${entry%%|*}"; desc="${entry#*|}"
  if grep -qxF "$title" <<<"$existing_milestones"; then
    echo "milestone exists, skipping: $title"
  else
    run gh api -X POST "repos/$REPO/milestones" -f title="$title" -f description="$desc"
  fi
done

for entry in "${MILESTONES[@]}"; do
  title="${entry%%|*}"; desc="${entry#*|}"
  issue_title="Tracking: $title"
  if [[ $DRY_RUN -eq 0 ]] && gh issue list --search "in:title \"$issue_title\"" --json title -q '.[].title' | grep -qxF "$issue_title"; then
    echo "issue exists, skipping: $issue_title"
  else
    run gh issue create --title "$issue_title" --milestone "$title" \
      --body "Tracking issue for **$title**: $desc. Work items are broken out as child issues; one issue = one worktree = one branch = one PR."
  fi
done

PROJECT_TITLE="Spoke Roadmap"
if [[ $DRY_RUN -eq 0 ]]; then
  owner="${REPO%%/*}"
  pnum=$(gh project list --owner "$owner" --format json -q ".projects[] | select(.title == \"$PROJECT_TITLE\") | .number" || true)
  if [[ -z "$pnum" ]]; then
    pnum=$(gh project create --owner "$owner" --title "$PROJECT_TITLE" --format json -q .number)
    echo "created project #$pnum"
  fi
  gh issue list --limit 100 --json url -q '.[].url' | while read -r url; do
    gh project item-add "$pnum" --owner "$owner" --url "$url" || true
  done
else
  echo "DRY-RUN: would create project '$PROJECT_TITLE' and add all tracking issues"
fi

echo "Done."
```

Run: `chmod +x scripts/bootstrap-github-project.sh`

- [ ] **Step 2: Verify with dry-run and shellcheck**

Run: `bash -n scripts/bootstrap-github-project.sh && scripts/bootstrap-github-project.sh --dry-run`
Expected: syntax OK; if a remote exists, a `DRY-RUN:` line per milestone/issue and the project line; if no remote yet, the clear "no GitHub remote configured" error — both outcomes are acceptable for this step. If `shellcheck` is installed, run it; fix any warnings.

- [ ] **Step 3: Commit**

```bash
git add scripts/bootstrap-github-project.sh
git commit -m "chore: add GitHub Project bootstrap script (milestones M0-M10)"
```

---

### Task 9: CLAUDE.md routing files

**Files:**

- Create: `CLAUDE.md`, `libs/shared-types/CLAUDE.md`, `libs/design-tokens/CLAUDE.md`

Root stays routing-only (spec §11); each package carries its own scoped context.

- [ ] **Step 1: Create root `CLAUDE.md`**

```markdown
# Spoke

Self-hostable, multi-tenant team chat. Architecture & all pinned decisions:
`docs/superpowers/specs/2026-06-11-spoke-architecture-design.md`. Visual design
source of truth: `DESIGN_SYSTEM.md`.

## Routing — read the CLAUDE.md of the package you are working in

- `libs/shared-types/CLAUDE.md` — zod contracts
- `libs/design-tokens/CLAUDE.md` — design tokens

## Workspace conventions

- Nx package-based monorepo; every package has `lint`, `typecheck`, `test` scripts.
- Run targets via `npx nx run-many -t lint typecheck test` or `npx nx test <project>`.
- Conventional commits enforced (commitlint + Husky). TDD: failing test first, always.
```

- [ ] **Step 2: Create the two package files**

`libs/shared-types/CLAUDE.md`:

```markdown
# @spoke/shared-types

zod v4 schemas + inferred types shared by api, web, and mobile: entities, API
DTOs, Centrifugo event payloads. Spec §5–§6 defines the entities.

- Every exported schema gets a `z.infer` type export and parse/reject tests.
- Add schemas only when a consumer needs them (YAGNI) — not speculatively.
- Test: `npx nx test shared-types`
```

`libs/design-tokens/CLAUDE.md`:

```markdown
# @spoke/design-tokens

Platform-agnostic design tokens. **`DESIGN_SYSTEM.md` (repo root) is the source
of truth — never invent, rename, or adjust a token value here.** If a needed
token is missing, stop and flag it.

- Both themes must expose identical semantic keys (parity test enforces this).
- AA contrast tests enforce the pair list in `src/contrast.spec.ts` — never
  loosen a threshold or token value to make a test pass.
- Test: `npx nx test design-tokens`
```

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md libs/shared-types/CLAUDE.md libs/design-tokens/CLAUDE.md
git commit -m "docs: add routing CLAUDE.md and per-package context files"
```

---

### Task 10: Full-gate verification

- [ ] **Step 1: Run everything exactly as CI will**

Run: `npx prettier --check . && npx nx run-many -t lint typecheck test`
Expected: format clean; lint, typecheck, test green for `shared-types` and `design-tokens` (2 projects, 0 failures). Fix anything red before proceeding — this is the merge gate.

- [ ] **Step 2: Verify commit history is conventional**

Run: `npx commitlint --from=main --to=HEAD --verbose`
Expected: all task commits pass.

M0 is complete when both steps are green. Hand off via superpowers:finishing-a-development-branch (merge/PR decision happens there).
