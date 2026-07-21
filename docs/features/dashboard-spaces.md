# Feature: Dashboard spaces (customizable practice-space builder)

- **Phase:** P0–P5 (incremental) · **Status:** in-progress (P0 foundations + P1 read-only render landed)
- **Flag key:** `personalization.dashboard-spaces` (field `dashboardSpaces`; off by default)

## Purpose

Turn `/dashboard` from a fixed layout into a WYSIWYG builder where a signed-in learner composes one or
more **practice spaces** — draggable/resizable grids of widgets (interactive tools, drills, content
shelves, practice routines, notes, progress/gamification) — starts from templates, and saves everything
per-user on the server. The intended outcome is a personalized "studio" that helps learners organise
and improve their playing, with light gamification and Pixi accents. Full plan + phasing:
`~/.claude/plans/happy-floating-ocean.md`; decision record: ADR 0045 (+ ADR 0046 for the grid engine).

## UX behaviour

- A learner opens their active space: a responsive grid of widget cards. When they have saved nothing
  yet, a starter space (tempo + ear training + circle-of-fifths + a note) is shown. Widgets render live;
  the grid itself is read-only until the editor lands (P2).
- The read-only grid is `SpaceView` (`@TheY2T/tmr-common-ui/DashboardSpaces/SpaceView`), rendered on a
  12-column `react-grid-layout` (ADR 0046). Widget types live in a registry (`widget-registry.tsx`:
  type → lazy component + default size + icon/title); tool widgets lazy-load their islands. P1 ships
  `metronome`, `circle-of-fifths`, `ear-trainer`, and a net-new `note` widget.
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
- **Component:** `SpaceView.test.tsx` (renders a note-only space's widgets, i18n-by-prop; the audio/
  WebGL tool widgets are lazy so they stay out of the unit optimizer) + `react-grid-layout-compat.test.tsx`
  (ADR 0046 React-19 gate: an interactive grid mounts without the removed `findDOMNode`).
- **E2E (P2):** `apps/web/e2e/dashboard-spaces.spec.ts` (create → arrange → save → reload) — the
  flag-on smoke lands with P2, when per-request SSR flag control is added (the snapshot is fetched
  server-side, so `page.route` can't toggle it and MSW handlers are global per run). Pixi/audio widget
  render paths are covered by E2E only.
- Run: `pnpm --filter @TheY2T/tmr-api test` (unit) · `pnpm test:integration` (Docker) ·
  `pnpm spec:generate` (contract) · web via the `run-local` skill with the flag on in
  `/admin/feature-flags`.
