// Types for the shared Vitest presets. Structural (no `vitest` dependency) — the returned
// `{ test }` objects merge cleanly into a consumer's `defineConfig`/`mergeConfig`.

/** Shared coverage config (v8 provider). */
export declare const coverage: Record<string, unknown>;

/** Node preset — api use-cases/domain + tsc/tsup packages. */
export declare function nodePreset(overrides?: Record<string, unknown>): {
  test: Record<string, unknown>;
};

/** React/DOM preset — web islands + @TheY2T/tmr-ui (happy-dom). */
export declare function reactPreset(opts?: { setupFiles?: string[]; [key: string]: unknown }): {
  test: Record<string, unknown>;
};
