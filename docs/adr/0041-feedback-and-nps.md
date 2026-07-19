# ADR 0041 — Feedback surface & Net Promoter Score

- **Status:** accepted
- **Date:** 2026-07

## Context

The site had no channel for users to send a suggestion, report a bug, or signal overall satisfaction. We
want a first-class feedback surface plus a way to measure sentiment over time, all managed from the admin
CMS. Two established shapes framed the design: a **feedback widget** (best kept non-intrusive, short, and
categorised into a small set of buckets) and **Net Promoter Score** — where *relational* NPS (the "how
likely are you to recommend" question) is best shown to activated users on a low-friction moment and
throttled to roughly once a quarter to avoid survey fatigue, with responses bucketed as promoters (9–10),
passives (7–8), and detractors (0–6) and the score computed as `%promoters − %detractors`.

This is the inverse of the FAQ feature (ADR-era `content.faq`): there the read side is public and the write
side is admin-authored; here the **write** side is user-facing and the **read** side is admin-only, closer
to the Ko-fi inbound pattern (ADR 0040).

## Decision

1. **One hexagonal `feedback` feature covering four capabilities, each behind its own DB-backed flag**
   (ADR 0035): `feedback.form` (the `/feedback` page + footer link + submit + admin triage) ships **on**;
   `feedback.launcher` (a global floating button), `feedback.bugs` (the bug type + page/user-agent capture),
   `feedback.nps` (the in-app prompt + NPS endpoints + admin analytics), and `feedback.board` (the public
   `/roadmap` voting board) ship **off**, to be reviewed and enabled per environment.

2. **Submissions are logged-in only and private to admins.** `POST /feedback` uses `@RequireAuth()` and
   reads the acting user via the `CurrentUser` port; the admin read/triage side is RBAC-gated on a new
   `feedback` access-control resource (`read`/`update` for admin + editor, `delete` admin-only) rather than
   reusing `content`. A submission becomes publicly visible on the board only when an admin sets `is_public`.

3. **A single `feedback_submissions` table with a `type` discriminator** backs suggestions, bug reports, and
   board items; `feedback_votes` has a composite `(submission_id, user_id)` primary key so upvoting is
   idempotent, with `upvote_count` denormalised for board sort. The `bug` type is additionally gated by
   `feedback.bugs`, evaluated in-process in the controller (a per-field flag inside one endpoint), and
   page/user-agent context is only captured for bug reports.

4. **NPS is relational, not transactional.** Eligibility is computed server-side from `nps_prompt_state`
   (per-user last-shown/dismissed/responded) plus account age: shown only to signed-in learners with an
   account ≥ 30 days, never to staff (admin/editor), and re-shown no sooner than 90 days after a response,
   30 days after a dismissal, or 7 days after merely being shown. Scoring lives in pure domain
   (`domain/nps.ts`): bucket classification, `%promoters − %detractors`, and a per-month trend, so it is
   unit-tested without a database. The bucket is derived on read and never stored.

5. **Frontend follows the shell/ACL rules (ADR 0033/0037).** Islands live in `@TheY2T/tmr-common-ui`
   (`FeedbackForm`, `FeedbackLauncher`, `NpsPrompt`, `FeedbackBoard`, `AdminFeedbackManager`,
   `NpsAnalyticsDashboard`), take `locale`/`flags`/`user` as props, and read/write through a new
   `@TheY2T/tmr-web-acl/feedback-api` module (the only place allowed to name api-client), importing DTO types
   from `@TheY2T/tmr-web-acl/dto`. The launcher and NPS prompt mount globally in `BaseLayout`, each gated on
   its flag. Admin triage reuses the shared `usePagination` + `PaginationBar` table standard.

## Consequences

- Enabling a capability is a per-environment flag toggle in `/admin/feature-flags`; nothing else ships to
  turn one on. The launcher's final look is a deferred decision — it exists behind `feedback.launcher`.
- The public board is server-paginated and reads through the same `feedback-api` module rather than the
  `useApiData()` port; if it grows, a server-content SSR path (for crawlability) can be added like other
  detail pages, but while `feedback.board` is off it is not indexed anyway.
- The `feedback` resource is the first access-control resource for user-generated (not admin-authored)
  content; future user-submission features can reuse the pattern.
- NPS throttling anchors on `last_shown_at` set when eligibility returns true, so the eligibility GET has a
  deliberate write side-effect — acceptable for a once-per-window prompt, and it keeps the client stateless.
