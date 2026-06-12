# M1a Token Amendments + Token-Guard Lint Rule Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the three approved DESIGN_SYSTEM.md amendments (remove `sansNative`, drop `timestamp.color`, differentiate `emphasized` easing), sync `@spoke/design-tokens`, and ship the custom token-guard ESLint rule that will police `ui-web`/`ui-native` from their first commit.

**Architecture:** DESIGN_SYSTEM.md is amended first (it stays the value authority), then the token lib follows test-first. The lint guard is a new workspace package `tools/eslint-rules` (plain ESM JS, no build step) exposing a `no-raw-colors` rule; it is wired into the root flat config scoped to the not-yet-existing ui libs (inert until M1b) together with core `no-magic-numbers`.

**Tech Stack:** ESLint 9 flat config custom plugin, ESLint `RuleTester` run under Vitest, zod-free.

**Approved decisions (2026-06-12):** (1) `fontFamily.sansNative` removed — RN expresses "platform default" by not setting fontFamily. (2) `textStyle.timestamp` loses its `color` field — presets are purely typographic; components apply `textTertiary` themselves. (3) `motion.easing.emphasized` becomes `cubic-bezier(0.05, 0.7, 0.1, 1.0)` (Material 3 emphasized-decelerate).

**Reminder from M0 postmortem:** Task 3 creates a workspace package — `package-lock.json` WILL change and MUST be committed; the gate starts with `npm ci`.

---

### Task 1: Amend DESIGN_SYSTEM.md

**Files:**
- Modify: `DESIGN_SYSTEM.md` (§3 typography, §4 motion)

- [ ] **Step 1: Apply the three edits**

In §3, delete this line from the `fontFamily` block:

```ts
  sansNative: undefined, // RN default San Francisco / Roboto
```

(The comment text may have been reflowed by Prettier — delete the whole `sansNative` line whatever its exact comment.) Add one sentence immediately below the code block: `React Native components leave fontFamily unset to get the platform default (San Francisco / Roboto).`

In §3 `textStyle`, change the `timestamp` line to drop the color field:

```ts
  timestamp: { fontSize: fontSize.xs },
```

Add one sentence below the `textStyle` block: `Presets are purely typographic; components apply text colors (e.g. timestamps use textTertiary) from the active theme.`

In §4 `motion`, change `emphasized` so the block reads:

```ts
export const motion = {
  duration: { fast: 100, base: 160, slow: 240 },
  easing: {
    standard: 'cubic-bezier(0.2, 0, 0, 1)',
    emphasized: 'cubic-bezier(0.05, 0.7, 0.1, 1.0)',
  },
};
```

- [ ] **Step 2: Verify formatting**

Run: `npx prettier --check DESIGN_SYSTEM.md`
Expected: clean (run `--write` first if the edit broke formatting).

- [ ] **Step 3: Commit**

```bash
git add DESIGN_SYSTEM.md
git commit -m "docs(design): remove sansNative, drop timestamp color, differentiate emphasized easing"
```

---

### Task 2: Sync `@spoke/design-tokens` (TDD)

**Files:**
- Modify: `libs/design-tokens/src/tokens.spec.ts`
- Modify: `libs/design-tokens/src/typography.ts`, `libs/design-tokens/src/motion.ts`

- [ ] **Step 1: Add the failing assertions**

In `libs/design-tokens/src/tokens.spec.ts`, append inside the `describe('token object shape', ...)` block:

```ts
  it('reflects the 2026-06-12 amendments', () => {
    expect(Object.keys(tokens.fontFamily).sort()).toEqual(['mono', 'sans']);
    expect(tokens.textStyle.timestamp).not.toHaveProperty('color');
    expect(tokens.motion.easing.emphasized).toBe('cubic-bezier(0.05, 0.7, 0.1, 1.0)');
    expect(tokens.motion.easing.emphasized).not.toBe(tokens.motion.easing.standard);
  });
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx nx test design-tokens`
Expected: FAIL — fontFamily has `sansNative`, timestamp has `color`, emphasized equals standard.

- [ ] **Step 3: Apply the token edits**

`libs/design-tokens/src/typography.ts`: delete the `sansNative: undefined,` line; change the timestamp preset to `timestamp: { fontSize: fontSize.xs },`.

`libs/design-tokens/src/motion.ts`: change `emphasized` to `'cubic-bezier(0.05, 0.7, 0.1, 1.0)'`.

- [ ] **Step 4: Run to verify green**

Run: `npx nx test design-tokens && npx nx run-many -t lint typecheck -p design-tokens`
Expected: all 29 tests pass (28 prior + 1 new); lint/typecheck clean.

- [ ] **Step 5: Commit**

```bash
git add libs/design-tokens
git commit -m "feat(design-tokens): apply approved token amendments"
```

---

### Task 3: `tools/eslint-rules` — `no-raw-colors` rule (TDD)

**Files:**
- Create: `tools/eslint-rules/package.json`, `tools/eslint-rules/index.js`
- Test: `tools/eslint-rules/no-raw-colors.spec.js`

- [ ] **Step 1: Create the package scaffolding**

`tools/eslint-rules/package.json`:
```json
{
  "name": "@spoke/eslint-rules",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "index.js",
  "scripts": {
    "lint": "eslint .",
    "test": "vitest run"
  }
}
```

Run: `npm install` (links the workspace — **lockfile changes, commit it in Step 6**).

- [ ] **Step 2: Write the failing test**

