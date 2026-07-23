# ADR 0053 — WhatsApp phone-OTP sign-in

- **Status:** Accepted
- **Date:** 2026-07
- **Context:** Sign-in so far is email/password plus OAuth social providers (ADR 0050, ADR 0052). We want
  a phone-first, passwordless option: the learner enters a phone number, receives a one-time code, and
  signs in by verifying it. WhatsApp is the delivery channel — it reaches a global audience without SMS
  carrier costs. WhatsApp is not an OAuth provider, so this can't be a redirect button like the others;
  it's a two-step (number → code) flow. Better Auth ships a `phoneNumber` plugin whose `sendOTP` callback
  is delivery-agnostic, which lets us keep WhatsApp behind the same port-and-adapter seam the mail
  transport already uses.
- **Decision:**
  - **Passwordless, create-on-verify.** The Better Auth `phoneNumber` plugin generates and checks the
    code; `signUpOnVerification` creates an account on first use (a placeholder `<digits>@whatsapp.local`
    email + the number as name, completable later). Verifying the code establishes the session — there is
    no phone password. The client calls `authClient.phoneNumber.sendOtp` then `.verify`
    (`@TheY2T/tmr-web-acl` adds the `phoneNumberClient` browser plugin).
  - **Delivery behind a capability port.** A `WhatsAppSender` port (ADR 0012) has two adapters:
    `CloudApiWhatsAppSender` (posts an approved AUTHENTICATION-category template with a copy-code button
    to the WhatsApp Business Cloud API) and `LogWhatsAppSender` (logs the code — dev/CI). A shared
    `createWhatsAppTransport` factory selects between them by whether a sender is configured
    (`WHATSAPP_ACCESS_TOKEN` + `WHATSAPP_PHONE_NUMBER_ID` + `WHATSAPP_OTP_TEMPLATE_NAME`), mirroring the
    mail transport. Better Auth is module-scoped (outside Nest DI), so `better-auth.ts` builds the
    transport from `process.env` directly, exactly as it does the mailer.
  - **Flag-gated UI, env-gated endpoints.** A new `auth.whatsapp` flag (default **off**, since it needs a
    provisioned sender) gates the "Continue with WhatsApp" button on the sign-in and sign-up forms via a
    `showWhatsapp` prop. The `phoneNumber` plugin registers when a real sender is configured **or** outside
    production, so local dev and CI can drive the flow through the log adapter while production only
    exposes the phone-number endpoints once a sender exists. The `/phone-number/send-otp` endpoint joins
    the tightened rate-limit rules.
  - **New UI shape.** WhatsApp doesn't fit the redirect-only `SocialSignInButtons` list, so it's a
    dedicated `WhatsAppSignIn` island (`@TheY2T/tmr-common-ui`) that steps number → code inline, reusing
    the `SocialButton` brand mark for its collapsed state. A WhatsApp brand mark joins the `SocialProvider`
    set in `@TheY2T/tmr-ui`.
  - **Schema.** The plugin's `phoneNumber` (unique) and `phoneNumberVerified` columns are hand-added to the
    `user` table in `auth-schema.ts`; drizzle-kit owns the migration (never `better-auth migrate`).
- **Consequences:**
  - Five env vars join `.env.example`: `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`,
    `WHATSAPP_OTP_TEMPLATE_NAME`, `WHATSAPP_TEMPLATE_LANG`, `WHATSAPP_GRAPH_VERSION`. Real delivery needs a
    WhatsApp Business number and a pre-approved authentication template (see the setup runbook).
  - Authentication-template messages deliver only to the user's **primary** WhatsApp device; linked
    devices show a masked prompt.
  - Because `auth.whatsapp` defaults off, the button doesn't appear in the hermetic E2E run; the flow is
    verified by enabling the flag (locally the log adapter prints the code).
  - Placeholder emails mean phone-only accounts start unverified for email purposes; prompting them to add
    a real email is a later enhancement.
- **Supersedes:** none. Extends ADR 0050 (social identity providers) and ADR 0052 (Microsoft sign-in);
  relies on ADR 0012 (port naming), ADR 0035 (DB-backed flags), and ADR 0049 (Render/Cloudflare hosting).
