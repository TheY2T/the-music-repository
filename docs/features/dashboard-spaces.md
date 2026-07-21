# Feature: Dashboard spaces (customizable practice-space builder)

- **Phase:** P0–P5 (incremental) · **Status:** in-progress (P0 foundations + P1 read-only render + P2 editor + P3 templates & coursework landed)
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
- **Edit mode** (`SpacesBuilder` island) toggles the grid interactive: drag (by the whole card header)
  and resize widgets (bottom-right corner), remove them (card ✕), add from the **widget palette**, edit
  the Note inline, rename the space, and switch/create/delete spaces. Every change **autosaves**
  (debounced `PUT`, with a Saving…/Saved indicator).
- Each widget header carries a **horizontal-scroll toggle** (ruler icon, available in view and edit
  modes) that flips the widget body between clipped (`overflow-x-hidden`) and scrollable
  (`overflow-x-auto`); the choice is stored per widget in its `config.hScroll` and persists like any
  other config.
- In edit mode each header also has **Expand to fill width** (⟷) and **Expand to fill height** (↕):
  width grows the widget to the nearest vertically-overlapping widget on its right (or the grid edge);
  height grows it to the nearest horizontally-overlapping widget below (or the space's current bottom).
  Both are layout changes (`useSpaces.expandWidth`/`expandHeight`) and autosave. State lives in the `useSpaces` hook; `SpaceGrid` is the
  presentational grid (view + edit); `WidgetPalette` lists the addable types.
- **New space from a template** — the New-space control is a picker (`SPACE_TEMPLATES` in `templates.ts`:
  Blank, Daily warm-up, Theory reference, Guided courses); selecting one creates a space pre-seeded with
  that template's widgets (`useSpaces.createSpace(template)`).
- **Coursework widget** (`collections`) — a compact list of featured collections/guided paths read
  through the `useSearchCollections` data port (`CollectionsWidget`), linking into `/collections/<slug>`.
- Still to come: per-tool widget config panels (embed-field style), per-space animated background, and
  gamification (P4).
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

**Definition of Done for this feature:** every builder capability ships with accompanying test coverage
(regression guard) — the mutation/persistence logic in `useSpaces` (unit) and the editor wiring in
`SpaceGrid`/`SpacesBuilder` (component). Reinforces the repo-wide tests-as-DoD rule (root `CLAUDE.md`).


- **Unit:** `get`/`update` use-cases with a mocked `DashboardSpaces` port
  (`apps/api/src/dashboard-spaces/application/use-cases/*.test.ts`).
- **Integration:** `DrizzleDashboardSpaces` against Testcontainers Postgres
  (`*.integration.test.ts`) — null-before-save, upsert round-trip, idempotent replace.
- **Unit:** `use-spaces.test.ts` covers the state + autosave logic that the editor drives — seed starter,
  add/remove widget, **`applyLayout` (move + resize)**, **`expandWidth`/`expandHeight`** (fill to
  neighbour or edge), update config, and create/rename/switch/delete spaces (incl. active reassignment) —
  with the debounced `PUT` asserted, plus **`createSpace(template)`** seeding a template's widgets.
- **Component:** `SpaceGrid.test.tsx` (view-mode render, edit-mode note textarea + remove, empty state,
  the horizontal-scroll toggle, the expand-width/height buttons, and the drag-handle wiring: header
  carries `widget-drag-handle`, remove button carries `widget-no-drag`)
  and `SpacesBuilder.test.tsx` (enter edit → edit a note → debounced autosave; add a widget from the
  palette incl. the coursework "Courses" option → autosave; create a space from the template picker) — both use a note-only space so the audio/WebGL tool widgets (lazy) stay out of the
  unit optimizer. Plus `react-grid-layout-compat.test.tsx` (ADR 0046 React-19 gate: an interactive grid
  mounts without the removed `findDOMNode`).
- **E2E (P2):** `apps/web/e2e/dashboard-spaces.spec.ts` (create → arrange → save → reload) — the
  flag-on smoke lands with P2, when per-request SSR flag control is added (the snapshot is fetched
  server-side, so `page.route` can't toggle it and MSW handlers are global per run). Pixi/audio widget
  render paths are covered by E2E only.
- Run: `pnpm --filter @TheY2T/tmr-api test` (unit) · `pnpm test:integration` (Docker) ·
  `pnpm spec:generate` (contract) · web via the `run-local` skill with the flag on in
  `/admin/feature-flags`.
