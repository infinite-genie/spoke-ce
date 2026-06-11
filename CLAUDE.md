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
