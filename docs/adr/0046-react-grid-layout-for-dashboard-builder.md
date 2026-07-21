# ADR 0046 — `react-grid-layout` for the dashboard-spaces grid engine

- **Status:** accepted
- **Date:** 2026-07

## Context

The customizable dashboard (ADR 0045) needs a 2-D, draggable **and** resizable widget grid with
collision handling and responsive breakpoints — a Wix/Squarespace-style canvas. The repo already
catalogs `@dnd-kit` (ADR 0030) for sortable lists, but `@dnd-kit` provides drag/sort primitives only:
resize handles, grid snapping, collision/compaction, and responsive column layouts would all be
hand-built. No 2-D grid-layout library is present in the workspace.

## Decision

Adopt **`react-grid-layout`** (with its `react-resizable` peer) as the grid engine for the dashboard-
spaces builder, added to the `pnpm-workspace.yaml` catalog (one pinned version) and consumed by the
builder island in `@TheY2T/tmr-common-ui`.

- It provides drag, resize, collision/compaction, and responsive breakpoints out of the box, so the
  builder writes layout persistence and widget rendering rather than re-implementing grid mechanics.
- Layout state maps directly onto the persisted model: each `DashboardWidget`'s `{ x, y, w, h }` is a
  react-grid-layout item, so save/restore is a straight translation with no bespoke serialization.
- `@dnd-kit` stays the tool for simple sortable/reorderable lists elsewhere; the two do not overlap.

**React 19 compatibility is a gate.** The dependency is introduced with the first grid render (phase P1),
and its React 19 interop is verified at that point (peer-range check + a rendering smoke test) before it
is relied upon. If it proves incompatible, the fallback is a CSS-grid + `@dnd-kit` implementation with
custom resize handles (no new dep) — but that is explicitly the less-preferred path due to the volume of
custom collision/resize code it implies.

## Consequences

- One new cataloged runtime dependency (`react-grid-layout` + `react-resizable`) plus its stylesheet,
  scoped to the builder island; it is not pulled into unrelated bundles.
- The builder's layout code is thin (state ↔ persisted `{x,y,w,h}`), at the cost of theming
  react-grid-layout's drag/resize affordances to the design tokens.
- Keyboard drag/resize accessibility and mobile (single-column) behaviour are handled through
  react-grid-layout's APIs and validated in the P2/P5 a11y passes.
