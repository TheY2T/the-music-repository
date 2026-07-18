# Feature: Drill engine (objective grading + rewards)

- **Phase:** P (drills expansion) · **Status:** Complete — Phases 0–5 shipped (multiple-choice,
  ear-identify, play-instrument, pitch/mic, rhythm-tap; ear progressions/cadences; mastery dashboard;
  Tier-1/2/3/4 rewards)
- **Flags** (`@TheY2T/tmr-flags`): `trainers.drill-engine` (master gate; off = legacy self-grade
  `ReviewSession`), `trainers.celebrations` (reward mechanics), and the per-modality gates
  `trainers.play-instrument` / `trainers.ear` / `trainers.pitch-mic` / `trainers.rhythm-tap` (later phases).

## Purpose

The original `/drills` was a **self-graded flashcard** — the learner clicked "Show answer" and rated
their own recall (Again/Good/Easy), with no answer input and no objective correctness. The drill engine
replaces that with **objective answer-checking across multiple input modalities**, keeps the SM-2
scheduler (grading from measured accuracy instead of self-grade), persists per-attempt results + per-skill
mastery, and rewards the learner on-screen. It coexists with the legacy path behind `trainers.drill-engine`.

## Architecture

- **Engine core (portable, no React) — `@TheY2T/tmr-music-core/drills/`:** `drill-types.ts` (the
  `DrillItem` / `DrillItemGenerator` / `AnswerModality` / `DrillPresentation` abstraction) and
  `generators/` — the four original decks reimplemented as pure `DrillItemGenerator`s (`intervals`,
  `chord-quality`, `scale-degrees`, `staff-notes`). A generator `generate(card, level, rng)`s a concrete
  item and objectively `check`s a response (0–1 accuracy). `rng` is injected so generators are
  deterministically unit-testable. `audio-prompt.ts` plays an audio presentation; `reward-chime.ts` is the
  opt-out reward cue.
- **Session runtime + inputs — `@TheY2T/tmr-musickit-ui`:** `DrillSession.tsx` (the objective successor to
  `ReviewSession.tsx` — same SM-2 queue via `getDeckReviews`, but generate → present → check → reward →
  record). `drills/inputs/` holds the per-modality widgets (`MultipleChoiceInput`, `EarIdentifyInput`,
  `OptionGrid`, `InstrumentInput`; later phases add pitch/rhythm). **Play-instrument is explore-then-submit:**
  the learner plays freely on the capture surface (every key/fret sounds) and an explicit **Submit** commits
  the chosen note; `InstrumentInput` picks `drills/AnswerKeyboard.tsx` (one-octave keyboard) or
  `drills/AnswerFretboard.tsx` (guitar neck) by `DrillItem.instrument`; both reuse the note service +
  `useMidiInput` and, after answering, highlight the correct pitch class (success) and a wrong choice
  (destructive). **Pitch/mic** (`PitchMicInput`) listens via `getUserMedia` + an `AnalyserNode`, runs
  `detectPitchHz`/`hzToNote`, and submits the sustained pitch class (pure `drills/pitch-match.ts` —
  cents-tolerance + sustain debounce, unit-tested); it falls back to `InstrumentInput` (keyboard) when
  there's no mic, permission is denied, or the learner opts out, so the drill is always answerable.
  **Rhythm-tap** (`RhythmTapInput`) plays a one-bar pattern (count-in + `scheduleDrum`), captures pad/Space
  taps, normalizes them to beats (tap 1 = downbeat) and submits for timing grading (pure
  `drills/rhythm-grade.ts` `gradeRhythm` — a tolerance window yields **partial accuracy**, which the server
  maps to a shaky-pass quality 3). `drills/celebration/` holds the reward layer (`celebration-tiers.ts` config, `ScorePop`,
  `ComboCounter`). Engine-only decks (beyond the four legacy) are listed in the hub via
  `drills/engine-decks.ts`, each gated by its per-modality flag.
