# Feature: Progress (completion · streaks · practice)

- **Phase:** 2 (Slice B) · **Status:** shipped
- **Flag key:** `learning.progress` (from `@TheY2T/tmr-flags`) — gates the complete toggle + dashboard.
  Default on.

## Purpose

Login-for-personalization: let a learner mark content complete, track a day streak and practice time,
and see per-collection progress — the motivation layer over the catalogue + collections.

## UX behaviour

- **Mark complete** toggle on the content detail page (logged in) — `Mark complete` ↔ `✓ Completed`.
- `/me/progress` dashboard — three stats (items completed, day streak, practice minutes), per-collection
  **progress bars**, and a **log-practice** form (minutes) that updates the summary live. SSR-gated
  (redirects anonymous to sign-in). Linked from the home header.

## Data model

`content_progress` (`user_id`, `content_id`, `completed_at`; PK per user+content) and
`practice_sessions` (`id`, `user_id`, nullable `content_id`, `minutes`, `created_at`). Migration
`drizzle/0005_*`. Cascade on user/content delete (practice content FK → `set null`).

## API contract

Paths from TypeSpec (tag `progress`); generated hooks/types in `@TheY2T/tmr-api-client`. All routes
`@RequireAuth()`; the user id comes from the `CurrentUser` port.

| Route | Result |
|---|---|
| `GET /me/progress` | `ProgressSummary` (completed count/slugs, streak, total minutes, per-collection) |
| `POST /me/progress/{slug}` | 204 (idempotent; 404 unknown slug) |
| `DELETE /me/progress/{slug}` | 204 |
| `POST /me/practice` | 201 → updated `ProgressSummary` (body `{ contentSlug?, minutes }`) |

Hexagonal: `ProgressRepository` port ← `DrizzleProgressRepository`. The summary use-case composes it
with the collections `CollectionRepository` (exported from `CollectionsModule`) to compute per-collection
completion. **Streak** = consecutive UTC days (ending today, or yesterday as a grace day) with any
activity — completion or practice — computed by the pure `currentStreakDays` domain helper.

## Tests

- **Backend (curl):** anon → 401; mark complete → 204 (idempotent) + reflected; unknown → 404; log
  practice → 201 with updated totals; invalid minutes → 422; unmark → 204; per-collection count + streak
  correct.
- **Web (browser):** detail toggle `Mark complete` → `✓ Completed`; dashboard shows completed count,
  streak, and `Piano Fundamentals 1/5` bar; logging practice updates the minutes stat live (0 → 20).
