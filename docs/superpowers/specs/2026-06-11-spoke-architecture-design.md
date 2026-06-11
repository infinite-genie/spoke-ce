# Spoke — Architecture & Decisions Spec

**Date:** 2026-06-11
**Status:** Approved (brainstorm sign-off complete; chunks 1–4 approved individually)
**Scope:** Master architecture spec for Spoke, an open-source, self-hostable, multi-tenant team communication platform. Per-milestone implementation plans derive from this document. The visual design is specified separately and authoritatively in `DESIGN_SYSTEM.md` (tokens, components, layouts) and `DESIGN_PLUGIN_PROMPT.md` (design-plugin input); this spec does not redefine any of it.

---

## 1. Product summary

Spoke is a workspace-based team chat platform: channels, DMs, threads, reactions, presence, search, file sharing, and real-time voice/video calls with screen share. A user account can belong to many workspaces; each workspace is an isolated tenant. Clients: web (Next.js), desktop (Tauri wrapping the web build), mobile (React Native/Expo). Fully Dockerized for self-hosting.

Two realtime planes, deliberately separate:

- **Data plane (text/presence/signaling):** Centrifugo pub/sub over WebSocket.
- **Media plane (audio/video/screen share):** LiveKit SFU.

Both planes are authorized by the same workspace-membership model. Calls are never a special case that bypasses tenancy.

## 2. Decision register

Every decision below was proposed with alternatives and explicitly approved.

| #   | Decision                     | Choice                                                                                                                      | Key rationale                                                                                                                            |
| --- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Tenancy isolation            | Shared DB + mandatory `workspace_id` scoping                                                                                | Simple ops and migrations, easy Testcontainers testing; schema designed so Postgres RLS can be layered on later as hardening             |
| 2   | Calls timing                 | Designed-in from day one; shipped as the calls milestone (M7) after the web client                                          | Calls reuse the proven auth path; v1 text plane validated first; call UI needs a client to live in                                       |
| 3   | Auth                         | Email/password + identity-only JWT (access ~10 min) + rotating refresh; OIDC later                                          | Workspace context from URL + per-request membership check → instant revocation, no stale role claims                                     |
| 4   | ORM / data layer             | Drizzle + tenant-scoped repository pattern                                                                                  | Thin over SQL; repos constructed from `WorkspaceContext`; raw client unexported; plain SQL migrations keep RLS option clean              |
| 5   | Centrifugo subscription auth | Per-channel subscribe tokens (~5 min TTL, auto-refresh) + server-API force-unsubscribe on revocation                        | Stateless, no per-subscribe HTTP hop; revocation is push-based, not TTL-bound                                                            |
| 6   | Roles (per workspace)        | Owner / Admin / Member; Guest deferred                                                                                      | Guest breaks the simple membership model (channel-scoped access); YAGNI for v1                                                           |
| 7   | v1 feature cut               | Full text plane: workspaces, channels, DMs, messaging, read state, threads, reactions, presence/typing, search, file upload | User decision; calls follow as the next product milestone                                                                                |
| 8   | Mobile E2E                   | Maestro (replaces Detox from the original constraints)                                                                      | Expo ecosystem convergence; no custom dev-client friction; less CI flakiness                                                             |
| 9   | Message format               | Markdown subset stored as plain text                                                                                        | One shared tokenizer (`libs/markdown`), two renderers; searchable as-is; composer is a textarea with shortcuts, not a rich-text editor   |
| 10  | File uploads                 | API-issued presigned MinIO URLs; keys `ws_<workspaceId>/<channelId>/<fileId>`                                               | Bytes never transit the API; tenancy enforced at grant issuance — same pattern as LiveKit tokens                                         |
| 11  | Search tenancy               | Meilisearch index-per-workspace (`messages_ws_<id>`), all queries proxied through the API                                   | Physical isolation parity with rooms/keys; a query cannot span tenants; self-hosted instances have few workspaces                        |
| 12  | DM model                     | DMs are workspace-scoped and unified as a channel type                                                                      | Same two people in two shared workspaces = two separate DM conversations; zero tenancy special cases                                     |
| 13  | Threads                      | Flat one level (`parent_message_id`), Slack-style                                                                           | Nesting is YAGNI                                                                                                                         |
| 14  | Write path                   | Postgres-first, then publish to Centrifugo; no transactional outbox in v1                                                   | DB is source of truth; publish-after-commit with retry + Centrifugo client recovery covers gaps; outbox is a documented hardening option |
| 15  | Instance governance (v1)     | Open registration (env flag to disable); any user can create workspaces; joining via invite links                           | No SMTP dependency in v1; instance-admin panel deferred                                                                                  |
| 16  | IDs                          | App-generated UUIDv7                                                                                                        | Time-ordered → message pagination keys off the primary key                                                                               |
| 17  | Message deletion             | Tombstones (body cleared, row kept)                                                                                         | Threads and read-state stay consistent                                                                                                   |
| 18  | Non-member responses         | 404, never 403                                                                                                              | Workspace/channel existence is never leaked across tenants                                                                               |

