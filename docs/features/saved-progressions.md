# Feature: Saved progressions

- **Phase:** 5 backlog · **Status:** shipped
- **Flag key:** `personalization.saved-progressions` (from `@TheY2T/tmr-flags`) — gates account sync
  (both the API endpoints and the analyzer's cloud mode). Default on.

## Purpose

Bridge the chord analyzer's local saved-progressions into personalization: a signed-in user's saved
chord progressions live on their account and follow them across browsers, while anonymous users keep
the original `localStorage` behaviour. The natural on-ramp toward Phase-6 personalized features.

## UX behaviour

- On `/tools/analyzer`, the **Save / load** panel is unchanged in shape (name a progression → Save;
  load or delete from the list). The storage backing it switches automatically:
  - **Signed in + flag on** → progressions sync to the account; the hint reads "Saved progressions
    sync to your account." Loaded from the API on mount; save/delete round-trip to the API.
  - **Otherwise** → `localStorage` (`tmr.savedProgressions`), hint "Saved progressions persist in this
    browser." — fully offline, no auth needed.
- The page computes `syncEnabled = flags['personalization.saved-progressions'] && !!user` server-side
  and passes it to the `ChordAnalyzer` island as a prop, so first paint matches.

## Data model

New `saved_progressions` table: `(user_id → user.id, name, key_root int, chords jsonb, updated_at)`,
composite PK `(user_id, name)` — one row per user+name, so re-saving a name is an **upsert**. FK
`on delete cascade`. `chords` is a JSON array of `{ root, quality }`. Migration `drizzle/0011_*`.

## API contract

Paths declared in TypeSpec (`packages/api-spec/main.tsp`, tag `progressions`); regenerated backend Zod
DTOs (`@TheY2T/tmr-contracts`) + FE types/hooks (`@TheY2T/tmr-api-client`). All routes `@RequireAuth()`
(any authenticated user) and gated by `@RequireFlagsEnabled(personalization.saved-progressions)`; the
user id comes from the `CurrentUser` port, never the path.

| Route | Result |
|---|---|
| `GET /me/progressions` | `{ items: SavedProgressionView[] }`, most-recently-updated first |
| `PUT /me/progressions/{name}` | upsert (body `{ keyRoot, chords[] }`) → 204 |
| `DELETE /me/progressions/{name}` | 204 (idempotent) |

Anonymous → 401 problem+json (with `traceId`); an invalid body → 422 problem+json from the generated
Zod DTO.

## Architecture (hexagonal, ADR 0012 naming)

`apps/api/src/progressions/` — `ProgressionLibrary` port (domain capability: persist a user's named
progressions) bound to `DrizzleProgressionLibrary`; `List` / `Save` / `Delete` use-cases; controller +
DTO in presentation. Domain `SavedProgression` is framework-free. `ProgressionsModule` imports
`AuthModule` (for `CurrentUser`) and is registered in `AppModule`.

## Web

- `src/lib/progressions-api.ts` — credentialed `listRemoteProgressions` / `saveRemoteProgression` /
  `deleteRemoteProgression` (raw `fetch`, `credentials: 'include'`), degrade to `[]`/no-op on error.
- `ChordAnalyzer.tsx` gained a `syncEnabled` prop and `persistSave` / `persistDelete` helpers that
  branch between the API lib and `saved-progressions.ts` (localStorage).

## Verification

- **API (curl, learner@local.dev):** anon → 401 problem+json; sign-in → 200; `PUT` → 204; `GET` returns
  it; re-`PUT` same name → single item with updated `keyRoot` (upsert, not duplicate); invalid body →
  422; `DELETE` → 204; `GET` → empty.
- **Web (browser, signed in):** hint shows "sync to your account"; Save writes to the account (appears
  in both UI and the API); **reload loads the list from the account**; delete removes it from the
  account. Verified end-to-end, artifacts cleaned up.
- `pnpm build lint check-types` green; spec drift clean; domain stays framework-free.
