# Feature: Info View (contextual helper)

- **Phase:** 2 (Slice C) · **Status:** shipped
- **Flag key:** `learning.info-view` (from `@TheY2T/tmr-flags`) — gates the panel + the admin help CMS.
  Default on.

## Purpose

An Ableton-style **Info View**: a persistent, dismissible panel that shows context-sensitive help for
whatever the user hovers or focuses — a glossary that grows as more of the app opts in.

## UX behaviour

- A fixed bottom panel (`InfoView` island). Elements opt in with `data-help="<topic-slug>"`; on
  hover/focus the panel shows the topic's **term + markdown body + optional "Learn more" link**. With
  nothing hovered it shows a hint.
- **Dismissible** — the `✕` hides it (persisted in `localStorage`), leaving a floating `?` to reopen.
- Currently wired on the **content detail page**, where the **topic chips** carry `data-help` (their
  slugs match the seeded skill-topic help topics). `[data-help]` elements get a dotted underline +
  help cursor (global CSS). The panel resolves topics via **event delegation**, so it works across
  every island on the page.
- Admin: `/admin/help/*` (editor/admin, flag-gated) — list + create/edit form (slug, term, markdown
  body, learn-more slug) + delete.

## Data model

`help_topics` (`slug` unique, `term`, `body` markdown, optional `link_slug`). Migration `drizzle/0006_*`.
No draft/publish — topics are always live.

## API contract

Paths from TypeSpec (tag `help`); generated hooks/types in `@TheY2T/tmr-api-client`.

| Route | Auth | Notes |
|---|---|---|
| `GET /help-topics` | public | all topics (the web preloads these) |
| `GET /help-topics/{slug}` | public | one topic; 404 otherwise |
| `POST /admin/help-topics` | `content:create` | 201 (409 on duplicate slug) |
| `PUT /admin/help-topics/{slug}` | `content:update` | |
| `DELETE /admin/help-topics/{slug}` | `content:delete` | admin only (204) |

Hexagonal: `HelpTopicRepository` port ← `DrizzleHelpTopicRepository`. RBAC reuses the `content`
resource. Slugs are designed to match `skill_topic` slugs so topic chips resolve directly, but any
element (term, control, glyph) can carry a `data-help` slug as the app grows.

## Seed

10 help topics matching the skill topics (`scales`, `chords`, `arpeggios`, …), several with a
`linkSlug` to a lesson. `pnpm --filter @TheY2T/tmr-api db:seed`.

## Tests

- **Backend (curl):** public list (10) + detail; unknown → 404; learner create → 403; editor create →
  201; duplicate → 409; update → 200; invalid body → 422; editor delete → 403, admin → 204.
- **Web (browser):** detail-page topic chips show a dotted underline; hovering `Arpeggios` /
  `Sight-reading` updates the panel with the term + definition; `✕` dismisses (floating `?` persists via
  localStorage); `?` reopens.
