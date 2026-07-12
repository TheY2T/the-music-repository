import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProgressionLibrary } from './application/ports/progression-library.port';
import { DeleteProgressionUseCase } from './application/use-cases/delete-progression.use-case';
import { ListProgressionsUseCase } from './application/use-cases/list-progressions.use-case';
import { SaveProgressionUseCase } from './application/use-cases/save-progression.use-case';
import { DrizzleProgressionLibrary } from './infrastructure/drizzle-progression-library';
import { ProgressionsController } from './progressions.controller';

/**
 * Saved-progressions feature (hexagonal). Imports AuthModule for the `CurrentUser` port. Binds the
 * `ProgressionLibrary` port to its Drizzle adapter.
 */
@Module({
  imports: [AuthModule],
  controllers: [ProgressionsController],
  providers: [
    ListProgressionsUseCase,
    SaveProgressionUseCase,
    DeleteProgressionUseCase,
    { provide: ProgressionLibrary, useClass: DrizzleProgressionLibrary },
  ],
})
export class ProgressionsModule {}
