# Runbook: Set up WhatsApp phone-OTP sign-in

A step-by-step, replayable record of standing up **WhatsApp sign-in** for The Music Repository — the
passwordless flow where a learner enters a phone number, receives a one-time code over WhatsApp, and
verifies it to sign in. The design rationale lives in [`docs/features/auth.md`](../features/auth.md) and
[ADR 0053](../adr/0053-whatsapp-phone-otp-sign-in.md); this is the *procedure* plus the Meta-side gotchas.

> **Read the [Gotchas](#gotchas--lessons-learned) section first.** The blockers are almost all on the
> Meta/WhatsApp side (Business verification, template approval, primary-device delivery), not in the code.

## What you get

- A **"Continue with WhatsApp"** button on `/signin` + `/signup`, behind flag `auth.whatsapp`
  (**default off**). Selecting it steps: enter number → enter the code sent on WhatsApp → signed in.
- First-time numbers get an account created on verify (a placeholder `<digits>@whatsapp.local` email).

The `phoneNumber` endpoints register when a sender is configured (or outside production), and the button
only *works* once the flag is on **and** a WhatsApp Business sender + approved template exist. Locally the
code is written to the API log (no delivery), so you can exercise the whole flow with no Meta account.

## Prerequisites

- A **Meta (Facebook) Business** account, verified.
- A **WhatsApp Business Platform** app in the [Meta for Developers](https://developers.facebook.com)
  console, with the **WhatsApp** product added.
- A **sender phone number** registered to the WhatsApp Business Account (WABA). The test number Meta
  provides works for development; a real number requires Business verification.

## Steps

1. **Create the app + WABA.** In Meta for Developers, create a Business-type app, add **WhatsApp**, and
   note the **Phone number ID** (the sender) and the **WhatsApp Business Account ID**.
2. **Create a system-user access token.** In Business Settings → Users → System users, create a system
   user with access to the WABA and generate a token with the `whatsapp_business_messaging` +
   `whatsapp_business_management` permissions. A long-lived/permanent token avoids expiry in production.
3. **Create an authentication template.** In the WhatsApp Manager → Message templates, create a template
   with **Category: Authentication** and a **Copy code** button. Note its **name** (e.g. `otp_code`) and
   **language** (e.g. `en` or `en_US`). Submit it and wait for approval — the code sends nothing until the
   template is approved.
4. **Set the env vars** (locally in `.env`, per environment in Render's `dev` group):

   ```bash
   WHATSAPP_ACCESS_TOKEN=<system-user token>
   WHATSAPP_PHONE_NUMBER_ID=<sender phone number id>
   WHATSAPP_OTP_TEMPLATE_NAME=otp_code
   WHATSAPP_TEMPLATE_LANG=en            # must match the template's approved language exactly
   WHATSAPP_GRAPH_VERSION=v21.0         # optional; the Graph API version segment
   ```

   Leave all unset to keep the log adapter (dev/CI). All three of TOKEN + PHONE_NUMBER_ID +
   TEMPLATE_NAME must be present for real delivery.
5. **Enable the flag.** Turn `auth.whatsapp` on for the target environment in
   `/admin/feature-flags`. (It seeds off on `db:seed`.)
6. **Verify.** On `/signin`, click **Continue with WhatsApp**, enter a number in E.164 form
   (e.g. `+61400000000`), receive the code on WhatsApp's **primary** device, enter it, and land signed-in.

## Local development (no Meta account)

Leave the `WHATSAPP_*` vars unset and turn `auth.whatsapp` on for `local`. The `LogWhatsAppSender` prints
the code to the API log:

```
[dev-whatsapp] to=+61400000000 · code=123456
```

Read it from the log and enter it in the form to complete sign-in end-to-end.

## Gotchas & lessons learned

- **Template must be approved and category = AUTHENTICATION.** A marketing/utility template, or an
  unapproved one, is rejected by the send API. The `WHATSAPP_TEMPLATE_LANG` must match the approved
  language code exactly (`en` and `en_US` are different).
- **Delivery is primary-device only.** Authentication-template messages reach only the user's primary
  WhatsApp device; linked devices (WhatsApp Web / desktop) show a masked prompt telling them to open their
  phone. This is a WhatsApp platform rule, not a bug.
- **E.164 numbers.** The number must include the country code (`+61…`). The plugin stores it as the login
  identifier, so inconsistent formatting creates duplicate accounts.
- **Rate limits.** `/phone-number/send-otp` is capped at 5/60s per IP (`AUTH_RATE_LIMIT_ENABLED`), on top
  of Meta's own per-number send limits — don't hammer it while testing.
- **Test number caveats.** Meta's provided test sender can only message pre-registered recipient numbers;
  add your own number to the allowlist in the console before testing.
