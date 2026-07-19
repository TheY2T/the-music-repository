import { FlagKeys } from '@TheY2T/tmr-flags';
import type { TargetingRule } from '@TheY2T/tmr-flags-eval';
import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, Query } from '@nestjs/common';
import { RequireFlagsEnabled } from '@openfeature/nestjs-sdk';
import { CurrentUser } from '../auth/application/current-user';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import {
  CreateEnvironmentUseCase,
  CreateFeatureFlagUseCase,
  DeleteEnvironmentUseCase,
  DeleteFeatureFlagUseCase,
  ImportFeatureFlagsUseCase,
  ListEnvironmentsUseCase,
  ListFeatureFlagsUseCase,
  ListFlagRevisionsUseCase,
  RestoreFeatureFlagUseCase,
  UpdateEnvironmentUseCase,
  UpdateFeatureFlagUseCase,
  UpsertFlagSettingUseCase,
} from './application/feature-flag.use-cases';
import type { FlagImportEntry } from './application/ports/feature-flag-authoring.port';
import {
  CreateEnvironmentDto,
  CreateFeatureFlagDto,
  ImportFeatureFlagsDto,
  UpdateEnvironmentDto,
  UpdateFeatureFlagDto,
  UpsertFlagSettingDto,
} from './dto/feature-flags.dto';

/**
 * Feature-flag admin CMS (ADR 0035). Every route is method-level flag-gated on `admin.feature-flags` (so
 * the routes still map when the flag is off — ADR 0009) and RBAC-gated on the `featureFlags` permission
 * resource (mutations admin-only; editors read-only).
 */
@Controller('admin/feature-flags')
export class FeatureFlagsAdminController {
  constructor(
    private readonly currentUser: CurrentUser,
    private readonly listFlags: ListFeatureFlagsUseCase,
    private readonly createFlag: CreateFeatureFlagUseCase,
    private readonly updateFlag: UpdateFeatureFlagUseCase,
    private readonly deleteFlag: DeleteFeatureFlagUseCase,
    private readonly restoreFlag: RestoreFeatureFlagUseCase,
    private readonly upsertSetting: UpsertFlagSettingUseCase,
    private readonly listRevisions: ListFlagRevisionsUseCase,
    private readonly importFlags: ImportFeatureFlagsUseCase,
    private readonly listEnvironments: ListEnvironmentsUseCase,
    private readonly createEnvironment: CreateEnvironmentUseCase,
    private readonly updateEnvironment: UpdateEnvironmentUseCase,
    private readonly deleteEnvironment: DeleteEnvironmentUseCase,
  ) {}

  private editorId(): string | undefined {
    return this.currentUser.optional()?.id;
  }

  // --- Flags ---

  @Get('flags')
  @RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.FeatureFlags }] })
  @RequirePermissions({ featureFlags: ['read'] })
  async list(
    @Query('search') search?: string,
    @Query('domain') domain?: string,
    @Query('includeDeleted') includeDeleted?: string,
  ) {
    const items = await this.listFlags.execute({
      search,
      domain,
      includeDeleted: includeDeleted === 'true',
    });
    return { items };
  }

  @Post('flags')
  @HttpCode(201)
  @RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.FeatureFlags }] })
  @RequirePermissions({ featureFlags: ['create'] })
  create(@Body() body: CreateFeatureFlagDto) {
    return this.createFlag.execute({ ...body, editedBy: this.editorId() });
  }

  @Put('flags/:id')
  @RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.FeatureFlags }] })
  @RequirePermissions({ featureFlags: ['update'] })
  update(@Param('id') id: string, @Body() body: UpdateFeatureFlagDto) {
    return this.updateFlag.execute(id, body, this.editorId());
  }

  @Delete('flags/:id')
  @RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.FeatureFlags }] })
  @RequirePermissions({ featureFlags: ['delete'] })
  remove(@Param('id') id: string) {
    return this.deleteFlag.execute(id, this.editorId());
  }

  @Post('flags/:id/restore')
  @RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.FeatureFlags }] })
  @RequirePermissions({ featureFlags: ['update'] })
  restore(@Param('id') id: string) {
    return this.restoreFlag.execute(id, this.editorId());
  }

  @Put('flags/:id/settings/:envId')
  @RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.FeatureFlags }] })
  @RequirePermissions({ featureFlags: ['update'] })
  setSetting(
    @Param('id') id: string,
    @Param('envId') envId: string,
    @Body() body: UpsertFlagSettingDto,
  ) {
    return this.upsertSetting.execute(
      id,
      envId,
      {
        enabled: body.enabled,
        defaultVariant: body.defaultVariant,
        variants: body.variants as Record<string, boolean> | undefined,
        targeting: body.targeting as TargetingRule | null | undefined,
      },
      this.editorId(),
    );
  }

  @Get('flags/:id/revisions')
  @RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.FeatureFlags }] })
  @RequirePermissions({ featureFlags: ['read'] })
  async flagRevisions(@Param('id') id: string) {
    return { items: await this.listRevisions.execute(id) };
  }

  @Get('revisions')
  @RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.FeatureFlags }] })
  @RequirePermissions({ featureFlags: ['read'] })
  async allRevisions() {
    return { items: await this.listRevisions.execute() };
  }

  @Post('import')
  @HttpCode(200)
  @RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.FeatureFlags }] })
  @RequirePermissions({ featureFlags: ['create'] })
  async import(@Body() body: ImportFeatureFlagsDto) {
    const imported = await this.importFlags.execute(
      body.entries as Record<string, FlagImportEntry>,
      this.editorId(),
    );
    return { imported };
  }

  // --- Environments ---

  @Get('environments')
  @RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.FeatureFlags }] })
  @RequirePermissions({ featureFlags: ['read'] })
  async environments(@Query('includeInactive') includeInactive?: string) {
    const items = await this.listEnvironments.execute(includeInactive === 'true');
    return { items };
  }

  @Post('environments')
  @HttpCode(201)
  @RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.FeatureFlags }] })
  @RequirePermissions({ featureFlags: ['create'] })
  createEnv(@Body() body: CreateEnvironmentDto) {
    return this.createEnvironment.execute(body, this.editorId());
  }

  @Put('environments/:id')
  @RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.FeatureFlags }] })
  @RequirePermissions({ featureFlags: ['update'] })
  updateEnv(@Param('id') id: string, @Body() body: UpdateEnvironmentDto) {
    return this.updateEnvironment.execute(id, body, this.editorId());
  }

  @Delete('environments/:id')
  @RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.FeatureFlags }] })
  @RequirePermissions({ featureFlags: ['delete'] })
  removeEnv(@Param('id') id: string) {
    return this.deleteEnvironment.execute(id, this.editorId());
  }
}
