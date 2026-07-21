# Feature: Contact form

- **ADR:** [0049](../adr/0049-hosting-render-cloudflare-resend.md) · **Status:** shipped
- Always-on (no flag). A public form that emails a message to the site operators.

## Flow

`/contact` (`ContactForm` island, `@TheY2T/tmr-common-ui`) → `POST /contact` → `SubmitContactUseCase` →
`MailSender.send()`. The email is delivered to `CONTACT_RECIPIENT` (default
`michael.hewett.87@gmail.com`) from `MAIL_FROM` (`contact@themusicrepository.com` in production, via
Resend/SMTP), with the sender's address as the **reply-to** so a reply reaches them directly.

## API (spec-first)

`POST /contact` (`ContactMessageInput` → `ContactMessageResult`), declared in
`packages/api-spec/main.tsp`. Hexagonal `apps/api/src/contact/`: `ContactController` → `SubmitContactUseCase`
→ `MailSender` (from `MailModule`). Public (no auth).

- **Anti-spam:** a hidden **honeypot** field (`company`). A filled value returns `{ ok: true }` without
  sending — bots get the same response as humans.

## Web

`apps/web/src/pages/contact.astro` mounts `ContactForm` (`client:load`), which posts through the
`web-acl` wrapper `submitContact` (`@TheY2T/tmr-web-acl/contact-api`). i18n-by-prop (`contact.*` keys in
`@TheY2T/tmr-i18n-locales`), `Icon` atom (`mail`), semantic tokens, SEO title/description on `BaseLayout`.
Linked from the footer legal nav (`buildLegalNav`).

## Tests

- Unit: `SubmitContactUseCase` (mock `MailSender`) — reply-to + honeypot drop.
- Component: `ContactForm` — required-field guard + successful submit.
