/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    /** Feature-flag values evaluated once per request in middleware (see src/middleware.ts). */
    flags: {
      demoNewBanner: boolean;
      authEnabled: boolean;
      adminCms: boolean;
      favorites: boolean;
      collections: boolean;
      progress: boolean;
      infoView: boolean;
      toolKeyboard: boolean;
      toolCircleOfFifths: boolean;
      toolFretboard: boolean;
      toolChords: boolean;
    };
    /** Authenticated user resolved per request from the API session, or null when anonymous. */
    user: {
      id: string;
      email: string;
      name: string;
      role: string | null;
    } | null;
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
