# Feature: Feedback & Net Promoter Score

- **Status:** shipped
- **Flag keys:** `feedback.form` (on), `feedback.launcher`, `feedback.bugs`, `feedback.nps`,
  `feedback.board` (all off by default) — from `@TheY2T/tmr-flags`.

## Purpose

Give users a first-class channel to tell us what they think — send a suggestion, report a bug, or leave
praise — and measure overall satisfaction over time with a Net Promoter Score programme. Everything is
managed from the admin CMS (triage + NPS analytics). Each surface is independently flag-gated so it can be
switched on per environment once reviewed.

## UX behaviour

- **Feedback form** (`feedback.form`, on) — a dedicated `/feedback` page + a footer link. The form picks a
  category (suggestion / bug / praise / other), an optional title, and a message. Submission requires
  sign-in; anonymous visitors see a sign-in prompt. Bug reports (when `feedback.bugs` is on) additionally
  capture the current page path + browser user-agent for triage context.
- **Floating launcher** (`feedback.launcher`, off) — a non-intrusive bottom-right button on every page that
  opens the same form in a modal. Built but off pending a design review.
- **NPS prompt** (`feedback.nps`, off) — a slide-up card asking "how likely are you to recommend…" on a
  0–10 scale with an optional comment. Relational NPS best practices: shown only to **activated, signed-in
  learners** (account ≥ 30 days; staff excluded so internal use never skews the score), throttled to roughly
  once a quarter (no re-prompt within 90 days of a response, 30 days of a dismissal, or 7 days of merely
  being shown). Dismissible.
- **Voting board** (`feedback.board`, off) — a public `/roadmap` page listing submissions an admin has
  marked public, sortable by most-voted / newest, with per-user upvotes and a status badge.
- **Admin** — `/admin/feedback` is a triage table (filter by type/status, paginated) with a detail dialog
  to set status, add internal notes, toggle public, or delete. `/admin/feedback/nps` is the NPS dashboard:
  the headline score, promoter/passive/detractor counts, a monthly trend, and recent comments (with the
  submitter's email for close-the-loop follow-up).

## Data model

`apps/api/src/infrastructure/database/schema.ts` (migration `drizzle/0029_*`):

- **`feedback_submissions`** — `type` (idea|bug|praise|other), `title?`, `message`, `status`
  (new|triaging|planned|in_progress|shipped|declined|closed), `user_id` (FK, not null), `locale?`,
  `page_url?`/`user_agent?` (bug context), `is_public`, `upvote_count` (denormalised), `admin_notes?`,
  timestamps. Indexed on status/type/is_public.
- **`feedback_votes`** — `(submission_id, user_id)` composite PK → one idempotent upvote per user.
- **`nps_responses`** — `user_id` (FK), `score` (0–10), `comment?`, `source?`, `created_at`. The bucket is
  derived on read, never stored.
- **`nps_prompt_state`** — `user_id` PK + `last_shown_at`/`last_dismissed_at`/`last_responded_at`, driving
  eligibility without scanning responses.

Roles: a new `feedback` access-control resource (`apps/api/src/auth/access-control.ts`) — `read`/`update`
for admin + editor, `delete` admin-only.

## API contract

Declared in `packages/api-spec/main.tsp` → `@TheY2T/tmr-contracts`. User-facing (auth): `POST /feedback`,
`GET /feedback/board`, `POST|DELETE /feedback/{id}/vote`, `GET /feedback/nps/eligibility`,
`POST /feedback/nps`, `POST /feedback/nps/dismiss`. Admin (`feedback` RBAC): `GET /admin/feedback`,
`GET|PATCH|DELETE /admin/feedback/{id}`, `GET /admin/feedback/nps`, `GET /admin/feedback/nps/analytics`.
Each route is gated by its corresponding flag (`@RequireFlagsEnabled`); the `bug` type is additionally
gated by `feedback.bugs` (evaluated in-process). The API is hexagonal (`apps/api/src/feedback/`):
`FeedbackRepository` / `NpsRepository` ports → Drizzle adapters; NPS scoring is pure domain
(`domain/nps.ts`).

Frontend: islands in `@TheY2T/tmr-common-ui` (`FeedbackForm`, `FeedbackLauncher`, `NpsPrompt`,
`FeedbackBoard`, `AdminFeedbackManager`, `NpsAnalyticsDashboard`) read/write through
`@TheY2T/tmr-web-acl/feedback-api` and take DTO types from `@TheY2T/tmr-web-acl/dto`.

## Help topics

None registered.

## Tests

- **Unit** (`apps/api/src/feedback/**/*.test.ts`) — NPS scoring math + monthly trend, eligibility throttle
  (activation window / response / dismissal / shown cooldowns, staff exclusion), submit validation + bug
  gating + context capture, admin not-found errors, vote/unvote.
- **Integration** (`*.integration.test.ts`, Testcontainers) — both Drizzle repos incl. the idempotent-vote
  constraint and board-visibility rule.
- **Component** (`packages/common-ui/src/FeedbackForm.test.tsx`) — sign-in gating, bug-type visibility,
  empty-message validation, successful submit.
- **E2E** (`apps/web/e2e/feedback.spec.ts`) — page heading, footer link, anonymous sign-in prompt, and a
  signed-in learner submitting feedback (mock mode).

Run: `pnpm test`, `pnpm test:integration` (Docker), `pnpm --filter @TheY2T/tmr-web test:e2e`.
