import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import type { LoggerPort } from '../ports/logger.port';

/**
 * LoggerPort implementation over Pino. `trace_id`/`span_id` are injected automatically by
 * `@opentelemetry/instrumentation-pino` when a span is active, so they aren't set here.
 */
@Injectable()
export class PinoLoggerAdapter implements LoggerPort {
  constructor(private readonly logger: PinoLogger) {}

  info(message: string, meta: Record<string, unknown> = {}): void {
    this.logger.info(meta, message);
  }

  warn(message: string, meta: Record<string, unknown> = {}): void {
    this.logger.warn(meta, message);
  }

  error(message: string, error?: unknown, meta: Record<string, unknown> = {}): void {
    this.logger.error({ ...meta, err: error }, message);
  }

  debug(message: string, meta: Record<string, unknown> = {}): void {
    this.logger.debug(meta, message);
  }
}
