import { Module } from '@nestjs/common';
import { TranslationsModule } from '../translations/translations.module';
import {
  CreateHelpTopicUseCase,
  DeleteHelpTopicUseCase,
  GetHelpTopicUseCase,
  ListHelpTopicsUseCase,
  UpdateHelpTopicUseCase,
} from './application/help-topic.use-cases';
import { HelpTopicRepository } from './application/ports/help-topic-repository.port';
import { HelpController } from './help.controller';
import { HelpAuthoringController } from './help-authoring.controller';
import { DrizzleHelpTopicRepository } from './infrastructure/drizzle-help-topic.repository';

/** Info View / help-topics feature (hexagonal). */
@Module({
  imports: [TranslationsModule],
  controllers: [HelpController, HelpAuthoringController],
  providers: [
    ListHelpTopicsUseCase,
    GetHelpTopicUseCase,
    CreateHelpTopicUseCase,
    UpdateHelpTopicUseCase,
    DeleteHelpTopicUseCase,
    { provide: HelpTopicRepository, useClass: DrizzleHelpTopicRepository },
  ],
})
export class HelpModule {}
