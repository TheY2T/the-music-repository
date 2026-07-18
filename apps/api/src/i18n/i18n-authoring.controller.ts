import { FlagKeys } from '@TheY2T/tmr-flags';
import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, Query } from '@nestjs/common';
import { RequireFlagsEnabled } from '@openfeature/nestjs-sdk';
import { CurrentUser } from '../auth/application/current-user';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import {
  CreateUiMessageUseCase,
  DeleteUiMessageUseCase,
  ListUiMessageRevisionsUseCase,
  ListUiMessagesUseCase,
  PublishUiMessagesUseCase,
  RestoreUiMessageRevisionUseCase,
  RestoreUiMessageUseCase,
  UpdateUiMessageUseCase,
} from './application/ui-message.use-cases';
import { CreateUiMessageDto, PublishUiMessagesDto, UpdateUiMessageDto } from './dto/i18n.dto';

/**
 * Admin localization CMS (ADR 0034). Every route is RBAC-gated (reuses the `content` permission
 * resource, so editors/admins manage strings) and method-level flag-gated on `admin.locale-strings`
 * (method-level so the routes still map when the flag is off — ADR 0009).
 */
@Controller('admin/i18n')
export class I18nAuthoringController {
  constructor(
    private readonly currentUser: CurrentUser,
    private readonly listMessages: ListUiMessagesUseCase,
    private readonly createMessage: CreateUiMessageUseCase,
    private readonly updateMessage: UpdateUiMessageUseCase,
    private readonly deleteMessage: DeleteUiMessageUseCase,
    private readonly restoreMessage: RestoreUiMessageUseCase,
    private readonly listRevisions: ListUiMessageRevisionsUseCase,
    private readonly restoreRevision: RestoreUiMessageRevisionUseCase,
    private readonly publishMessages: PublishUiMessagesUseCase,
  ) {}

  private editorId(): string | undefined {
    return this.currentUser.optional()?.id;
  }

  @Get('messages')
  @RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.LocaleStrings }] })
  @RequirePermissions({ content: ['update'] })
  async list(
    @Query('search') search?: string,
    @Query('locale') locale?: string,
    @Query('status') status?: string,
    @Query('includeDeleted') includeDeleted?: string,
  ) {
    const items = await this.listMessages.execute({
      search,
      locale,
      status,
      includeDeleted: includeDeleted === 'true',
    });
    return { items };
  }

  @Post('messages')
  @HttpCode(201)
  @RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.LocaleStrings }] })
  @RequirePermissions({ content: ['create'] })
  create(@Body() body: CreateUiMessageDto) {
    return this.createMessage.execute({ ...body, editedBy: this.editorId() });
  }

  @Put('messages/:id')
  @RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.LocaleStrings }] })
  @RequirePermissions({ content: ['update'] })
  update(@Param('id') id: string, @Body() body: UpdateUiMessageDto) {
    return this.updateMessage.execute(id, body.value, this.editorId());
  }

  @Delete('messages/:id')
  @RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.LocaleStrings }] })
  @RequirePermissions({ content: ['delete'] })
  remove(@Param('id') id: string) {
    return this.deleteMessage.execute(id, this.editorId());
  }

  @Post('messages/:id/restore')
  @RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.LocaleStrings }] })
  @RequirePermissions({ content: ['update'] })
  restore(@Param('id') id: string) {
    return this.restoreMessage.execute(id, this.editorId());
  }

  @Get('messages/:id/revisions')
  @RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.LocaleStrings }] })
  @RequirePermissions({ content: ['update'] })
  async revisions(@Param('id') id: string) {
    return { items: await this.listRevisions.execute(id) };
  }

  @Post('messages/:id/revisions/:revisionId/restore')
  @RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.LocaleStrings }] })
  @RequirePermissions({ content: ['update'] })
  restoreRev(@Param('id') id: string, @Param('revisionId') revisionId: string) {
    return this.restoreRevision.execute(id, revisionId, this.editorId());
  }

  @Post('publish')
  @HttpCode(200)
  @RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.LocaleStrings }] })
  @RequirePermissions({ content: ['publish'] })
  async publish(@Body() body: PublishUiMessagesDto) {
    return { versions: await this.publishMessages.execute(body.locale, this.editorId()) };
  }
}
