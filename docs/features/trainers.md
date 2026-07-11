# Feature: Trainers & drills (SRS)

- **Phase:** 4 (Slice A) · **Status:** shipped
- **Flag key:** `trainers.srs` (from `@TheY2T/tmr-flags`) — gates `/drills`. Default on.

## Purpose

Turn practice into retention: spaced-repetition drills (SM-2) that schedule the right cards at the
right time and persist per user — the learning system on top of the Phase-3 tools.

## UX behaviour

- `/drills` — hub of decks (login-gated) showing **due / new / learned** counts per deck.
- `/drills/{deck}` — a review session: hear the question (**▶ Play**, auto-plays after the first
  gesture), **Show answer**, then self-grade **Again / Good / Easy** → the next card. A session runs
  through due + new cards (capped) and ends with a summary.
- Two decks ship: **Interval recognition** and **Chord quality** (questions generated + played
  client-side, reusing the Phase-3 audio + theory).

## Data model

`review_cards` — SM-2 state per `(user_id, deck, card)`: `ease_factor`, `interval_days`, `repetitions`,
`due_at`, `last_reviewed_at`. Migration `drizzle/0007_*`. See **ADR 0014**.

## API contract

Paths from TypeSpec (tag `reviews`), generated hooks/types in `@TheY2T/tmr-api-client`; all
`@RequireAuth()`.

| Route | Result |
|---|---|
| `GET /me/reviews` | `{ decks: [{ deck, learned, due }] }` |
| `GET /me/reviews/{deck}` | `{ cards: ReviewState[] }` — stored states (client derives new/due) |
| `POST /me/reviews/{deck}/{card}` | 201 → updated `ReviewState` (applies SM-2 to `{quality}`) |

Hexagonal: pure `applySm2` domain fn; `ReviewRepository` port ← `DrizzleReviewRepository`. Decks are
**client-side** (`apps/web/src/lib/drill-decks.ts`) — the backend only schedules.

## Tests

- **Backend (curl):** anon → 401; grade "Good"→ interval 1 → 6 → (Easy) 15 days with ease 2.5 → 2.6;
  "Again" lapses to 1 day / 0 reps; invalid grade → 422; deck state + summary correct.
- **Web (browser):** hub lists both decks (13 / 10 new); a session runs "Card 1 of 10" → Show answer →
  grade Good → "Card 2 of 10"; the graded card persists and the hub then shows **1 learned**.
