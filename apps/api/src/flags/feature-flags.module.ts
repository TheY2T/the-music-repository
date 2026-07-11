import type { ExecutionContext } from '@nestjs/common';
import { Module } from '@nestjs/common';
import { FlagdProvider } from '@openfeature/flagd-provider';
import { OpenFeatureModule } from '@openfeature/nestjs-sdk';
import type { EvaluationContext } from '@openfeature/server-sdk';
import { DemoController } from './demo.controller';
import { createFlagdLogger } from './flagd-logger';

const FLAGD_HOST = process.env.FLAGD_HOST ?? 'localhost';
const FLAGD_PORT = Number(process.env.FLAGD_PORT ?? 8013);

/**
 * Builds a per-request OpenFeature evaluation context. Phase 0 has no auth yet, so it reads
 * optional `x-user-id` / `x-user-roles` headers to exercise targeting rules; Phase 1 will
 * populate this from the authenticated session (see docs/adr/0003-feature-flags-openfeature.md).
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
 * Registers OpenFeature with the self-hosted flagd provider (vendor-neutral abstraction).
 * Swapping to another backend later is a one-line change to `defaultProvider`. If flagd is
 * unreachable, `createFlagdLogger` prints a clear "run `pnpm infra:up`" hint and flags fall
 * back to their default values.
 */
@Module({
  imports: [
    OpenFeatureModule.forRoot({
      logger: createFlagdLogger(`${FLAGD_HOST}:${FLAGD_PORT}`),
      defaultProvider: new FlagdProvider({
        host: FLAGD_HOST,
        port: FLAGD_PORT,
        resolverType: 'rpc',
        deadlineMs: 500,
      }),
      contextFactory,
    }),
  ],
  controllers: [DemoController],
})
export class FeatureFlagsModule {}
