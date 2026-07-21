# ADR 0045 — Customizable dashboard spaces (WYSIWYG practice-space builder)

- **Status:** accepted
- **Date:** 2026-07

## Context

The signed-in dashboard (`/dashboard`) was a single fixed island — `StudioDashboard` (three shelves:
Continue / Recommended / Saved) — behind a decorative Pixi background whose only "preference" lived in
localStorage (ADR 0044 notes this as the sole prior per-user preference). Nothing was arrangeable and
nothing about the layout persisted. We want the dashboard to become a personalized **practice space**: a
learner composes their own workspace from the building blocks the app already ships (interactive tools,
drills, catalogue/collection shelves, practice routines, notes, progress) — a Wix/Squarespace-style
WYSIWYG grid — saved to their account, extensible with templates and gamification. This is large, so it
is delivered incrementally behind one flag; the current dashboard stays the default until the final flip.

## Decision

1. **One flag, `personalization.dashboard-spaces`** (off by default). Off ⇒ `/dashboard` renders exactly
   today's `StudioDashboard`, so the work is inert per environment until enabled. The builder replaces the
   legacy dashboard only at the final phase.

2. **Per-user server persistence via a new hexagonal `dashboard-spaces/` module**, modeled on
   `preferences/`: spec-first `GET`/`PUT /me/dashboard-spaces` (`@RequireAuth` + method-level
   `@RequireFlagsEnabled`), a `DashboardSpaces` port ← `DrizzleDashboardSpaces`, and a single-row-per-user
   `dashboard_spaces` table storing the whole collection as JSONB (`spaces` + `active_space_id`). The web
   side adds `@TheY2T/tmr-web-acl/dashboard-spaces-api` (credentialed fetch); DTO types come through the
   `@TheY2T/tmr-web-acl/dto` boundary. A user's spaces sync across devices, unlike the localStorage-only
   background pref.

3. **A space is a grid of widgets; widgets reuse existing islands.** `DashboardSpace = { id, name, icon?,
   background?, widgets }`; `DashboardWidget = { id, type, x, y, w, h, config }`. `config` is an opaque,
   widget-type-specific bag that deliberately mirrors the **embed** field vocabulary (`ContentEmbed` in
   TypeSpec, `EmbedConfig` in content-serde) so tool widgets are configured exactly like the existing
   preconfigured-tool embeds. A **widget registry** (type → lazy component + default size + required
   flag/auth) renders them, modeled on the `EmbedBody` switch. Widget types wrap the components that
   already exist (tools, `DrillSession`, catalogue/collection shelves, `ProgressDashboard` stat tiles,
   `PracticePlanner`); a free-text Note widget is the one net-new piece.

4. **The builder is one island in `@TheY2T/tmr-common-ui` with one `AppProviders` root.** React context
   (the `useApiData()` data port + `useInstrumentPreferences()`) cannot cross island boundaries, so the
   builder is a single island that renders widgets as React children — never one island per cell. `locale`
   and the resolved `flags` subset are threaded in as props (islands never read `Astro.locals`).
   `common-ui` is the home for dashboards and already carries `@dnd-kit`, so no new package (and no
   `ssr.noExternal` / `@source` wiring) is needed.

5. **Pixi is accents only.** Through the `PixiCanvas` boundary + `useThemeColors`, a space has **one**
   ambient backdrop and light XP/achievement effects — never a WebGL canvas per widget (context limits).
   The per-space background subsumes the ADR 0044-era localStorage background; the standalone `/settings`
   background page is retired at the flip.

6. **Gamification persists in its own capability.** XP + unlocked badges get a separate hexagonal
   `achievements` feature (its own flag), rather than being derived ad-hoc client-side, so awards are
   durable; streak/completion/practice-minute stat widgets still read the existing `ProgressSummary`.

7. **The layout engine is `react-grid-layout`** (ADR 0046) rather than hand-rolling 2-D drag+resize on
   `@dnd-kit`.

## Consequences

- New per-user store `dashboard_spaces` (migration in `apps/api/drizzle/`). The JSONB shape absorbs new
  widget types without schema churn; widget `config` is unvalidated at the boundary (opaque bag), so
  unknown widget types/fields degrade at render rather than being rejected server-side.
- Widgets that need auth (DrillSession, ProgressDashboard, favorites) or instrument preferences degrade
  gracefully inside the shared provider tree; a single-active-audio policy avoids master-bus contention
  when multiple sound tools sit on one grid.
- The legacy `StudioDashboard` and the `/settings` background page are superseded at the P5 flip (their
  shelves become widget types; the background becomes a per-space setting), with a one-time migration of
  the localStorage pref into the active space.
- Delivered in phases (P0 foundations → P5 replace); each phase is shippable behind the flag. Full phasing
  lives in `~/.claude/plans/happy-floating-ocean.md` and `docs/features/dashboard-spaces.md`.
