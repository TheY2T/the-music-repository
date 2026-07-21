/// <reference types="astro/client" />

// `App.Locals` is derived from the shared shell types in @TheY2T/tmr-web-acl so middleware, nav,
// and the smart UI packages stay in sync on one source of truth. Inline `import(...)` type refs keep
// this a global script (not a module), preserving the `declare namespace App` augmentation.
declare namespace App {
  interface Locals {
    /** Feature-flag values evaluated once per request in middleware (see src/middleware.ts). */
    flags: import('@TheY2T/tmr-web-acl').Flags;
    /** Raw `flagKey → boolean` map for this request — includes admin-created runtime keys not on `flags`. */
    flagSnapshot: Record<string, boolean>;
    /** Active locale resolved per request (URL prefix > cookie > Accept-Language > default). */
    locale: import('@TheY2T/tmr-web-acl').Locale;
    /** DB-backed UI-string catalogue for the active locale (serialized into the page by BaseLayout). */
    i18nCatalogue: import('@TheY2T/tmr-web-acl').I18nCatalogue;
    /** Authenticated user resolved per request from the API session, or null when anonymous. */
    user: import('@TheY2T/tmr-web-acl').User;
  }
}

interface ImportMetaEnv {
  readonly PUBLIC_API_BASE_URL?: string;
  readonly PUBLIC_OFREP_BASE_URL?: string;
  /** Cloudflare Turnstile site key for the contact form (baked at build; unset ⇒ no challenge). */
  readonly PUBLIC_TURNSTILE_SITE_KEY?: string;
  /** Feature-flag environment this deployment resolves against (dev | uat | prod | …). */
  readonly APP_ENV?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
