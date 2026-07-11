/** Tracer — the tracing capability the core needs: open spans / read the current trace id. */
export interface Tracer {
  currentTraceId(): string | undefined;
  currentSpanId(): string | undefined;
  startActiveSpan<T>(name: string, fn: () => Promise<T> | T): Promise<T>;
  recordException(error: unknown): void;
}

export const TRACER = Symbol('Tracer');
