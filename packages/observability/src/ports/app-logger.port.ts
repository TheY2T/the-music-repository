/**
 * AppLogger — the application's structured-logging capability (named for what the core needs,
 * not the technology). Adapters (e.g. Pino) implement it; the core logs through this.
 */
export interface AppLogger {
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, error?: unknown, meta?: Record<string, unknown>): void;
  debug(message: string, meta?: Record<string, unknown>): void;
}

export const LOGGER = Symbol('AppLogger');
