import { Module } from '@nestjs/common';
import { CheckHealthUseCase } from './application/check-health.use-case';
import { DatastoreHealthCheck } from './application/ports/datastore-health-check.port';
import { HealthController } from './health.controller';
import { DrizzleDatastoreHealthCheck } from './infrastructure/drizzle-datastore-health-check.adapter';

/** Wires the datastore-health-check capability to its Drizzle adapter. */
@Module({
  controllers: [HealthController],
  providers: [
    CheckHealthUseCase,
    { provide: DatastoreHealthCheck, useClass: DrizzleDatastoreHealthCheck },
  ],
})
export class HealthModule {}
