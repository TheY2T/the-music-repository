import { Module } from '@nestjs/common';
import { TranslationsModule } from '../translations/translations.module';
import {
  CreateFaqEntryUseCase,
  DeleteFaqEntryUseCase,
  GetFaqEntryUseCase,
  ListFaqEntriesUseCase,
  UpdateFaqEntryUseCase,
} from './application/faq-entry.use-cases';
import { FaqEntryRepository } from './application/ports/faq-entry-repository.port';
import { FaqController } from './faq.controller';
import { FaqAuthoringController } from './faq-authoring.controller';
import { DrizzleFaqEntryRepository } from './infrastructure/drizzle-faq-entry.repository';

/** FAQ feature (hexagonal). */
@Module({
  imports: [TranslationsModule],
  controllers: [FaqController, FaqAuthoringController],
  providers: [
    ListFaqEntriesUseCase,
    GetFaqEntryUseCase,
    CreateFaqEntryUseCase,
    UpdateFaqEntryUseCase,
    DeleteFaqEntryUseCase,
    { provide: FaqEntryRepository, useClass: DrizzleFaqEntryRepository },
  ],
})
export class FaqModule {}
