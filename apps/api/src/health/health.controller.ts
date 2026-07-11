import type { HealthStatus } from '@TheY2T/tmr-contracts';
import { Controller, Get } from '@nestjs/common';
import { CheckHealthUseCase } from './application/check-health.use-case';

@Controller('health')
export class HealthController {
  constructor(private readonly checkHealth: CheckHealthUseCase) {}

  @Get()
  get(): Promise<HealthStatus> {
    return this.checkHealth.execute();
  }
}
