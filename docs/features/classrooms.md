# Feature: Classrooms — teacher mode (Phase 6)

- **Phase:** 6 (Slice 2) · **Status:** shipped
- **Flag key:** `education.classrooms` (`FlagKeys.Classrooms`). Default on. Builds on ADR 0015 (entitlements).

## Purpose

Teacher/classroom mode: a teacher creates a **classroom** with a join code, learners join, and the
teacher can **grant premium to the whole class** — a seat/institutional entitlement. This is the
education path into monetization: a teacher (or school) unlocks premium for their students at once.

## API (spec-first, all auth-gated + `education.classrooms`)

- `POST /me/classrooms` `{name}` → creates a classroom; caller becomes the **owner** (teacher). 201.
- `GET /me/classrooms` → classrooms the caller owns or has joined (`role`, `memberCount`, `premiumGranted`).
- `POST /classrooms/join` `{code}` → join by code (invalid code → 404 problem+json).
- `GET /classrooms/{id}` → detail + **roster** (owner or member only; otherwise 404, hiding existence).
- `POST /classrooms/{id}/grant-premium` → **owner only** (else 403); grants a `premium` entitlement
  (`source: 'classroom'`) to every current member and marks the classroom `premiumGranted`.

## Architecture (hexagonal)

- **`apps/api/src/classrooms/`** — `ClassroomsRepository` port ← `DrizzleClassrooms`; use-cases
  (`Create`/`List`/`Join`/`Get`/`GrantClassroomPremium`); `ClassroomsController`; domain errors
  (`ClassroomNotFoundError`, `InvalidJoinCodeError`, `NotClassroomOwnerError`). Tables `classrooms`
  (owner, unique `join_code`, `premium_granted`) + `classroom_members` (composite PK). Join codes are
  6-char, unambiguous-alphabet, `crypto.randomInt`, retried on collision.
- **Monetization tie-in:** `GrantClassroomPremiumUseCase` depends on the **`Entitlements`** port (from
  `EntitlementsModule`) — granting to a class is just `grantPremium(memberId, 'classroom')` per member.
  Those members then read `{premium:true, source:'classroom'}` and see premium content unlocked.
- **Web:** `src/lib/classrooms-api.ts`; `ClassroomsManager.tsx` (create / join / list / expandable roster
  + "Grant premium to class"); `/classrooms` page (login + flag gated); home nav link.

## Tests (verified)

- **curl (2 users):** editor creates "Piano Beginners" → join code; learner joins (role `member`,
  memberCount 1); editor roster shows `learner@local.dev`, `premiumGranted:false`; learner grant-premium
  → **403** (not owner); editor grant-premium → `premiumGranted:true`; learner `GET /me/subscription` →
  `{premium:true, source:'classroom'}`; anon `GET /me/classrooms` → 401.
- **Web (browser):** editor creates "Piano 101" (owner badge + join code); learner joins (member badge);
  editor opens the roster (sees the learner) and clicks **Grant premium to class** → "premium granted";
  the learner then has `source:'classroom'` premium and the premium item (`czerny-op-599-no-1`) unlocks
  (`media:1`).
- Build/lint/check-types green (25/25); spec regenerated; migration `0010`.

## Roster depth + auto-grant (Phase 6, 6C — shipped)

- **Auto-grant on join:** `JoinClassroomUseCase` grants premium (`source:'classroom'`) to a new member
  when the class is already `premiumGranted` — so joiners *after* a grant inherit it, not just members
  present at grant time. Verified: learner joins a granted class → `premium:true source:classroom`.
- **Roster management:** `POST /classrooms/{id}/leave` (a member removes themselves; the **owner is
  blocked → 403**, archive instead), `DELETE /classrooms/{id}/members/{memberId}` (owner only),
  `POST /classrooms/{id}/archive` (owner only — sets `archived_at`; archived classrooms are hidden from
  every roster: `findByCode`/`listForUser` filter `archived_at IS NULL`). `ClassroomMember` now carries
  `id` so the owner can target a member for removal. Verified curl (403 owner-leave / 204 remove /
  403 non-owner-archive / 204 archive / hidden from list).

## Assignments + class progress + transfer (Phase 6, 6C — shipped)

- **Assignments:** `classroom_assignments` table (`classroom_id`, `content_id`, `position`). Owner
  assigns content by slug — `POST /classrooms/{id}/assignments` `{ contentSlug }` (403 non-owner, 404
  unknown slug), `DELETE /classrooms/{id}/assignments/{slug}`, `GET /classrooms/{id}/assignments` (any
  owner/member). New use-cases `AssignContent`/`UnassignContent`/`GetAssignments`.
- **Class progress overview:** `GET /classrooms/{id}/progress` (owner) — joins `classroom_assignments`
  × members × `content_progress` → per-student `{ completedCount, total }`. `GetClassProgress`
  computes the matrix; no cross-module coupling (queries `content_progress` directly).
- **Transfer ownership:** `POST /classrooms/{id}/transfer` `{ memberId }` (owner; the target must be a
  current member → else 404). The new owner leaves `classroom_members`, the old owner joins it.
- **Web:** `ClassroomsManager`'s "Manage" panel gained assign/remove content, a class-progress list,
  member remove / make-owner, and archive/leave — using `classrooms-api.ts` helpers. Verified curl
  (403/404/assign/progress 1-of-2/transfer role-swap) + browser (create → assign → progress → archive).

## Teacher role (Phase 6, 6C — shipped)

- `access-control.ts` gained a `classroom: ['create']` permission + a **`teacher` role** (admins also
  hold it). `POST /me/classrooms` is now `@RequirePermissions({ classroom: ['create'] })`, so
  learners/editors get **403** and only teachers/admins create classrooms. Seeded `teacher@local.dev`
  (role `teacher`, password `password123`). Web: `/classrooms` passes `canCreate = role ∈ {admin,
  teacher}` to `ClassroomsManager`, which hides the create form for non-teachers (join still works).
  Verified curl (learner 403 / teacher 201 / admin 201) + browser (create form present for teacher,
  absent for learner).

## Email invitations (Phase 6, 6C — shipped)

- **Mail transport** (`apps/api/src/mail/`): a `MailSender` port bound to `LogMailSender` (dev/CI —
  logs the message, no delivery) or `SmtpMailSender` (nodemailer) when `SMTP_URL` is set. `MailModule`
  picks by env; app code depends only on the port. See `.env.example` (`SMTP_URL`, `MAIL_FROM`).
- **Invitations** (`classroom_invitations` table): `POST /classrooms/{id}/invitations` `{ email }`
  (owner) mints a token, emails an accept link, and returns `{ email, acceptUrl }` (so the teacher can
  share it too — handy in dev where mail is only logged). `GET /classrooms/{id}/invitations` lists them;
  `POST /classrooms/invitations/{token}/accept` joins the signed-in user (auto-granting premium if the
  class has it) and marks the invite accepted (a reused/invalid token → 404).
- **Web:** `ClassroomsManager` gained an owner **Invitations** section (invite by email + pending list);
  a new `/classrooms/accept?token=…` page (`AcceptInvitation.tsx`) accepts the token (routing through
  sign-in first if needed). Verified curl (invite → dev-mail logged → accept → member; reused → 404) +
  browser (invite form → pending shows).

## Next (Phase 6 later)

- Expiring class seats via real payment-provider seat billing (Stripe quantity).
