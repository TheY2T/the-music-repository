import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import {
  DeleteTranslationUseCase,
  ListTranslationRevisionsUseCase,
  ListTranslationsUseCase,
  PublishTranslationsUseCase,
  RestoreTranslationUseCase,
  UpsertTranslationUseCase,
} from './application/entity-translation.use-cases';
import { ContentTranslations } from './application/ports/content-translations.port';
import { EntityTranslationAuthoring } from './application/ports/entity-translation-authoring.port';
import { DrizzleContentTranslations } from './infrastructure/drizzle-content-translations.adapter';
import { DrizzleEntityTranslationAuthoring } from './infrastructure/drizzle-entity-translation-authoring.adapter';
import { TranslationAuthoringController } from './translation-authoring.controller';

/**
 * Content translations feature (ADR 0034, Phase 2, hexagonal). Provides the read-side `ContentTranslations`
 * overlay port (exported so read modules like `CatalogueModule` can inject it) plus the admin write side.
 * Imports AuthModule for `CurrentUser`.
 */
@Module({
  imports: [AuthModule],
  controllers: [TranslationAuthoringController],
  providers: [
    ListTranslationsUseCase,
    UpsertTranslationUseCase,
    DeleteTranslationUseCase,
    RestoreTranslationUseCase,
    ListTranslationRevisionsUseCase,
    PublishTranslationsUseCase,
    { provide: ContentTranslations, useClass: DrizzleContentTranslations },
    { provide: EntityTranslationAuthoring, useClass: DrizzleEntityTranslationAuthoring },
  ],
  exports: [ContentTranslations],
})
export class TranslationsModule {}
