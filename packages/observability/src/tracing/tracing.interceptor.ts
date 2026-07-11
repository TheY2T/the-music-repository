import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import { SpanStatusCode, trace } from '@opentelemetry/api';
import { catchError, type Observable, throwError } from 'rxjs';

/**
 * Marks the active span as errored (record-once for spans). The ProblemDetails filter owns the
 * single error *log*; this interceptor owns the single span error *mark* — they don't overlap.
 */
@Injectable()
export class TracingInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      catchError((error: unknown) => {
        const span = trace.getActiveSpan();
        if (span && error instanceof Error) {
          span.recordException(error);
          span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
          const code = (error as { code?: string }).code;
          span.setAttribute('error.type', code ?? error.name);
        }
        return throwError(() => error);
      }),
    );
  }
}
