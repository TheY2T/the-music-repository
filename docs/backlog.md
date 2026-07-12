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
| 🟢 **More content, not tools** | More songs (Song Player), licks/turnarounds (jazz ii-V, country, funk), voicings (9/13, quartal), CAGED for minor/7th chords, rhythm figures (triplets, 16ths, ties) | Low | Med |
| ◑ **Web MIDI input** | **Mostly done** — `useMidiInput` hook (built-in Web MIDI, no dep) wired into the **keyboard** (notes light up + sound) and the **chord identifier** (hold a chord → live detection). Verified with a mocked device. Ear-trainer answer-by-playing done | Med | **High** |
| ◑ **Metronome upgrades** | **Shipped** subdivisions (quarter/eighth/triplet/sixteenth) + polyrhythm layer in the metronome. Tap-tempo still open | Low | Med |

## Group 2 — New dependency-free tools (medium effort)

| Idea | Notes | Effort | Value |
|---|---|---|---|
| ✅ **Melodic dictation** | **Shipped** `/tools/melodic-dictation` — hear a C-major melody, rebuild it from a note palette, Check/Reveal | Med | High |
| ✅ **Sight-singing / solfège** | **Shipped** `/tools/solfege` — melody on the staff with movable-do solfège / scale-degree / note-name labels | Med | Med |
| ✅ **Rhythm dictation** | **Shipped** `/tools/rhythm-dictation` — hear a one-bar rhythm, rebuild it from note values, Check/Reveal | Med | High |
| ◑ **Key-signature & interval-construction quizzes** | **Key-signature quiz shipped** `/tools/key-quiz` (name the major key from its signature). Interval-construction still open | Low | Med |
| ✅ **Roman-numeral analyzer** | **Shipped** `/tools/analyzer` (`tools.analyzer`) — Roman numerals + Tonic/Predominant/Dominant function + borrowed-chord flag (`analyzeChordInKey`). Reharmonization suggestions still open | Med | High |
| ✅ **Transposer / capo tool** | **Shipped** `/tools/transposer` (`tools.transposer`) — transpose a progression + capo suggestions (`capoSuggestions`) | Low | Med |
| ✅ **Drum-pattern / groove library** | **Shipped** `/tools/grooves` — rock / pop / funk / half-time grooves (K/S/H) looped with a step cursor | Low | Med |
| ✅ **Bass-line generator** | **Shipped** `/tools/bassline` (`tools.bassline`) — roots / root–fifth / walking (root·3rd·5th·chromatic-approach) bass over a progression, with per-beat display | Med | Med |

## Group 3 — Integrative / "make it feel like an app" (medium–high effort)

| Idea | Notes | Effort | Value |
|---|---|---|---|
| 🟢 **"Practice room"** | Combine backing track + notation + chord diagrams under one key/tempo control | High | High |
| 🔗 **Save & share user creations** | Progressions, licks, custom songs — `localStorage` first, then the backend. Natural bridge into personalization | Med→High | High |
| 🔗 **Practice streaks / session logging for tools** | Tie tool usage into the Phase 2 progress dashboard (touches the API) | Med | Med |

## Group 4 — Where we'd finally add a library (honest)

| Idea | Notes | Effort | Value |
|---|---|---|---|
| 📚 **Full score rendering** | Multi-staff, beaming, slurs, dynamics, multi-part MusicXML → **Verovio / OSMD**. Our engraver is deliberately minimal | High | High |
| 📚 **High-quality instrument playback** | Real piano/guitar samples instead of oscillators → **soundfont-player / smplr** | Med | High |
| 📚 **Notation-synced playback of imported scores** | Moving cursor over a fully-engraved score → best paired with Verovio | High | High |

---

## Suggested first picks (when we return here)

