import { randomUUID } from 'node:crypto';
import { Module } from '@nestjs/common';
import { ClsModule } from 'nestjs-cls';
import { LoggerModule } from 'nestjs-pino';
import { ClsContextAdapter } from './context/als-context.adapter';
import { PinoLoggerAdapter } from './logging/pino-logger.adapter';
import { LOGGER } from './ports/logger.port';
import { REQUEST_CONTEXT } from './ports/request-context.port';
import { TRACER } from './ports/tracer.port';
import { OtelTracerAdapter } from './tracing/otel-tracer.adapter';

const isProd = process.env.NODE_ENV === 'production';

/**
 * Log transport targets: pretty console in dev, plus an OTLP exporter (→ Collector → Loki) whenever
 * an OTLP endpoint is configured, so logs correlate with traces in Grafana by `trace_id`.
 */
function buildLogTransport() {
  const targets: Array<{ target: string; options?: Record<string, unknown> }> = [];
  if (!isProd) {
    targets.push({ target: 'pino-pretty', options: { singleLine: true } });
  }
  if (process.env.OTEL_EXPORTER_OTLP_LOGS_ENDPOINT || process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
    targets.push({
      target: 'pino-opentelemetry-transport',
      options: {
        resourceAttributes: { 'service.name': process.env.OTEL_SERVICE_NAME ?? 'tmr-api' },
      },
    });
  }
  return targets.length > 0 ? { targets } : undefined;
}

/**
 * Provides logging (Pino), tracing (OTEL), and request context (ALS via nestjs-cls) behind ports.
 * ClsModule's middleware seeds the per-request correlation id; the OTEL SDK must already be running
 * (preloaded via `--require`) so pino auto-injects `trace_id`/`span_id`.
 */
@Module({
  imports: [
    ClsModule.forRoot({
      middleware: {
        mount: true,
        generateId: true,
        idGenerator: (req: { headers: Record<string, unknown> }) =>
          (req.headers['x-request-id'] as string | undefined) ?? randomUUID(),
        setup: (cls) => {
          cls.set('requestId', cls.getId());
        },
      },
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? (isProd ? 'info' : 'debug'),
        redact: {
          paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'req.headers["set-cookie"]',
            '*.password',
            '*.token',
          ],
          censor: '[REDACTED]',
        },
        autoLogging: {
          ignore: (req: { url?: string }) =>
            ['/health', '/metrics'].includes((req.url ?? '').split('?')[0] ?? ''),
        },
        transport: buildLogTransport(),
      },
    }),
  ],
  providers: [
    { provide: LOGGER, useClass: PinoLoggerAdapter },
    { provide: TRACER, useClass: OtelTracerAdapter },
    { provide: REQUEST_CONTEXT, useClass: ClsContextAdapter },
  ],
  exports: [LOGGER, TRACER, REQUEST_CONTEXT, LoggerModule, ClsModule],
})
export class ObservabilityModule {}
