# Feature: Trainers & drills (SRS)

- **Phase:** 4 (Slice A) · **Status:** shipped
- **Flag key:** `trainers.srs` (from `@TheY2T/tmr-flags`) — gates `/drills`. Default on.

## Purpose

Turn practice into retention: spaced-repetition drills (SM-2) that schedule the right cards at the
right time and persist per user — the learning system on top of the Phase-3 tools.

## UX behaviour

- `/drills` — hub (login-gated) with a **stats header** (day streak 🔥, reviewed today, due now), a
  **▶ Review N due** button (cross-deck, when anything is due), and per-deck **due / new / learned**.
- `/drills/{deck}` — a single-deck session (due + new cards, capped).
- `/drills/review` — a **cross-deck** session of all due cards (each card shows its deck).
- A session: hear/read the question (**▶ Play** for aural, auto-plays after the first gesture; a
  rendered prompt for visual), **Show answer**, then self-grade **Again / Good / Easy** → the next card;
  ends with a summary.
- Four decks ship — **aural** (a **▶ Play** question): Interval recognition, Chord quality, Scale
  degrees; and **visual/reading** (a rendered prompt, no audio): Note reading (a note on the treble
  staff). All questions are generated client-side, reusing the Phase-3 audio + theory + staff code.
- Decks declare an optional `play(card)` (aural) and/or `prompt(card)` (a rendered React node, e.g.
  `StaffNotePrompt`); the session shows whichever the deck provides and only auto-plays aural cards.

## Data model

`review_cards` — SM-2 state per `(user_id, deck, card)`: `ease_factor`, `interval_days`, `repetitions`,
`due_at`, `last_reviewed_at`. `review_log` — one row per grade (`user_id`, `reviewed_at`) for the streak
+ daily count. Migrations `drizzle/0007_*`, `0008_*`. See **ADR 0014**.

## API contract

Paths from TypeSpec (tag `reviews`), generated hooks/types in `@TheY2T/tmr-api-client`; all
`@RequireAuth()`.

| Route | Result |
|---|---|
| `GET /me/reviews` | `{ decks: [{ deck, learned, due }], totalDue, reviewsToday, streakDays }` |
| `GET /me/reviews/{deck}` | `{ cards: ReviewState[] }` — stored states (client derives new/due) |
| `POST /me/reviews/{deck}/{card}` | 201 → updated `ReviewState` (applies SM-2 to `{quality}`) |

Grading also appends to `review_log`; the summary use-case computes `streakDays` (pure `currentStreakDays`
domain fn) + `reviewsToday` + `totalDue`. Hexagonal: pure `applySm2` domain fn; `ReviewRepository` port ←
`DrizzleReviewRepository`. Decks are **client-side** — the legacy self-grade decks live in
`packages/musickit-ui/src/drill-decks.tsx` (was `apps/web/src/lib/drill-decks.tsx` before ADR 0033) and
the backend only schedules.

## Drill engine (objective grading)

Behind `trainers.drill-engine`, `/drills` sessions render the **drill engine**: a generated prompt, an objective answer check across multiple input modalities, on-screen
rewards, and per-attempt logging + per-skill mastery. It keeps this SM-2 scheduler (grading from measured
accuracy) and the same deck/card keys. See **`docs/features/drill-engine.md`** (engine core in
`@TheY2T/tmr-music-core/drills/`, `DrillSession` in `@TheY2T/tmr-musickit-ui`, the `apps/api/src/attempts/`
context, and the `POST /me/drills/attempts` + `GET /me/drills/stats` contract).

## Tests

- **Backend (curl):** anon → 401; grade "Good"→ interval 1 → 6 → (Easy) 15 days with ease 2.5 → 2.6;
  "Again" lapses to 1 day / 0 reps; invalid grade → 422; deck state + summary correct.
- **Web (browser):** hub lists all four decks; the intervals session runs "Card 1 of 10" → Show answer
  → grade Good → "Card 2 of 10", persists (hub shows **1 learned**). The **Note reading** deck renders a
  staff prompt (no Play), reveals e.g. "C4", grades Easy → persists (SM-2: interval 1, ease 2.6). The
  **Scale degrees** deck plays audio and reveals e.g. "1 (Tonic)". New decks needed **no backend change**.
