# @spoke/shared-types

zod v4 schemas + inferred types shared by api, web, and mobile: entities, API
DTOs, Centrifugo event payloads. Spec §5–§6 defines the entities.

- Every exported schema gets a `z.infer` type export and parse/reject tests.
- Add schemas only when a consumer needs them (YAGNI) — not speculatively.
- Test: `npx nx test shared-types`
