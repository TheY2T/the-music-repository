interface ImportMetaEnv {
  readonly PUBLIC_API_BASE_URL?: string;
  readonly PUBLIC_OFREP_BASE_URL?: string;
  readonly FLAGD_HOST?: string;
  readonly FLAGD_PORT?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
