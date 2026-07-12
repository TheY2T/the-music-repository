# Extended Features Backlog

Ideas captured for **review after all phases (0 → 6) are complete**. Nothing here is committed work — it
is a parking lot of candidate extensions. The first half covers **Phase 5 (play-along & practice tools)**;
the **Phase 6 — Monetization extensions** section at the bottom covers Stripe wiring, plans/pricing, and
classroom/institution depth. Each item notes rough **effort**, **value**, and its dependency/backend
footprint.

Status legend: 🟢 dependency-free · 📚 needs a client library · 💳 needs a payment provider (Stripe) ·
🔗 touches the backend/other phases.

> Context: Phase 5 shipped Slices A–Z (19 play-along tools; 34 total in the `/tools` hub), all
> client-side and dependency-free — including MusicXML import, multi-voice engraving, and a
> pitch-preserving practice player achieved with `DOMParser`, SVG, and `HTMLAudioElement.preservesPitch`.
> The items below go **beyond** the delivered plan menu.

---

## Group 1 — Deepen what exists (low effort, high polish)

| Idea | Notes | Effort | Value |
|---|---|---|---|
| 🟢 **More content, not tools** (ongoing) | Lick library extended with **jazz** (bebop ii–V–I), **country** (double-stop) and **funk** (16th-note) categories. Still room for more songs, 9/13/quartal voicings, minor/7th CAGED, rhythm figures — this is a perpetual "add content" line, not a one-time task | Low | Med |
| ◑ **Web MIDI input** | **Mostly done** — `useMidiInput` hook (built-in Web MIDI, no dep) wired into the **keyboard** (notes light up + sound) and the **chord identifier** (hold a chord → live detection). Verified with a mocked device. Ear-trainer answer-by-playing done | Med | **High** |
| ✅ **Metronome upgrades** | **Shipped** subdivisions (quarter/eighth/triplet/sixteenth) + polyrhythm layer + **tap-tempo** (averages recent tap intervals → BPM) in the metronome | Low | Med |

## Group 2 — New dependency-free tools (medium effort)

| Idea | Notes | Effort | Value |
|---|---|---|---|
| ✅ **Melodic dictation** | **Shipped** `/tools/melodic-dictation` — hear a C-major melody, rebuild it from a note palette, Check/Reveal | Med | High |
| ✅ **Sight-singing / solfège** | **Shipped** `/tools/solfege` — melody on the staff with movable-do solfège / scale-degree / note-name labels | Med | Med |
| ✅ **Rhythm dictation** | **Shipped** `/tools/rhythm-dictation` — hear a one-bar rhythm, rebuild it from note values, Check/Reveal | Med | High |
| ✅ **Key-signature & interval-construction quizzes** | **Both shipped** — `/tools/key-quiz` (name the major key from its signature) + `/tools/interval-quiz` (build a named interval above a given note, `tools.interval-quiz`) | Low | Med |
| ✅ **Roman-numeral analyzer** | **Shipped** `/tools/analyzer` (`tools.analyzer`) — Roman numerals + Tonic/Predominant/Dominant function + borrowed-chord flag (`analyzeChordInKey`) + **reharmonization suggestions** (`reharmonizations`): per-chord tritone sub / relative maj-min / secondary dominant / modal interchange, each hearable + one-click apply | Med | High |
| ✅ **Transposer / capo tool** | **Shipped** `/tools/transposer` (`tools.transposer`) — transpose a progression + capo suggestions (`capoSuggestions`) | Low | Med |
| ✅ **Drum-pattern / groove library** | **Shipped** `/tools/grooves` — rock / pop / funk / half-time grooves (K/S/H) looped with a step cursor | Low | Med |
| ✅ **Bass-line generator** | **Shipped** `/tools/bassline` (`tools.bassline`) — roots / root–fifth / walking (root·3rd·5th·chromatic-approach) bass over a progression, with per-beat display | Med | Med |

## Group 3 — Integrative / "make it feel like an app" (medium–high effort)