- **Backend — `apps/api/src/attempts/` (hexagonal):** objective attempts + mastery, **separate from but
  delegating to** the `reviews` context. `RecordDrillAttemptUseCase` persists the attempt, maps accuracy →
  SM-2 quality (`domain/grade.ts` `accuracyToQuality`), and calls the reviews `GradeCardUseCase` (which
  writes `review_cards` + `review_log` — so SM-2 scheduling and streaks stay single-sourced). Mastery is a
  pure EWMA over attempts (`domain/mastery.ts`), computed on read. Port `AttemptLog` ← `DrizzleAttemptLog`.

## Rewards (celebration hierarchy)

One config — `celebration-tiers.ts` — decides which effect fires at which trigger, so intensity is
reserved for rarity. **Tier 1 (per answer):** success/wrong glow on the options/keys, a `ScorePop` "+N",
and a `DrillFeedback` particle burst + reward chime. **Tier 2 (combo):** a `ComboCounter` (flame + count)
that escalates colour/size as the run crosses `COMBO_THRESHOLDS` (5/10/20), and at each threshold a bigger
gold `combo` burst (a `kind` on `drill-feedback-scene`). **Tier 3 (session complete):** `SessionSummary`
replaces the old static "Session complete" text with a 1–3 **star rating** on accuracy (`starsForAccuracy`),
counting-up stats, an optional personal-best callout (`isPersonalBest` from the recorded attempt), and a
`confetti-scene` fall behind it. Tier 4 (level-up/mastery/streak-milestone) lands in Phase 5. Every reward
degrades to a static outcome under `prefers-reduced-motion`; audio is opt-out and persisted (`tmr.drill.sound`). **Tier 4 (progression):**
`RecordDrillAttemptUseCase` returns `level` + `leveledUp` (mastery before vs after the attempt); DrillSession
fires a level-up `toast()` and the `SessionSummary` reveals a `LevelUpFanfare` + `AchievementBadge`. A
streak-day milestone (7/30/100/365) toasts once on the hub (localStorage-guarded). **Mastery UI:** the hub
(`DrillsHub`) shows a per-deck mastery bar + tier badge (`AchievementBadge`, beginner→expert) from
`getDrillStats`.

## Data model

Adds `drill_attempts` (`id`, `user_id`, `deck`, `card`, `modality`, `accuracy`, `correct`, `response_ms`,
`created_at`; index on `(user_id, deck)`). `review_cards` / `review_log` are unchanged — the engine keeps
the **same deck + card keys** as the legacy decks, so a user's SM-2 schedule carries over when a deck flips
to objective grading. Migration `drizzle/0022_*`.

## API contract

Paths from TypeSpec (tag `drills`), types in `@TheY2T/tmr-api-client`; all `@RequireAuth()` +
`@RequireFlagsEnabled(trainers.drill-engine)`.

| Route | Result |
|---|---|
| `POST /me/drills/attempts` | 201 → `{ state: ReviewState, quality, isPersonalBest }` (records + grades) |
| `GET /me/drills/stats` | `{ skills: SkillMastery[], streakDays, attemptsToday }` |
| `GET /me/drills/stats/{deck}` | `SkillMastery` for one deck |

## Tests

- **Unit (music-core):** each generator (`generate` + `check` round-trips, card-key stability, level).
- **Unit (api):** `accuracyToQuality` (grade), `mastery` (EWMA + level), `record-drill-attempt` (quality
  mapping + SM-2 delegation + no double-write), and the backfilled `sm2` / `streak` domain tests.
- **Integration (api):** `DrizzleAttemptLog` over Testcontainers Postgres.
- **Component (musickit-ui):** `celebration-tiers`, `OptionGrid` (objective feedback), `ScorePop`
  (reduced-motion fallback).
- **E2E (`apps/web/e2e/drills.spec.ts`):** anon → sign-in redirect; a learner answers a note-reading drill,
  sees objective feedback + Next, and the attempt is recorded.
