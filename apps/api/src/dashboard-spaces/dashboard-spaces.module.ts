import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DashboardSpaces } from './application/ports/dashboard-spaces.port';
import { GetDashboardSpacesUseCase } from './application/use-cases/get-dashboard-spaces.use-case';
import { UpdateDashboardSpacesUseCase } from './application/use-cases/update-dashboard-spaces.use-case';
import { DashboardSpacesController } from './dashboard-spaces.controller';
import { DrizzleDashboardSpaces } from './infrastructure/drizzle-dashboard-spaces.repository';

/**
 * Dashboard-spaces feature (hexagonal). Imports AuthModule for the `CurrentUser` port. Binds the
 * `DashboardSpaces` port to its Drizzle adapter.
 */
@Module({
  imports: [AuthModule],
  controllers: [DashboardSpacesController],
  providers: [
    GetDashboardSpacesUseCase,
    UpdateDashboardSpacesUseCase,
    { provide: DashboardSpaces, useClass: DrizzleDashboardSpaces },
  ],
})
export class DashboardSpacesModule {}