1. 🟢 **Web MIDI input** — highest-leverage dependency-free addition; upgrades many existing tools at once.
2. 🔗 **localStorage save/share** — natural bridge toward Phase 6 (monetization gates *personalized* features).
3. 📚 **Soundfont playback** — the single biggest perceived-quality jump, if/when we accept a library.

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
| 💳 **Stripe Checkout + webhook → `grantPremium`** | The natural next slice. `POST /me/checkout` creates a Stripe **Checkout Session** (behind a `CheckoutGateway` port; `StripeCheckoutGateway` adapter, `MockCheckoutGateway` for dev/CI) and returns its URL; the web `/upgrade` redirects there. A `POST /billing/webhook` endpoint verifies the **signature**, and on `checkout.session.completed` / `customer.subscription.created|updated|deleted` calls the existing `Entitlements.grantPremium` / `revokePremium`. Replaces the mock `activate`. | High | **High** |
| 💳 **Subscription lifecycle** | Persist the Stripe `customer_id` + `subscription_id` (new columns/table); set `expires_at` from the billing period; renew on `invoice.paid`, revoke on `subscription.deleted` / `invoice.payment_failed` (with a grace period). The `expires_at` gate already exists in `DrizzleEntitlements.getPremium`. | Med | High |
| 💳 **Customer/billing portal** | Stripe Billing Portal session (`POST /me/billing-portal`) so users manage card / cancel / invoices without us building UI. | Low | Med |
| 🔗 **Webhook hardening** | Signature verification, **idempotency** (dedupe by event id — a `processed_webhooks` table), retry-safe handlers, raw-body handling (note: `bodyParser:false` + Better Auth already juggle body parsing — the webhook route needs the raw body). | Med | High (correctness) |
| 🟢 **Config + env** | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, price IDs → add to `apps/api/src/config/env.ts` Zod schema (every env var the API reads lives there). Keep test-mode keys out of the repo. | Low | — |

**Why it slots in cleanly:** app code already depends on the `Entitlements` port, not on how a grant is
created. Stripe becomes an *inbound adapter* (webhook → `grantPremium`) + an *outbound gateway*
(`CheckoutGateway`). The mock checkout stays as the dev/CI adapter so tests never call Stripe.

## Group 6B — Plans, pricing & entitlements depth

| Idea | Notes | Effort | Value |
|---|---|---|---|
| 🔗 **Tiered plans** | More entitlement keys than `premium` (e.g. `pro`, `institution`); model content `visibility`/gates per tier. `entitlements.key` already supports this. | Med | Med |
| 💳 **Trials, coupons, proration** | Stripe trial periods, promo codes, seat proration — mostly Stripe config once the webhook path exists. | Med | Med |
| 🟢 **Gift / redeem codes** | Grant premium via a one-time code (no card) — a `redeem_codes` table → `grantPremium(source:'redeem')`. Mirrors the classroom join-code pattern. | Low | Med |
| 🔗 **Entitlement audit log** | Record every grant/revoke (who, when, source, actor) for support + analytics — a `entitlement_events` table. | Low | Med |
| 🔗 **Annual vs monthly, regional pricing** | Multiple Stripe price IDs surfaced on `/upgrade`. | Low | Low |

## Group 6C — Classroom / institution depth

| Idea | Notes | Effort | Value |
|---|---|---|---|
| 💳 **Seat billing** | A teacher/school buys **N seats**; joining consumes a seat; billing via Stripe quantity. Extends `grant-premium` (currently unconditional) into metered seats with `expires_at`. | High | High |
| 🔗 **Assign content to a class** | Teacher assigns content/collections/drills; students see an assignments list; ties into the Phase 2 progress dashboard. | Med | High |
| 🔗 **Class progress overview** | Teacher dashboard: per-student completion/streaks across assigned material (reuses `content_progress` / reviews). | Med | High |
| 🔗 **Teacher role + invitations** | Currently *any* authed user can create a classroom. Add a `teacher` capability/role, and email invitations (vs. open join code) with accept links. | Med | Med |
| 🔗 **Auto-grant on join** | If a class has active seats/premium, new members get premium on join (today `grant-premium` only covers *current* members). | Low | Med |
| 🔗 **Leave / remove member, transfer ownership, archive class** | Roster management gaps. | Low | Low |

## Suggested Phase 6 first pick

💳 **Stripe Checkout + webhook** (Group 6A) — it turns the mock checkout into real revenue and unlocks the
lifecycle/seat-billing items. Gate it behind the existing `monetization.premium` flag and keep the
`MockCheckoutGateway` as the default until keys are provisioned, so nothing breaks in dev/CI without Stripe.
