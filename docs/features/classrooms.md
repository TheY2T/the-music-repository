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

## Next (Phase 6 later)

- Assign content/collections/drills to a classroom; class progress overview; transfer ownership;
  expiring class seats via real payment-provider seat billing (Stripe quantity).
