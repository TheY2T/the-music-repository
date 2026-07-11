/** Tracing port. Lets the application open spans / read the current trace id without importing OTEL. */
export interface TracerPort {
  currentTraceId(): string | undefined;
  currentSpanId(): string | undefined;
  startActiveSpan<T>(name: string, fn: () => Promise<T> | T): Promise<T>;
  recordException(error: unknown): void;
}

export const TRACER = Symbol('TracerPort');
