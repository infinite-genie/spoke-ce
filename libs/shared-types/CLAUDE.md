# @spoke/shared-types

zod v4 schemas + inferred types shared by api, web, and mobile. Holds the
workspace/tenant entities today (spec §5–§6); API DTOs and Centrifugo event
payloads land here with their consumers in later milestones.

- Every exported schema gets a `z.infer` type export and parse/reject tests.
- Add schemas only when a consumer needs them (YAGNI) — not speculatively.
- Test: `npx nx test shared-types`