`tools/eslint-rules/no-raw-colors.spec.js`:
```js
import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import plugin from '@spoke/eslint-rules';

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 'latest', sourceType: 'module' },
});

describe('no-raw-colors', () => {
  it('accepts token usage and innocent strings', () => {
    ruleTester.run('no-raw-colors', plugin.rules['no-raw-colors'], {
      valid: [
        { code: "const c = tokens.color.primary;" },
        { code: "const border = 'solid';" },
        { code: "const id = 'user#42';" },
        { code: "const tag = 'rgbish';" },
      ],
      invalid: [],
    });
  });

  it('rejects hex, rgb()/rgba(), hsl() literals and template chunks', () => {
    ruleTester.run('no-raw-colors', plugin.rules['no-raw-colors'], {
      valid: [],
      invalid: [
        { code: "const c = '#FFF';", errors: [{ messageId: 'rawColor' }] },
        { code: "const c = '#1E1A3C';", errors: [{ messageId: 'rawColor' }] },
        { code: "const c = 'rgba(0,0,0,0.5)';", errors: [{ messageId: 'rawColor' }] },
        { code: "const c = 'hsl(220, 50%, 50%)';", errors: [{ messageId: 'rawColor' }] },
        { code: 'const s = `1px solid #ABCDEF`;', errors: [{ messageId: 'rawColor' }] },
      ],
    });
  });
});
```

- [ ] **Step 3: Run to verify it fails**

Run: `npx nx test eslint-rules`
Expected: FAIL — `index.js` does not exist / has no rules.

- [ ] **Step 4: Implement the rule**

`tools/eslint-rules/index.js`:
```js
const COLOR_PATTERN = /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b|\b(?:rgba?|hsla?)\(/;

const noRawColors = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow raw color literals (hex, rgb/rgba, hsl/hsla) — use @spoke/design-tokens semantic tokens.',
    },
    messages: {
      rawColor:
        'Raw color "{{value}}" is forbidden here; use a semantic token from @spoke/design-tokens.',
    },
    schema: [],
  },
  create(context) {
    const report = (node, value) =>
      context.report({ node, messageId: 'rawColor', data: { value } });
    return {
      Literal(node) {
        if (typeof node.value === 'string' && COLOR_PATTERN.test(node.value)) {
          report(node, node.value);
        }
      },
      TemplateElement(node) {
        if (COLOR_PATTERN.test(node.value.raw)) {
          report(node, node.value.raw);
        }
      },
    };
  },
};

export default {
  meta: { name: '@spoke/eslint-rules' },
  rules: { 'no-raw-colors': noRawColors },
};
```

- [ ] **Step 5: Run to verify green**

Run: `npx nx test eslint-rules && npx nx run-many -t lint -p eslint-rules`
Expected: tests pass; lint clean.

- [ ] **Step 6: Commit (lockfile included — M0 lesson)**

```bash
git add tools/eslint-rules package-lock.json
git commit -m "feat(eslint-rules): add no-raw-colors token-guard rule"
```

---

### Task 4: Wire the guard into the root flat config (scoped to ui libs)

**Files:**
- Modify: `eslint.config.mjs`

- [ ] **Step 1: Add the scoped block**

In `eslint.config.mjs`, add the import at the top and the block at the end of the config array:

```js
import spokeRules from '@spoke/eslint-rules';
```

```js
  {
    files: ['libs/ui-web/**/*.{ts,tsx}', 'libs/ui-native/**/*.{ts,tsx}'],
    ignores: ['**/*.spec.ts', '**/*.spec.tsx', '**/*.stories.tsx'],
    plugins: { spoke: spokeRules },
    rules: {
      'spoke/no-raw-colors': 'error',
      'no-magic-numbers': [
        'error',
        { ignore: [-1, 0, 1, 2, 100], ignoreArrayIndexes: true, ignoreDefaultValues: true },
      ],
    },
  },
```

(Spec/story files are excluded — tests legitimately assert literal values. The block matches no files until M1b creates the ui libs; that is intentional.)

- [ ] **Step 2: Verify ESLint still runs everywhere and the rule loads**

Run: `npx eslint . && npx nx run-many -t lint`
Expected: exit 0, no output (no ui libs yet → block inert, but a plugin-load error would fail here).

Then prove the guard actually fires — create a throwaway file and expect an error:
```bash
mkdir -p libs/ui-web/src && printf 'export const c = "#FFF";\nexport const n = 37;\n' > libs/ui-web/src/probe.ts
npx eslint libs/ui-web/src/probe.ts
```
Expected: exits non-zero reporting BOTH `spoke/no-raw-colors` and `no-magic-numbers`. Then delete the probe:
```bash
rm -rf libs/ui-web
```

- [ ] **Step 3: Commit**

```bash
git add eslint.config.mjs
git commit -m "chore: enforce token-guard lint rules for future ui libraries"
```

---

### Task 5: Full-gate verification

- [ ] **Step 1: CI parity from a clean install**

Run: `npm ci && npx prettier --check . && npx nx run-many -t lint typecheck test`
Expected: all green — 3 projects (shared-types, design-tokens, eslint-rules); vitest totals: shared-types 7, design-tokens 29, eslint-rules 2.

- [ ] **Step 2: Commit history check**

Run: `npx commitlint --from=main --to=HEAD --verbose`
Expected: all commits pass.

Hand off via superpowers:finishing-a-development-branch (push + PR; main is protected).
