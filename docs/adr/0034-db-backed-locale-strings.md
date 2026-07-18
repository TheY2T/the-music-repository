# ADR 0034 — DB-backed UI locale strings, managed via the admin CMS

- **Status:** accepted
- **Date:** 2026-07
- **Amends:** ADR 0017 (the *storage* half). ADR 0017's routing decisions — URL-prefix `/zh` routing, the
  single page-file rewrite, `zh-Hans` id, locale-as-a-plain-prop, the `platform.i18n` gate — are
  **unchanged** and still authoritative.
- **Context:** Under ADR 0017 every UI string lived in build-time JSON catalogues
  (`@TheY2T/tmr-i18n-locales`) that are statically imported and bundled. Any wording fix or new
  translation therefore required a code change **and a redeploy**. We want editors/admins to change UI
  copy and translations **at runtime, with no redeploy**, from the existing admin CMS.

## Decision

1. **The database is the runtime source of truth for UI strings.** A `ui_messages` table holds one row
   per `(locale, key)` with a `draft_value` / `published_value` pair. Only **published, non-deleted**
   rows are assembled into the served catalogue.
2. **The in-repo JSON is demoted to three jobs:** (a) the **DB seed baseline** — a fresh deploy always
   boots with a full published catalogue (`seed-i18n.ts`, idempotent, never clobbers admin edits);
   (b) the **compile-time `MessageKey` type source** (`type MessageKey = keyof typeof en`), so typed
   `t()` call sites stay checked; (c) the **last-resort bundled fallback** when the runtime catalogue is
   empty (cold boot) or the API is briefly unreachable — so `t()` never renders blank.
3. **The engine resolves `t()` against a mutable module-level registry** (`packages/i18n`). A
   `loadCatalogue(locale, messages, version)` setter swaps the whole per-locale reference atomically;
   `t()` reads it synchronously with the fallback chain *runtime-locale → runtime-default → bundled → key*.
   This keeps the synchronous `t(locale, key)` signature and **every existing call site unchanged**.
4. **The registry is populated twice, once per world:** server-side in `apps/web` middleware (before SSR)
   from the API, and client-side by a `<head>` bootstrap (`hydrateCatalogueFromDom`) that reads a
   serialized `<script id="i18n-catalogue">` blob **before any island hydrates** — so browser `t()`
   resolves from the same strings the server rendered (no flash / no mismatch).
5. **Draft → publish + revisions.** Edits save to `draft_value` (status `draft`); an explicit **publish**
   copies draft→published, bumps the locale's version, and is recorded. `ui_message_revisions` logs every
   create/update/delete/restore for diff + restore (mirrors `content_revisions`, ADR 0030).
6. **Soft delete.** Deletes set `deleted_at` (restorable); the admin UI lists deleted rows behind a facet
   with a **Restore** action, and gates deletion behind a **type-the-key-to-confirm** dialog.
7. **`seeded` boolean origin flag.** `true` = a pristine seeded baseline row; set `false` on any runtime
   add/edit — so admins can see which strings diverge from the shipped baseline.
8. **Near-instant propagation via a per-locale version tag** (`i18n_versions`, epoch-ms of last publish).
   It is the HTTP **ETag** on `GET /i18n/catalogue/{locale}` and the web layer's cache-bust signal: the
   web process caches each locale's catalogue in memory and cheaply revalidates against `GET /i18n/version`
   (short TTL), only re-downloading when the version changed. No full-catalogue DB scan on the hot path.
9. **API is a new hexagonal feature** (`apps/api/src/i18n/`, spec-first): public read
   (`/i18n/version`, `/i18n/catalogue/{locale}`) + RBAC-gated admin write (`/admin/i18n/*`), gated by the
   new `admin.locale-strings` flag.

## Consequences

- Wording and translations for existing keys, and brand-new **runtime-only** keys, ship with **no
  redeploy** — an admin edits + publishes and the change is live within seconds.
- Compile-time key safety and the "never render blank" guarantee are preserved (the bundled JSON stays as
  type source + fallback + seed).
- **Trade-off:** adding a brand-new key that *typed code* references still needs a one-time code edit +
  deploy (to widen `MessageKey` and seed it); thereafter its wording is CMS-editable. This is the
  deliberate price of keeping compile-time key checking.
- The API now owns a localization responsibility it previously had none of (documented in
  `apps/api/CLAUDE.md`).
- The bundled catalogue is double-carried (as fallback + in the SSR blob) — a later optimization can drop
  the client-side bundled fallback once DB delivery is proven.

## Alternatives considered

- **DB-only with a codegen'd `MessageKey`:** keeps type safety but couples every build to DB state and
  still needs a redeploy to type a new key. Rejected — more coupling for no runtime gain.
- **DB-only with pure runtime keys (no bundled JSON):** simplest storage, but loses compile-time key
  checking and shows raw keys on an empty/unreachable DB. Rejected.
- **Keep JSON as an overlay base with the DB as an override layer:** the DB never fully owns a string.
  Rejected in favour of the DB being the unambiguous runtime source of truth (JSON only seeds it).