## 3. Service topology

docker-compose services: `postgres`, `redis`, `centrifugo`, `livekit`, `minio`, `meilisearch`, `api` (NestJS), `web` (Next.js). Redis serves: membership cache, unread counters, BullMQ queues, and the Centrifugo engine (enables Centrifugo horizontal scaling later).

LiveKit requires UDP port exposure for WebRTC media and has different container-networking requirements than the HTTP services; self-hosting docs (M10, drafted in M2) must cover NAT traversal/TURN explicitly.

## 4. Tenancy enforcement — the four-layer stack

Tenancy must be impossible to forget per-endpoint. Four layers:

1. **Routing.** All tenant-scoped routes live under `/workspaces/:workspaceId/...`. Nothing tenant-scoped is addressable without naming the workspace.
2. **`TenantContextGuard`** (applied globally to that route tree): validates the identity JWT → loads the caller's membership for `:workspaceId` (Redis-cached; cache explicitly invalidated on any membership change) → attaches `WorkspaceContext { userId, workspaceId, role }` to the request. Non-members receive 404.
3. **Data layer.** The Drizzle client is not exported from the data lib. The only exports are repository factories requiring a `WorkspaceContext`; every query they build appends `workspace_id = ctx.workspaceId`. An Nx module-boundary rule plus a custom ESLint rule forbid importing the raw client elsewhere. Unscoped access is unrepresentable, not merely forbidden.
4. **Schema.** Every tenant table carries `workspace_id NOT NULL` (FK, composite indexes), even where derivable (messages carry both `channel_id` and `workspace_id`). This redundancy keeps layer 3 cheap and keeps Postgres RLS available as a later hardening milestone without schema changes.

The same membership verification gates all four token/grant types: Centrifugo subscribe tokens, LiveKit room tokens, MinIO presigned URLs, and Meilisearch index selection.

## 5. Data model (core tables)

- `users` — global. Auth artifacts: argon2id password hashes; refresh-token family for rotation detection.
- `workspaces`; `workspace_members (workspace_id, user_id, role, UNIQUE(workspace_id, user_id))`, role ∈ {owner, admin, member}.
- `channels (workspace_id, type ∈ public|private|dm, name, topic, …)` — DMs are channels of type `dm` with a canonical participant-pair uniqueness constraint.
- `channel_members` — for private channels and DMs; public channels are workspace-wide.
- `messages (id UUIDv7, workspace_id, channel_id, author_id, parent_message_id NULL, body, created_at, edited_at NULL, deleted_at NULL)` — body is the markdown-subset plain text; deletes are tombstones.
- `reactions (message_id, user_id, emoji, UNIQUE triple)`.
- `attachments (workspace_id, channel_id, message_id, file_id, object_key, name, size, mime)`.
- `channel_read_state (user_id, channel_id, workspace_id, last_read_message_id, mention_count)`.
- `calls (id, workspace_id, channel_id, status, started_by, started_at, ended_at)`; `call_participants (call_id, user_id, joined_at, left_at)` — schema lands in v1, used from M7.
- `invites (workspace_id, token, created_by, expires_at, …)` — link-based joining.

