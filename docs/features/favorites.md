# Feature: Favorites

- **Phase:** 1 (Slice 2c) · **Status:** shipped
- **Flag key:** `personalization.favorites` (from `@TheY2T/tmr-flags`) — gates heart toggles + the My
  favorites page. Default on.

## Purpose

Login-for-personalization: a signed-in user can bookmark catalogue items and revisit them.

## UX behaviour

- **Heart toggle** (♡/♥) on catalogue cards and the content detail page — shown only when logged in
  (and the flag is on). Optimistic; persists on click.
- **My favorites** (`/me/favorites`) — the user's favorited items as cards, most-recent first.
  SSR-gated (redirects anonymous to sign-in). Linked from the home header when signed in.
- Anonymous visitors see no hearts and cannot reach `/me/favorites`.

## Data model

New `favorites` table: `(user_id → user.id, content_id → content_items.id, created_at)`, composite PK
`(user_id, content_id)` (one row per user+item), both FKs `on delete cascade`. Migration `drizzle/0003_*`.

## API contract

Paths from TypeSpec (tag `favorites`); generated hooks/types in `@TheY2T/tmr-api-client`. All routes
`@RequireAuth()` (any authenticated user); the user id comes from the `CurrentUser` port, never the path.

| Route | Result |
|---|---|
| `GET /me/favorites` | `{ items: ContentSummary[] }` — favorited published items, newest first |
| `POST /me/favorites/{slug}` | 204 (idempotent; 404 if the slug doesn't exist) |
| `DELETE /me/favorites/{slug}` | 204 |

Hexagonal: `FavoritesRepository` port (speaks slugs) ← `DrizzleFavoritesRepository`; the list use-case
projects favorited items via the catalogue `ContentRepository` (`toContentSummaryView`).

## Help topics

None yet (Info View arrives in Phase 2).

## Tests

- **Backend (curl):** anon → 401; add → 204 (idempotent); list reflects it; nonexistent slug → 404;
  remove → 204; list empties.
- **Web (browser):** learner favorites two items from cards (♡→♥) → both appear in `/me/favorites`
  (newest first); detail page heart shows the state and toggles off → item drops from favorites;
  signed-out catalogue shows no hearts.
