# @spoke/design-tokens

Platform-agnostic design tokens. **`DESIGN_SYSTEM.md` (repo root) is the source
of truth — never invent, rename, or adjust a token value here.** If a needed
token is missing, stop and flag it.

- Both themes must expose identical semantic keys (parity test enforces this).
- AA contrast tests enforce the pair list in `src/contrast.spec.ts` — never
  loosen a threshold or token value to make a test pass.
- Test: `npx nx test design-tokens`