Roles gate: **owner** — delete workspace, transfer ownership, everything below; **admin** — manage members, channels, invites; **member** — full participation (create channels, message, react, call).

## 6. Auth & session model

- Local email/password; argon2id hashing. OIDC is a later milestone behind a strategy layer.
- Access JWT ~10 min, **identity only — never workspace roles** (roles in tokens go stale). Rotating refresh tokens: httpOnly cookie (web/desktop), SecureStore (mobile).
- "Current workspace" is purely client state + URL; the server holds no session-pinned workspace. Membership/role is checked per request via the guard (Redis-cached). Role changes and removals take effect immediately.

## 7. Realtime model (Centrifugo)

**Namespaces** (workspace scope encoded in every channel name):

- `chat:ws_<wsId>_ch_<channelId>` — messages, edits, deletes, reactions, thread events, ephemeral typing. History ~100 / short TTL, used only for reconnect gap-fill.
- `presence:ws_<wsId>` — join/leave + presence for sidebar online dots.
- `user:#<userId>` — Centrifugo user-limited personal channel: unread/mention badges, DM notifications, call banners, membership changes — across all the user's workspaces, computed server-side.

**A client holds exactly three subscriptions:** personal + active-workspace presence + the open channel. Switching channels swaps one; switching workspaces swaps two. Subscription count is O(1), not O(channels).

**Token flow:** connection JWT (HMAC) issued at login (sub = userId). Per-channel subscribe tokens (~5 min TTL) issued by the API after the same membership check as REST; `centrifuge-js` auto-refreshes via `getToken`. On kick/role change the API force-unsubscribes via Centrifugo's server API and invalidates the membership cache.

**Write path:**

```
POST message → TenantContextGuard → scoped repo INSERT (Postgres)
  → publish to chat:… via Centrifugo HTTP API
  → unread fanout: per-member counters (Redis); @mention parse → badge events on user:# channels
  → enqueue Meilisearch indexing (BullMQ)
```

**Read state (server-authoritative):** client calls `mark-read(channelId, messageId)`; the server updates `channel_read_state`, recomputes unread + mention counts, and pushes new badge state on the personal channel — which also syncs all other devices/tabs. Sidebar badges only ever render server-pushed state. (Postgres `channel_read_state` is the durable truth; the Redis counters in the fanout path are a hot-path cache over it, rebuildable from Postgres.) Scrollback/thread history come from REST with UUIDv7-keyed pagination, never Centrifugo history.

**Presence/typing:** presence from Centrifugo on the workspace presence channel; typing is throttled ephemeral publishes on the chat channel (no persistence, no API hop).

## 8. Calls (LiveKit) — designed now, shipped M7

**Room naming (workspace-scoped, server-derived):** `ws_<workspaceId>_<scope>_<scopeId>` with scope ∈ `channel` (huddle) | `dm` (DM call) | `meeting` (standalone, later). The `ws_` prefix and scope are derived exclusively from server-verified IDs (`scope` from `channel.type`); client input never contributes to the room name. This is the media-plane equivalent of `workspace_id` query scoping.

**Token endpoint:** `POST /workspaces/:workspaceId/calls/:scope/:scopeId/token` → `TenantContextGuard` → channel/DM membership check → construct room name → mint LiveKit `AccessToken` with `VideoGrant { roomJoin, room, canPublish, canSubscribe, canPublishData }`, identity = userId, metadata = display name + avatar → return `{ token, url, roomName }`.

**Lifecycle (two planes cooperating via the `calls` table as state anchor):**

