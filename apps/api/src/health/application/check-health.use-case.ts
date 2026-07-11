import type { HealthStatus } from '@TheY2T/tmr-contracts';
import { Injectable } from '@nestjs/common';
import { DatastoreHealthCheck } from './ports/datastore-health-check.port';

/** Application use-case: assemble the service health snapshot. */
@Injectable()
export class CheckHealthUseCase {
  private readonly startedAt = Date.now();

  constructor(private readonly datastore: DatastoreHealthCheck) {}

  async execute(): Promise<HealthStatus> {
    const databaseUp = await this.datastore.ping();
    return {
      status: databaseUp ? 'ok' : 'degraded',
      service: 'tmr-api',
      version: process.env.npm_package_version ?? '0.0.0',
      uptimeSeconds: Math.floor((Date.now() - this.startedAt) / 1000),
      checks: { database: databaseUp ? 'up' : 'down' },
    };
  }
}
