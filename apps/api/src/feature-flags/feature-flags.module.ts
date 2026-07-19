import { TmrFlagProvider } from '@TheY2T/tmr-flags-eval';
import type { ExecutionContext, OnApplicationBootstrap } from '@nestjs/common';
import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenFeatureModule } from '@openfeature/nestjs-sdk';
import { type EvaluationContext, OpenFeature } from '@openfeature/server-sdk';
import { AuthModule } from '../auth/auth.module';
import type { Env } from '../config/env';
import {
  CreateEnvironmentUseCase,
  CreateFeatureFlagUseCase,
  CURRENT_ENV,
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
import { FeatureFlagAuthoring } from './application/ports/feature-flag-authoring.port';
import { FeatureFlagCatalogue } from './application/ports/feature-flag-catalogue.port';
import { FlagEnvironmentRegistry } from './application/ports/flag-environment-registry.port';
import { DemoController } from './demo.controller';
import { FeatureFlagController } from './feature-flags.controller';
import { FeatureFlagsAdminController } from './feature-flags-admin.controller';
import { DrizzleFeatureFlagAuthoring } from './infrastructure/drizzle-feature-flag-authoring.adapter';
import { DrizzleFeatureFlagCatalogue } from './infrastructure/drizzle-feature-flag-catalogue.adapter';
import { DrizzleFlagEnvironmentRegistry } from './infrastructure/drizzle-flag-environment-registry.adapter';
import { InProcessSnapshotSource } from './infrastructure/in-process-snapshot-source';

/**
 * Builds a per-request OpenFeature evaluation context from the `x-user-id` / `x-user-roles` headers (set
 * by the auth middleware). Drives percentage rollouts + role targeting.
 */
function contextFactory(execution: ExecutionContext): EvaluationContext | undefined {
  const request = execution
    .switchToHttp()
    .getRequest<{ headers: Record<string, string | undefined> }>();

  const targetingKey = request.headers['x-user-id'];
  const roles = request.headers['x-user-roles']?.split(',').map((role) => role.trim());

  if (!targetingKey && !roles) {
    return undefined;
  }

  const context: EvaluationContext = {};
  if (targetingKey) {
    context.targetingKey = targetingKey;
  }
  if (roles) {
    context.roles = roles;
  }
  return context;
}

/**
 * Feature-flag feature (ADR 0035, hexagonal). Registers OpenFeature with a DB-backed provider
 * ({@link TmrFlagProvider} + {@link InProcessSnapshotSource}) that resolves flags from Postgres for the
 * deployment's `APP_ENV`, and serves the public snapshot + admin CRUD. The provider is set on
 * `onApplicationBootstrap`, once the DI-managed {@link FeatureFlagCatalogue} is available.
 */
@Module({
  imports: [OpenFeatureModule.forRoot({ contextFactory }), AuthModule],
  controllers: [DemoController, FeatureFlagController, FeatureFlagsAdminController],
  providers: [
    { provide: FeatureFlagCatalogue, useClass: DrizzleFeatureFlagCatalogue },
    { provide: FeatureFlagAuthoring, useClass: DrizzleFeatureFlagAuthoring },
    { provide: FlagEnvironmentRegistry, useClass: DrizzleFlagEnvironmentRegistry },
    {
      provide: CURRENT_ENV,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => config.get('APP_ENV', { infer: true }),
    },
    ListFeatureFlagsUseCase,
    CreateFeatureFlagUseCase,
    UpdateFeatureFlagUseCase,
    DeleteFeatureFlagUseCase,
    RestoreFeatureFlagUseCase,
    UpsertFlagSettingUseCase,
    ListFlagRevisionsUseCase,
    ImportFeatureFlagsUseCase,
    ListEnvironmentsUseCase,
    CreateEnvironmentUseCase,
    UpdateEnvironmentUseCase,
    DeleteEnvironmentUseCase,
  ],
  exports: [FeatureFlagCatalogue],
})
export class FeatureFlagsModule implements OnApplicationBootstrap {
  private readonly logger = new Logger('FeatureFlags');

  constructor(
    private readonly catalogue: FeatureFlagCatalogue,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const environmentKey = this.config.get('APP_ENV', { infer: true });
    const source = new InProcessSnapshotSource(this.catalogue, environmentKey);
    await OpenFeature.setProviderAndWait(new TmrFlagProvider(source));
    this.logger.log(`Feature flags resolving from the database (environment: ${environmentKey}).`);
  }
}
