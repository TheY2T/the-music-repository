/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    /** Feature-flag values evaluated once per request in middleware (see src/middleware.ts). */
    flags: {
      demoNewBanner: boolean;
    };
  }
}

interface ImportMetaEnv {
  readonly PUBLIC_API_BASE_URL?: string;
  readonly PUBLIC_OFREP_BASE_URL?: string;
  readonly FLAGD_HOST?: string;
  readonly FLAGD_PORT?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
