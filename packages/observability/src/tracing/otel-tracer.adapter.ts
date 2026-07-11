import { Injectable } from '@nestjs/common';
import { SpanStatusCode, trace } from '@opentelemetry/api';
import type { Tracer } from '../ports/tracer.port';

@Injectable()
export class OtelTracer implements Tracer {
  private readonly tracer = trace.getTracer('tmr');

  currentTraceId(): string | undefined {
    return trace.getActiveSpan()?.spanContext().traceId;
  }

  currentSpanId(): string | undefined {
    return trace.getActiveSpan()?.spanContext().spanId;
  }

  startActiveSpan<T>(name: string, fn: () => Promise<T> | T): Promise<T> {
    return this.tracer.startActiveSpan(name, async (span) => {
      try {
        return await fn();
      } catch (error) {
        span.recordException(error as Error);
        span.setStatus({ code: SpanStatusCode.ERROR });
        throw error;
      } finally {
        span.end();
      }
    });
  }

  recordException(error: unknown): void {
    const span = trace.getActiveSpan();
    span?.recordException(error as Error);
    span?.setStatus({ code: SpanStatusCode.ERROR });
  }
}