1. Start call → insert `calls` row → publish `call.started` on the chat channel (and member personal channels). Non-participants see the `CallBanner` without touching LiveKit.
2. Join → token endpoint → connect to LiveKit. Media (and SFU load) only for actual participants.
3. LiveKit webhooks (`participant_joined`, `participant_left`, `room_finished`) → signature-verified API endpoint → update `call_participants`/status → publish `call.updated`/`call.ended` over Centrifugo. Banner counts are server truth; abandoned rooms reliably clear the banner.

**M7 scope:** channel/DM huddles (1:1 + small group) with screen share. Later: standalone scheduled meetings, Egress recording to MinIO.

**Screen share:** first-class LiveKit screen-share track. `getDisplayMedia` on web. Flagged tasks: RN screen capture (iOS broadcast extension, Android media projection); see also the Tauri spike in §14.

**Required isolation tests:** a user in workspace A cannot mint a token for, nor join, any room of workspace B (by forged scopeId, forged workspaceId, or any other path).

## 9. Files (MinIO)

Upload: client requests an upload grant → guard verifies channel access → API issues a presigned PUT for `ws_<workspaceId>/<channelId>/<fileId>` → client uploads directly to MinIO → confirms; the `attachments` row attaches to the message. Downloads via short-TTL presigned GETs, issued under the same check. Bytes never transit the API. No thumbnail pipeline in v1 (client previews via presigned GET).

## 10. Search (Meilisearch)

Index-per-workspace: `messages_ws_<workspaceId>`, created with the workspace, deleted with it. Async indexing on create/edit/tombstone via BullMQ. All queries go through the API, which selects the index from the server-verified `WorkspaceContext`; clients never reach Meilisearch directly.

## 11. Monorepo layout (Nx) & AI-dev optimization

```
apps/api            NestJS
apps/web            Next.js
apps/desktop        Tauri shell wrapping the web build (no separate UI)
apps/mobile         React Native (Expo)
libs/shared-types   zod contracts: entities, API DTOs, Centrifugo event payloads
libs/design-tokens  token source of truth (per DESIGN_SYSTEM.md)
libs/ui-web         React components (tokens via CSS vars)
libs/ui-native      RN components (tokens via ThemeProvider)
libs/markdown       shared message tokenizer/AST; web + native renderers consume it
libs/api-client     typed client over shared-types, used by web + mobile
tools/eslint-rules  custom rules incl. the token guard (no raw hex / magic px in ui libs)
infra/              docker-compose, centrifugo/livekit/meilisearch configs, self-hosting docs
```

zod schemas in `shared-types` do triple duty: NestJS request validation, typed client, Centrifugo event contracts.

**AI-dev conventions:** root `CLAUDE.md` is routing-only; every `apps/*` and `libs/*` gets its own scoped `CLAUDE.md`. GitNexus (`npx gitnexus analyze` + `gitnexus setup`, MCP) is sequenced after M1 (the repo must be non-empty to index) and re-indexed after merges; PolyForm Noncommercial is acceptable as dev tooling. Project subagents (backend, frontend-web, mobile, test, devops) and skills (centrifugo-integration, livekit-integration, nestjs-tdd, tenant-scoping, design-system) are introduced only once a pattern has stabilized enough to encode (YAGNI).

## 12. Testing & quality gates (all merge-blocking)

- ESLint (typescript-eslint) + Prettier; custom token-guard rule active in `ui-web`/`ui-native`. (No TSLint.)
- Vitest unit tests; red/green TDD for every feature — failing test first, watch it fail, then implement.
- Testcontainers integration tests with real Postgres, Redis, MinIO, Meilisearch **and Centrifugo** containers + Supertest; realtime auth is tested against the real broker, not mocks.
- E2E: Playwright (web/desktop), Maestro (mobile).
- **Cross-tenant isolation suite as its own named CI job**, covering: data reads/writes, Centrifugo subscriptions, file grants, search queries, and LiveKit call tokens — user in A must be unable to touch anything in B.
- Conventional commits + commitlint; Husky pre-commit (lint, typecheck, affected tests).
- Design-system tests per DESIGN_SYSTEM.md §8: token parity, AA contrast, per-variant renders, Storybook for both UI libs.

