import { FlagKeys } from '@TheY2T/tmr-flags';
import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, Query } from '@nestjs/common';
import { RequireFlagsEnabled } from '@openfeature/nestjs-sdk';
import { CurrentUser } from '../auth/application/current-user';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import {
  DeleteTranslationUseCase,
  ListTranslationRevisionsUseCase,
  ListTranslationsUseCase,
  PublishTranslationsUseCase,
  RestoreTranslationUseCase,
  UpsertTranslationUseCase,
} from './application/entity-translation.use-cases';
import { PublishTranslationsDto, UpsertTranslationDto } from './dto/translations.dto';

/**
 * Admin content-translation CMS (ADR 0034, Phase 2). RBAC-gated (reuses the `content` resource) and
 * method-level flag-gated on `admin.locale-strings` (routes still map when off — ADR 0009).
 */
@Controller('admin/translations')
export class TranslationAuthoringController {
  constructor(
    private readonly currentUser: CurrentUser,
    private readonly listTranslations: ListTranslationsUseCase,
    private readonly upsertTranslation: UpsertTranslationUseCase,
    private readonly deleteTranslation: DeleteTranslationUseCase,
    private readonly restoreTranslation: RestoreTranslationUseCase,
    private readonly listRevisions: ListTranslationRevisionsUseCase,
    private readonly publishTranslations: PublishTranslationsUseCase,
  ) {}

  private editorId(): string | undefined {
    return this.currentUser.optional()?.id;
  }

  @Get()
  @RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.LocaleStrings }] })
  @RequirePermissions({ content: ['update'] })
  async list(
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('locale') locale?: string,
    @Query('includeDeleted') includeDeleted?: string,
  ) {
    const items = await this.listTranslations.execute({
      entityType,
      entityId,
      locale,
      includeDeleted: includeDeleted === 'true',
    });
    return { items };
  }

  @Put()
  @RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.LocaleStrings }] })
  @RequirePermissions({ content: ['update'] })
  upsert(@Body() body: UpsertTranslationDto) {
    return this.upsertTranslation.execute({ ...body, editedBy: this.editorId() });
  }

  @Delete(':id')
  @RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.LocaleStrings }] })
  @RequirePermissions({ content: ['delete'] })
  remove(@Param('id') id: string) {
    return this.deleteTranslation.execute(id, this.editorId());
  }

  @Post(':id/restore')
  @RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.LocaleStrings }] })
  @RequirePermissions({ content: ['update'] })
  restore(@Param('id') id: string) {
    return this.restoreTranslation.execute(id, this.editorId());
  }

  @Get(':id/revisions')
  @RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.LocaleStrings }] })
  @RequirePermissions({ content: ['update'] })
  async revisions(@Param('id') id: string) {
    return { items: await this.listRevisions.execute(id) };
  }

  @Post('publish')
  @HttpCode(200)
  @RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.LocaleStrings }] })
  @RequirePermissions({ content: ['publish'] })
  async publish(@Body() body: PublishTranslationsDto) {
    const published = await this.publishTranslations.execute(body.entityType, body.entityId);
    return { published };
  }
}
