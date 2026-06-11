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
