import { Module } from '@nestjs/common';
import { CheckHealthUseCase } from './application/check-health.use-case';
import { DatabaseHealthPort } from './application/ports/database-health.port';
import { HealthController } from './health.controller';
import { DrizzleDatabaseHealthAdapter } from './infrastructure/drizzle-database-health.adapter';

/** Wires the port to its adapter — swap the adapter here to change persistence. */
@Module({
  controllers: [HealthController],
  providers: [
    CheckHealthUseCase,
    { provide: DatabaseHealthPort, useClass: DrizzleDatabaseHealthAdapter },
  ],
})
export class HealthModule {}