| Idea | Notes | Effort | Value |
|---|---|---|---|
| ✅ **"Practice room"** | **Shipped** `/tools/practice-room` (`tools.practice-room`) — a looping band (drums + walking bass + comping) over a chord progression with the current chord's guitar diagram shown and a beat cursor | High | High |
| ✅ **Save & share user creations** | **Shipped** — the chord analyzer saves/loads named progressions to `localStorage` when anonymous, and **syncs to the signed-in user's account** via a spec-first hexagonal backend (`progressions/` feature, `ProgressionLibrary` port + Drizzle `saved_progressions`, `/me/progressions` PUT/GET/DELETE, `personalization.saved-progressions` flag). The bridge into Phase-6 personalization | Med→High | High |
| ✅ **Practice streaks / session logging for tools** | **Shipped** — `ToolPracticeLogger.tsx` (invisible island on every `/tools/*` page, gated `learning.tool-practice` + `learning.progress` + signed-in) counts **active** (tab-visible) time and logs whole minutes via the existing `POST /me/practice`, feeding the Phase-2 dashboard's streak + total practice minutes. No new backend | Med | Med |

## Group 4 — Where we'd finally add a library (honest)

| Idea | Notes | Effort | Value |
|---|---|---|---|
| ✅ **Full score rendering** | **Shipped** `/tools/score` (`tools.score`) — **Verovio** (WASM, first library dep) engraves MusicXML/MEI to SVG; upload / edit-source / sample. Dynamic-imported so it never weighs down other tools | High | High |
| ✅ **High-quality instrument playback** | **Shipped** `/tools/soundfont` (`tools.soundfont`) — sampled General-MIDI instruments via **smplr**, lazy-loaded, with **graceful fallback** to the oscillator engine when samples can't load (offline). Reuses `useMidiInput` | Med | High |
| ✅ **Notation-synced playback of imported scores** | **Shipped** — `/tools/score` gained **Play** + a speed slider: Verovio's `renderToTimemap` + `getMIDIValuesForElement` schedule the audio (`scheduleTone`) and `getElementsAtTime` drives a red highlight cursor over the engraved SVG (per-note, synced). Reuses the Verovio toolkit already loaded for engraving | High | High |

---

## Suggested first picks (when we return here)

**The entire Phase-5 backlog above (Groups 1–4) is now shipped** — including the two library items
(Verovio score rendering + notation-synced playback, smplr soundfonts), analyzer reharmonization, the
backend save/share sync, and tool-practice logging. The only remaining line is the perpetual "more
content" one (add songs / voicings / CAGED shapes as desired).

The next substantive body of work is the **Phase 6 — Monetization extensions** below (the headline is
Stripe wiring), which is gated on real payment-provider credentials.

---

# Phase 6 — Monetization extensions

Phase 6 shipped two slices — **premium entitlements** (locked-preview gating + a *mock* checkout, ADR 0015)
and **teacher/classroom mode** (seat entitlements). The `entitlements` table + `Entitlements` port were
deliberately shaped for real billing: `source`, `granted_at`, `expires_at`, and a grant keyed per user.
These items extend that foundation. Tags: 💳 needs a payment provider (Stripe) + its keys · 🔗 backend ·
🟢 self-contained.

## Group 6A — Real payment integration (the headline: Stripe wiring)

