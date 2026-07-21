# Feature: Dashboard spaces (customizable practice-space builder)

- **Phase:** P0–P5 (incremental) · **Status:** in-progress (P0 foundations landed)
- **Flag key:** `personalization.dashboard-spaces` (field `dashboardSpaces`; off by default)

## Purpose

Turn `/dashboard` from a fixed layout into a WYSIWYG builder where a signed-in learner composes one or
more **practice spaces** — draggable/resizable grids of widgets (interactive tools, drills, content
shelves, practice routines, notes, progress/gamification) — starts from templates, and saves everything
per-user on the server. The intended outcome is a personalized "studio" that helps learners organise
and improve their playing, with light gamification and Pixi accents. Full plan + phasing:
`~/.claude/plans/happy-floating-ocean.md`; decision record: ADR 0045 (+ ADR 0046 for the grid engine).

## UX behaviour

- A learner opens their active space: a responsive grid of widget cards.
- In edit mode (P2) they add widgets from a palette (grouped by the tool taxonomy, gated by the
  viewer's flags), move/resize them, configure each (embed-field style), and manage multiple named
  spaces with their own icon + animated background.
- Templates (P3) seed a new space from a starter routine. Gamification (P4) surfaces XP/streak/badge
  accents. The builder replaces the legacy `StudioDashboard` at the P5 flip; until then it is only
  reachable when the flag is on.

## Data model

- **Table `dashboard_spaces`** (`apps/api/src/infrastructure/database/schema.ts`) — one row per user:
  `user_id` (PK, FK → `user.id`, cascade), `spaces jsonb` (ordered collection), `active_space_id text`
  (nullable), `updated_at`. The JSONB holds `DashboardSpace[]` — each `{ id, name, icon?, background?,
  widgets: DashboardWidget[] }`; a widget is `{ id, type, x, y, w, h, config }` where `config` is a
  widget-type-specific bag mirroring the embed field vocabulary.
- First per-user "layout" store; future widget types extend the JSONB shape rather than adding columns.

## API contract

Spec-first in `packages/api-spec/main.tsp` (`@tag("dashboard-spaces")`):

- `GET /me/dashboard-spaces` → `DashboardSpacesView` (empty collection when never saved).
- `PUT /me/dashboard-spaces` (`DashboardSpacesInput`) → `DashboardSpacesView` (idempotent upsert).

Both `@RequireAuth()` + method-level `@RequireFlagsEnabled(FlagKeys.DashboardSpaces)`. Hexagonal module
`apps/api/src/dashboard-spaces/` (port `DashboardSpaces` ← `DrizzleDashboardSpaces`), mirroring
`preferences/`. Web reads/writes via `@TheY2T/tmr-web-acl/dashboard-spaces-api`
(`getDashboardSpaces` / `saveDashboardSpaces`); DTO types re-exported from `@TheY2T/tmr-web-acl/dto`.

## Help topics

Info View entries for the builder + widget palette land with the P2 editor.

## Tests

- **Unit:** `get`/`update` use-cases with a mocked `DashboardSpaces` port
  (`apps/api/src/dashboard-spaces/application/use-cases/*.test.ts`).
- **Integration:** `DrizzleDashboardSpaces` against Testcontainers Postgres
  (`*.integration.test.ts`) — null-before-save, upsert round-trip, idempotent replace.
- **Component/E2E (P1+):** the builder island (i18n-by-prop) + `apps/web/e2e/dashboard-spaces.spec.ts`
  (create → arrange → save → reload); Pixi/audio widgets covered by E2E only.
- Run: `pnpm --filter @TheY2T/tmr-api test` (unit) · `pnpm test:integration` (Docker) ·
  `pnpm spec:generate` (contract) · web via the `run-local` skill with the flag on in
  `/admin/feature-flags`.
