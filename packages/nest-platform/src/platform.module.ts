import { ObservabilityModule, TracingInterceptor } from '@TheY2T/tmr-observability';
import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import { ProblemDetailsExceptionFilter } from './problem-details.filter';

/**
 * One import to give every API service identical cross-cutting behaviour:
 * request context + structured logging + tracing (ObservabilityModule), a global
 * Zod validation pipe, the tracing interceptor (span error-marking), and the
 * RFC 9457 Problem Details exception filter (the single error envelope + log site).
 */
@Module({
  imports: [ObservabilityModule],
  providers: [
    { provide: APP_PIPE, useClass: ZodValidationPipe },
    { provide: APP_INTERCEPTOR, useClass: TracingInterceptor },
    { provide: APP_FILTER, useClass: ProblemDetailsExceptionFilter },
  ],
  exports: [ObservabilityModule],
})
export class PlatformModule {}
