/// <reference types="astro/client" />

// `App.Locals` mirrors the web app's shape (derived from @TheY2T/tmr-web-acl) so the shared UI packages
// receive the same prop types. The sandbox middleware fills these with dev-only defaults — flags all-on,
// no user — since the sandbox renders components in isolation rather than talking to the API.
declare namespace App {
  interface Locals {
    /** Feature-flag values — all forced on so every flag-gated component is reachable. */
    flags: import('@TheY2T/tmr-web-acl').Flags;
    /** Raw `flagKey → boolean` map (empty in the sandbox; the typed `flags` object is what components read). */
    flagSnapshot: Record<string, boolean>;
    /** Active locale resolved per request (URL prefix > cookie > default). */
    locale: import('@TheY2T/tmr-web-acl').Locale;
    /** Serialized i18n catalogue blob (empty; `t()` resolves from its bundled fallback). */
    i18nCatalogue: import('@TheY2T/tmr-web-acl').I18nCatalogue;
    /** Always null — the sandbox renders anonymous. */
    user: import('@TheY2T/tmr-web-acl').User;
  }
}

interface ImportMetaEnv {
  readonly PUBLIC_SITE_URL?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