| Idea | Notes | Effort | Value |
|---|---|---|---|
| ✅ **Stripe Checkout + webhook → `grantPremium`** | **Shipped** (ADR 0016) — `POST /me/checkout` (behind `CheckoutGateway` port; `MockCheckoutGateway` default, `StripeCheckoutGateway` ready when `STRIPE_SECRET_KEY` is set) returns a checkout URL; `/upgrade` redirects there. `POST /billing/webhook` verifies + normalizes the event and on `checkout.session.completed` / `customer.subscription.deleted` calls `Entitlements.grantPremium` / `revokePremium`. Verified curl + browser end-to-end. See `docs/features/billing.md` | High | **High** |
| ◑ **Subscription lifecycle** | **Mostly shipped** — `checkout_sessions` persists `stripe_customer_id`/`stripe_subscription_id`; **`invoice.paid` → renewal** (both gateways re-grant with a fresh period; mock sets 30-day `expires_at`, honored by `DrizzleEntitlements.getPremium`); `customer.subscription.deleted` → revoke. Still open: `invoice.payment_failed` grace period, real `expires_at` from Stripe's period end | Med | High |
| ✅ **Customer/billing portal** | **Shipped** — `POST /me/billing-portal` returns a portal URL (mock → the in-app `/upgrade` page; Stripe → `billingPortal.sessions.create` for the user's customer). Verified curl | Low | Med |
| ◑ **Webhook hardening** | **Idempotency shipped** (`processed_webhooks` table + `WebhookLedger` — replayed events are no-ops, verified). Signature verification is implemented in `StripeCheckoutGateway` (mock skips it). Still open: **raw-body capture** on the webhook route (`bodyParser:false` + Better Auth mean the exact bytes Stripe signs aren't captured yet) | Med | High (correctness) |
| ✅ **Config + env** | **Shipped** — `STRIPE_SECRET_KEY?`, `STRIPE_PRICE_ID?`, `STRIPE_WEBHOOK_SECRET`, `WEB_BASE_URL` in `apps/api/src/config/env.ts` + `.env.example`. Unset secret → mock gateway | Low | — |

**Why it slots in cleanly:** app code already depends on the `Entitlements` port, not on how a grant is
created. Stripe becomes an *inbound adapter* (webhook → `grantPremium`) + an *outbound gateway*
(`CheckoutGateway`). The mock checkout stays as the dev/CI adapter so tests never call Stripe.

## Group 6B — Plans, pricing & entitlements depth

| Idea | Notes | Effort | Value |
|---|---|---|---|
| ✅ **Tiered plans** | **Shipped** — content `tier` (`premium`/`pro`/`institution`); ranked entitlements (`TIER_RANK`, `institution` ⊃ `pro` ⊃ `premium`). Catalogue gating compares the viewer's max entitlement rank vs the item's tier. `Entitlements.grant(key)` + `activeKeys`; granted via redeem code (`tier`) **or** checkout (`{ plan }`); lock badges + subscribe buttons for all three tiers. Verified: full 3-tier ladder gates correctly | Med | Med |
| 💳 **Trials, coupons, proration** | Stripe trial periods, promo codes, seat proration — mostly Stripe config once the webhook path exists. | Med | Med |
| ✅ **Gift / redeem codes** | **Shipped** — `redemption/` feature (`redeem_codes` + `RedeemCodeStore`): staff mint codes (`POST /admin/redeem-codes`, 403 `NOT_STAFF` otherwise); `POST /me/redeem` atomically consumes a use → `grantPremium(source:'redeem')`. Multi-use + expiry supported. Verified curl (403/201/redeem/exhaustion 404) | Low | Med |
| ✅ **Entitlement audit log** | **Shipped** — `entitlement_events` table; `DrizzleEntitlements` appends a `grant`/`revoke` row (key, source, at) on every change; `GET /me/entitlements/history`. Verified | Low | Med |
| 🔗 **Annual vs monthly, regional pricing** | Multiple Stripe price IDs surfaced on `/upgrade`. (Needs Stripe.) Still open | Low | Low |

## Group 6C — Classroom / institution depth

| Idea | Notes | Effort | Value |
|---|---|---|---|
| 💳 **Seat billing** | A teacher/school buys **N seats**; joining consumes a seat; billing via Stripe quantity. Extends `grant-premium` (currently unconditional) into metered seats with `expires_at`. | High | High |
| ✅ **Assign content to a class** | **Shipped** — `classroom_assignments` table; owner assigns content by slug (`POST /classrooms/{id}/assignments`, 403 non-owner, 404 unknown slug), `DELETE .../assignments/{slug}`, `GET .../assignments` (any member). Web: assign/remove + list in `ClassroomsManager`. Verified curl + browser | Med | High |
| ✅ **Class progress overview** | **Shipped** — `GET /classrooms/{id}/progress` (owner) reads `content_progress` for members × assigned content → per-student `completedCount/total`. Web: progress list in the manage panel. Verified (learner 1/2) | Med | High |
| ✅ **Teacher role + invitations** | **Both shipped** — `teacher` role + `classroom:create` (only teachers/admins create classrooms; `teacher@local.dev`; web hides the create form). **Email invitations:** a `MailSender` port (`LogMailSender` dev / `SmtpMailSender` when `SMTP_URL` set); `POST /classrooms/{id}/invitations` emails an accept link, `POST /classrooms/invitations/{token}/accept` joins the user; web invite form + `/classrooms/accept` page. Verified curl + browser | Med | Med |
| ✅ **Auto-grant on join** | **Shipped** — `JoinClassroomUseCase` grants premium (`source:'classroom'`) to a new member when the class is already `premiumGranted`. Verified: learner joins a granted class → `premium:true source:classroom` | Low | Med |
| ✅ **Leave / remove member, transfer ownership, archive class** | **Shipped** — `leave` (owner blocked → 403), `DELETE .../members/{memberId}` (owner), `archive` (owner; hidden from all rosters), **`POST /classrooms/{id}/transfer`** (owner → a member becomes owner, old owner joins as a member; non-member → 404). Web: remove / make-owner / archive / leave in `ClassroomsManager`. Verified curl + browser | Low | Low |

## Phase 6 status

Most of Phase 6 is now shipped and verified with the mock gateway (no keys): **checkout + webhook**
(ADR 0016), **billing portal**, **invoice.paid renewal**, **gift/redeem codes**, **entitlement audit
log**, **classroom auto-grant on join**, and **roster management** (leave / remove / archive).

Also shipped since: **assign content to a class** + **class progress overview**, **transfer ownership**,
and the classroom management **web UI** (assign / progress / roster / transfer / archive in
`ClassroomsManager`).

**Remaining — genuinely gated on real Stripe test keys** (`STRIPE_SECRET_KEY` flips the gateway):
raw-body capture on the webhook route (needed for Stripe signature bytes), `invoice.payment_failed`
grace period + real period-end `expires_at`, trials/coupons/proration, annual/monthly price IDs, and
**seat billing** (Stripe quantity).

Also shipped since: **tiered plans** (content `tier` + ranked entitlements — `pro` ⊃ `premium`; catalogue
gates per tier; redeem codes mint a tier; Premium/Pro lock badges), the **teacher role**
(`classroom:create` + `teacher` role; `teacher@local.dev`), **pro-via-checkout** (`POST /me/checkout
{ plan }` records the tier on the session; the webhook grants it; Premium/Pro subscribe UI + mock
checkout; status reflects any tier; cancel revokes all tiers), and a **mail transport + classroom email
invitations** (`MailSender` port — `LogMailSender` dev / `SmtpMailSender` when `SMTP_URL` set; invite →
accept-link email → accept joins the class).

And the **`institution` tier** (top tier: `institution` ⊃ `pro` ⊃ `premium`) — `TIER_RANK` extended,
an institution-tier seed item, granted via redeem code or `POST /me/checkout { plan: 'institution' }`,
Premium/Pro/Institution subscribe buttons + lock badges. Verified: the full 3-tier ladder gates
correctly (each tier a superset of the ones below).

**All that remains is genuinely gated on real Stripe test keys** (`STRIPE_SECRET_KEY` flips the gateway,
`SMTP_URL` flips mail): raw-body capture on the webhook, `invoice.payment_failed` grace + real
period-end expiry, trials/coupons/proration, annual/monthly price IDs, and seat billing (Stripe
quantity). **Every no-keys Phase-6 item is delivered** — all behind the existing `Entitlements` /
`CheckoutGateway` / `MailSender` ports.
