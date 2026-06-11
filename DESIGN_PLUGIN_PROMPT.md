# Claude Code Design-Plugin Prompt — Spoke UI Generation

> Paste this into the Claude Code design plugin. It assumes `libs/design-tokens/` already exists (per DESIGN_SYSTEM.md) and instructs the plugin to generate screens that strictly consume those tokens. Run AFTER the token library is scaffolded so generated output references real token keys.

---

## ROLE

You are a senior product designer + frontend engineer generating the complete UI for **Spoke**, a self-hostable, open-source team communication platform. The product is workspace-based and multi-tenant: a user can belong to multiple workspaces, switch between them via a left rail, and each workspace is an isolated tenant with its own channels, members, and messages. You produce high-fidelity, production-intent designs and the React / React Native component code that implements them.

## ABSOLUTE CONSTRAINTS (do not violate)

1. **Token-only styling.** Every color, spacing value, font size, radius, and shadow MUST reference a token from `libs/design-tokens` (e.g. `tokens.color.bgSidebar`, `tokens.space[4]`, `tokens.textStyle.messageBody`). NEVER emit a raw hex code, rgb(), or magic pixel number. If a needed value has no token, STOP and list the missing token instead of inventing a literal.
2. **Two render targets, one visual result.** Generate web (React, `div`/`span`) and mobile (React Native, `View`/`Text`) variants of each component. They must be visually equivalent and share the same prop API. Desktop reuses the web components inside a Tauri shell — do not design a separate desktop UI.
3. **Component reuse.** Compose screens only from the component inventory in DESIGN_SYSTEM.md (Tiers 1–3). Do not introduce one-off styled elements inside screens.
4. **Both themes.** Every screen must render correctly in light AND dark theme using only semantic tokens. Show both.
5. **Accessibility built in.** Every interactive element gets a label/ARIA role; focus states use the `borderFocus` token; touch targets ≥44px on mobile.

## PRODUCT MODEL TO REFLECT IN THE UI

- **Multi-tenancy is visible.** A thin left **workspace rail** (68px) shows one icon per workspace the user belongs to, plus an "add/join workspace" control. Selecting a workspace re-scopes the sidebar (channels, DMs) and content area to that tenant. Data from one workspace never appears while another is active.
- **Hub-and-spoke identity.** Spoke = a central hub with spokes to each workspace. Keep the aesthetic clean and modern with a deep indigo sidebar.
- Within a workspace: channels (public/private), direct messages, threads, reactions, presence, search, file sharing.

## VISUAL DIRECTION

- Deep indigo workspace rail + sidebar, clean near-white (light) / near-black (dark) content area, generous message spacing, clear typographic hierarchy.
- Dense but breathable.
- Consecutive messages from the same sender are grouped (avatar + name shown once; following messages indented under the gutter).
- Purposeful accent use: green for send/online, red for mentions/destructive, blue for links/active.

## SCREENS TO GENERATE (in this order)

### A. Desktop / Web (workspace rail + 3-column layout)

1. **Main workspace view** — workspace rail (68px, multiple workspace icons, active one highlighted) + channel sidebar (260px) + active channel (header + virtualized message list + composer). Show: section headers (Channels, Direct Messages), unread channel (bold), channel with mention badge, presence dots on DMs, a date separator, an "unread messages" divider, grouped messages, a message with emoji reactions, a message with a code block, and the composer with formatting toolbar + emoji + attach + send button.
2. **Thread open** — same view with the 380px thread panel open on the right (parent message + replies + thread composer).
3. **Workspace switcher** — the rail's add/switch control expanded: list of the user's workspaces, "Create a workspace", "Join a workspace".
4. **Quick switcher / search** — Cmd-K modal overlay with channel/people/message results, scoped to the active workspace.
5. **Create channel modal** — name, description, public/private toggle (`Modal` + `Input` + `Button`).
6. **Create workspace modal** — workspace name, optional URL slug, using `Modal` + `Input` + `Button`.
7. **Emoji + reaction popover** — hovering a message reveals the action toolbar (react, reply in thread, more); emoji picker popover open.
8. **In-channel call banner** — a channel with an active call: `CallBanner` showing "Call in progress — N people" with a Join button.
9. **Active call / conference view (desktop)** — `CallStage` with a grid of `ParticipantTile`s, active-speaker highlight, and the `CallControlBar` (mic, camera, screen-share, leave). Show a 1:1 layout AND a multi-party grid (e.g. 6 participants).
10. **Screen-share view (desktop)** — `ScreenShareView` with one participant presenting their screen (focused) and other participants as a filmstrip; presenter label visible.

### B. Mobile (React Native, single-column stack)

8. **Workspace switcher screen** — list of the user's workspaces with create/join actions.
9. **Channel list screen** — active workspace header (tap to switch workspace), searchable channel + DM list, bottom tab bar (Home / DMs / Mentions / Search / You), unread + mention badges.
10. **Channel message screen** — channel header (back, name, members), message list, keyboard-avoiding composer pinned to bottom.
11. **Thread screen** — pushed navigation screen with parent + replies + composer.
12. **Mobile search screen** — search field + segmented results (Messages / Files / People), scoped to the active workspace.
13. **Mobile active call screen** — full-screen `CallStage` with participant tiles, `CallControlBar` (mic, camera, screen-share, leave), and an incoming-call sheet (`IncomingCallSheet`) variant for a DM call.

### C. Shared states (show for both platforms)

13. **Empty channel** ("This is the very beginning of #channel").
14. **Empty workspace / first-run** (no channels yet — prompt to create one).
15. **Loading skeletons** for message list and sidebar.
16. **Typing indicator** ("Alex is typing…") and **presence** variations (online/away/dnd/offline).

## OUTPUT FORMAT (per screen)

For each screen produce:

1. A short rationale (1–2 sentences) on layout/hierarchy decisions.
2. The high-fidelity design (rendered).
3. The implementing component code:
   - Web variant (React + tokens via CSS vars / the approach used in `ui-web`).
   - Mobile variant (React Native + tokens via ThemeProvider) where the screen is in the mobile set.
4. A list of which design-system components it consumes.
5. Any **missing tokens or components** discovered — listed explicitly, never worked around with literals.

## INTERACTION & MOTION NOTES TO REFLECT

- Switching workspace re-scopes sidebar + content; active workspace icon highlighted in the rail.
- Hover on a message row reveals the action toolbar (web); long-press opens an action sheet (mobile).
- New-message arrival: subtle fade/slide using `motion.duration.base` + `easing.standard`.
- Sidebar item active state uses `bgSidebarActive`; hover uses `bgSidebarHover`.
- Unread channels: bold text + white dot; mentions: red count badge.
- Composer grows with content up to a max height, then scrolls.

## DELIVERABLE CHECKLIST (self-verify before finishing)

- [ ] Zero raw hex / rgb / magic numbers anywhere — grep your own output.
- [ ] Every screen shown in light AND dark.
- [ ] Web + mobile variants are visually equivalent.
- [ ] Workspace rail + multi-tenant scoping shown on both platforms.
- [ ] Each component used exists in DESIGN_SYSTEM.md inventory (or is flagged as missing).
- [ ] All interactive elements have a11y labels/roles and visible focus.
- [ ] Message grouping, reactions, threads, presence, badges, and dividers all demonstrated.
- [ ] Missing-token / missing-component report included at the end.

## DO NOT

- Do not redesign or rename existing tokens.
- Do not add a UI framework not already in the stack (allowed: the project's existing component libs + Lucide icons).
- Do not produce a desktop-specific UI — desktop = web in Tauri.
- Do not silently substitute a literal when a token is missing — report it.
