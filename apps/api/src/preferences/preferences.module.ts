import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UserPreferences } from './application/ports/user-preferences.port';
import { GetPreferencesUseCase } from './application/use-cases/get-preferences.use-case';
import { UpdatePreferencesUseCase } from './application/use-cases/update-preferences.use-case';
import { DrizzleUserPreferences } from './infrastructure/drizzle-user-preferences.repository';
import { PreferencesController } from './preferences.controller';

/**
 * Instrument-preferences feature (hexagonal). Imports AuthModule for the `CurrentUser` port. Binds the
 * `UserPreferences` port to its Drizzle adapter.
 */
@Module({
  imports: [AuthModule],
  controllers: [PreferencesController],
  providers: [
    GetPreferencesUseCase,
    UpdatePreferencesUseCase,
    { provide: UserPreferences, useClass: DrizzleUserPreferences },
  ],
})
export class PreferencesModule {}
