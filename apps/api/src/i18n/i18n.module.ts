import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { LocaleRegistry } from './application/ports/locale-registry.port';
import { UiMessageAuthoring } from './application/ports/ui-message-authoring.port';
import { UiMessageCatalogue } from './application/ports/ui-message-catalogue.port';
import {
  CreateLocaleUseCase,
  CreateUiMessageUseCase,
  DeleteUiMessageUseCase,
  GetLocaleCatalogueUseCase,
  GetLocalesUseCase,
  GetLocaleVersionsUseCase,
  ImportUiMessagesUseCase,
  ListUiMessageRevisionsUseCase,
  ListUiMessagesUseCase,
  PublishUiMessagesUseCase,
  RestoreUiMessageRevisionUseCase,
  RestoreUiMessageUseCase,
  UpdateUiMessageUseCase,
} from './application/ui-message.use-cases';
import { I18nController } from './i18n.controller';
import { I18nAuthoringController } from './i18n-authoring.controller';
import { DrizzleLocaleRegistry } from './infrastructure/drizzle-locale-registry.adapter';
import { DrizzleUiMessageAuthoring } from './infrastructure/drizzle-ui-message-authoring.adapter';
import { DrizzleUiMessageCatalogue } from './infrastructure/drizzle-ui-message-catalogue.adapter';

/**
 * Localization feature (ADR 0034, hexagonal). Serves the DB-backed UI-string catalogue publicly and the
 * admin CMS write side. Imports AuthModule for `CurrentUser` (records who edited each string).
 */
@Module({
  imports: [AuthModule],
  controllers: [I18nController, I18nAuthoringController],
  providers: [
    GetLocaleCatalogueUseCase,
    GetLocaleVersionsUseCase,
    ListUiMessagesUseCase,
    CreateUiMessageUseCase,
    UpdateUiMessageUseCase,
    DeleteUiMessageUseCase,
    RestoreUiMessageUseCase,
    ListUiMessageRevisionsUseCase,
    RestoreUiMessageRevisionUseCase,
    PublishUiMessagesUseCase,
    GetLocalesUseCase,
    CreateLocaleUseCase,
    ImportUiMessagesUseCase,
    { provide: UiMessageCatalogue, useClass: DrizzleUiMessageCatalogue },
    { provide: UiMessageAuthoring, useClass: DrizzleUiMessageAuthoring },
    { provide: LocaleRegistry, useClass: DrizzleLocaleRegistry },
  ],
})
export class I18nModule {}