## 13. Milestones

GitHub Project board with milestones + seeded issues (bootstrap script via `gh`/GraphQL is an M0 task). One issue → one worktree → one branch → one PR, with subagent-driven development and code-review checkpoints.

| Milestone                 | Contents                                                                                                                                                                                                          |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **M0 Foundations**        | Nx skeleton, shared-types, design-tokens lib, CI bootstrap (lint/typecheck/test/commitlint/Husky), GH project bootstrap script                                                                                    |
| **M1 Design system**      | Run the design plugin per `DESIGN_PLUGIN_PROMPT.md`; ui-web + ui-native (Tiers 1–3) + Storybook ×2 + token/contrast tests + token-guard ESLint rule. Then: GitNexus analyze/setup, per-folder CLAUDE.md           |
| **M2 Infra**              | docker-compose (all 8 services), Centrifugo config, LiveKit config (keys, UDP exposure), first draft of self-hosting/NAT docs                                                                                     |
| **M3 Identity & tenancy** | Auth (register/login/refresh), workspaces, memberships, roles, invites, TenantContextGuard, scoped data layer, isolation tests                                                                                    |
| **M4 Messaging core**     | Channels/DMs, Centrifugo integration (tokens, publish, recovery), messages (markdown subset), threads, reactions, presence/typing, read state                                                                     |
| **M5 Files + search**     | Presigned upload/download flow, attachments; Meilisearch index-per-workspace + indexing queue + search API                                                                                                        |
| **M6 Web client**         | Full v1 UI on the design system: workspace rail + switcher, sidebar, channel view, composer, threads, reactions, presence, search, files                                                                          |
| **M7 Calls**              | LiveKit token endpoint, call lifecycle + webhooks, Centrifugo signaling, web call UI (CallBanner/CallStage/controls), screen share (web), cross-tenant call tests. Backend portion can start in parallel after M4 |
| **M8 Desktop**            | Tauri shell; **screen-share publishing spike** (see Risks)                                                                                                                                                        |
| **M9 Mobile**             | RN client to visual parity (workspace switcher incl.), LiveKit RN call UI, RN screen-capture setup                                                                                                                |
| **M10 Hardening**         | Full E2E in Docker, CI gates complete, self-hosting docs finalized                                                                                                                                                |

**v1 release = M0–M6.** Each milestone gets its own implementation plan (superpowers writing-plans → executing-plans), broken into worktree-sized tasks.

## 14. Risks & flagged spikes

1. **Tauri screen-share publishing (M8 spike).** `getDisplayMedia` is unsupported/broken in WKWebView (macOS) and WebKitGTK (Linux). Viewing others' shares works (subscribed video track); publishing likely doesn't. Spike outcomes: (a) native capture plugin feeding a LiveKit track, (b) desktop ships view-only screen share initially, (c) re-evaluate the shell. Desktop's committed promise: join calls + view shares; publishing is gated on the spike.
2. **RN screen capture** requires platform setup (iOS broadcast extension, Android media projection) — known M9 task, not a surprise.
3. **LiveKit behind NAT** — self-hosters need UDP exposure/TURN guidance; docs are a deliverable, not an afterthought (drafted M2, finalized M10).
4. **Publish-after-commit gap** (no outbox in v1) — accepted; Centrifugo client recovery + retry covers it; outbox documented as the hardening path if message-loss reports appear.
5. **Membership-cache staleness** — bounded by explicit invalidation on every membership mutation plus short TTL; isolation tests cover the revocation path.

## 15. Explicitly deferred (YAGNI register)

Guest role; OIDC; standalone scheduled meetings; call recording (Egress → MinIO); transactional outbox; Postgres RLS; thumbnail pipeline; SMTP/email invites; instance-admin panel; push notifications; rich-text JSON messages; react-native-web/Tamagui single-codebase UI; federation; E2E encryption.

Each is deferred, not rejected — the schema and patterns above were chosen so none of them requires a redesign.
