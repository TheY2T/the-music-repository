/** Per-request context (correlation id, user, tenant) backed by AsyncLocalStorage. */
export interface RequestContextPort {
  get<T = unknown>(key: string): T | undefined;
  set(key: string, value: unknown): void;
  requestId(): string | undefined;
}

export const REQUEST_CONTEXT = Symbol('RequestContextPort');
