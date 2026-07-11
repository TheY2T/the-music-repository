import {
  CATEGORY_TO_STATUS,
  codeToDocUrl,
  codeToTypeUri,
  DomainError,
  type ProblemDetails,
  type ProblemFieldError,
  titleFromCode,
} from '@TheY2T/tmr-errors';
import { type AppLogger, LOGGER } from '@TheY2T/tmr-observability';
import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  Inject,
} from '@nestjs/common';
import { trace } from '@opentelemetry/api';
import { ZodValidationException } from 'nestjs-zod';
import { ZodError } from 'zod';

interface ResponseLike {
  status(code: number): ResponseLike;
  type(contentType: string): ResponseLike;
  send(body: unknown): unknown;
}
interface RequestLike {
  url?: string;
}
/** Structural shape of a Zod error — robust to zod-version drift between us and nestjs-zod. */
interface ZodErrorLike {
  issues: Array<{ path: PropertyKey[]; code: unknown; message: string }>;
}

/**
 * The anti-corruption boundary: maps DomainError / ZodError / HttpException / unknown → RFC 9457
 * problem+json, attaches the active-span traceId, and is the single error *log* site.
 */
@Catch()
export class ProblemDetailsExceptionFilter implements ExceptionFilter {
  constructor(@Inject(LOGGER) private readonly logger: AppLogger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const response = http.getResponse<ResponseLike>();
    const request = http.getRequest<RequestLike>();
    const traceId = trace.getActiveSpan()?.spanContext().traceId;

    const problem = this.toProblem(exception, request.url, traceId);

    if (problem.status >= 500) {
      this.logger.error('request_failed', exception, {
        code: problem.code,
        path: request.url,
        traceId,
      });
    } else {
      this.logger.warn('request_error', {
        code: problem.code,
        status: problem.status,
        path: request.url,
        traceId,
      });
    }

    response.status(problem.status).type('application/problem+json').send(problem);
  }

  private toProblem(exception: unknown, instance?: string, traceId?: string): ProblemDetails {
    if (exception instanceof DomainError) {
      const status = CATEGORY_TO_STATUS[exception.category];
      return this.build({
        code: exception.code,
        status,
        detail: exception.message,
        instance,
        traceId,
        // Never leak metadata on 5xx.
        extra: status < 500 ? exception.metadata : undefined,
      });
    }
    if (exception instanceof ZodValidationException) {
      return this.fromZod(exception.getZodError() as unknown as ZodErrorLike, instance, traceId);
    }
    if (exception instanceof ZodError) {
      return this.fromZod(exception as unknown as ZodErrorLike, instance, traceId);
    }
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();
      const detail =
        typeof payload === 'string'
          ? payload
          : ((payload as { message?: unknown }).message?.toString() ?? exception.message);
      return this.build({ code: httpStatusToCode(status), status, detail, instance, traceId });
    }
    return this.build({
      code: 'INTERNAL_ERROR',
      status: 500,
      detail: 'An unexpected error occurred.',
      instance,
      traceId,
    });
  }

  private fromZod(error: ZodErrorLike, instance?: string, traceId?: string): ProblemDetails {
    const errors: ProblemFieldError[] = error.issues.map((issue) => ({
      pointer: `#/${issue.path.map(String).join('/')}`,
      code: String(issue.code).toUpperCase(),
      detail: issue.message,
    }));
    return {
      ...this.build({
        code: 'VALIDATION_FAILED',
        status: 422,
        detail: 'One or more fields are invalid.',
        instance,
        traceId,
      }),
      errors,
    };
  }

  private build(input: {
    code: string;
    status: number;
    detail?: string;
    instance?: string;
    traceId?: string;
    extra?: Record<string, unknown>;
  }): ProblemDetails {
    return {
      type: codeToTypeUri(input.code),
      title: titleFromCode(input.code),
      status: input.status,
      detail: input.detail,
      instance: input.instance,
      code: input.code,
      traceId: input.traceId,
      docUrl: codeToDocUrl(input.code),
      ...(input.extra ?? {}),
    };
  }
}

function httpStatusToCode(status: number): string {
  switch (status) {
    case 400:
      return 'MALFORMED_REQUEST';
    case 401:
      return 'UNAUTHENTICATED';
    case 403:
      return 'PERMISSION_DENIED';
    case 404:
      return 'NOT_FOUND';
    case 409:
      return 'CONFLICT';
    case 429:
      return 'RATE_LIMITED';
    default:
      return status >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR';
  }
}
