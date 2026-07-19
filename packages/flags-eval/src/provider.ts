import { FlagDefaults, type FlagEvaluationContext } from '@TheY2T/tmr-flags';
import type {
  EvaluationContext,
  JsonValue,
  Logger,
  Provider,
  ResolutionDetails,
} from '@openfeature/server-sdk';
import { evaluateFlag } from './evaluate';
import type { FlagSnapshot, FlagValue } from './snapshot';

/**
 * Where a provider gets its environment-scoped snapshot. The API backs this with the `FeatureFlagCatalogue`
 * read port (in-process DB); the web backs it with an HTTP fetch of `GET /feature-flags/snapshot/:env`.
 * Implementations should cache and only refetch on a version change — the provider calls this per evaluation.
 */
export interface SnapshotSource {
  /** Return the current snapshot for the resolved environment, or `null` if unavailable (⇒ fall back to defaults). */
  getSnapshot(): Promise<FlagSnapshot | null>;
}

function contextToFlagContext(context: EvaluationContext): FlagEvaluationContext {
  const roles = context.roles;
  return {
    targetingKey: context.targetingKey,
    email: typeof context.email === 'string' ? context.email : undefined,
    roles: Array.isArray(roles) ? roles.map(String) : undefined,
  };
}

/** The code-registry fallback for a key, or the caller's supplied default if the key isn't registered. */
function codeFallback<T extends FlagValue>(flagKey: string, defaultValue: T): FlagValue {
  return (FlagDefaults as Record<string, boolean>)[flagKey] ?? defaultValue;
}

/**
 * An OpenFeature server provider that resolves flags from a {@link FlagSnapshot} using the shared
 * {@link evaluateFlag} engine.
 *
 * If the snapshot source is unavailable it resolves the code-level `FlagDefaults` (reason DEFAULT), so
 * evaluation always returns a value.
 */
export class TmrFlagProvider implements Provider {
  readonly metadata = { name: 'tmr-db-flags' } as const;
  readonly runsOn = 'server' as const;

  constructor(private readonly source: SnapshotSource) {}

  private async resolve<T extends FlagValue>(
    flagKey: string,
    defaultValue: T,
    context: EvaluationContext,
    expected: 'boolean' | 'string' | 'number' | 'object',
  ): Promise<ResolutionDetails<T>> {
    const snapshot = await this.source.getSnapshot().catch(() => null);
    if (!snapshot) {
      return { value: codeFallback(flagKey, defaultValue) as T, reason: 'DEFAULT' };
    }
    const result = evaluateFlag(
      snapshot,
      flagKey,
      contextToFlagContext(context),
      codeFallback(flagKey, defaultValue),
    );
    const typeOk =
      expected === 'object' ? typeof result.value === 'object' : typeof result.value === expected;
    if (!typeOk) {
      return {
        value: defaultValue,
        reason: 'ERROR',
        errorCode: 'TYPE_MISMATCH' as ResolutionDetails<T>['errorCode'],
        errorMessage: `Flag ${flagKey} resolved to a ${typeof result.value}, expected ${expected}`,
      };
    }
    return { value: result.value as T, variant: result.variant, reason: result.reason };
  }

  resolveBooleanEvaluation(
    flagKey: string,
    defaultValue: boolean,
    context: EvaluationContext,
    _logger: Logger,
  ): Promise<ResolutionDetails<boolean>> {
    return this.resolve(flagKey, defaultValue, context, 'boolean');
  }

  resolveStringEvaluation(
    flagKey: string,
    defaultValue: string,
    context: EvaluationContext,
    _logger: Logger,
  ): Promise<ResolutionDetails<string>> {
    return this.resolve(flagKey, defaultValue, context, 'string');
  }

  resolveNumberEvaluation(
    flagKey: string,
    defaultValue: number,
    context: EvaluationContext,
    _logger: Logger,
  ): Promise<ResolutionDetails<number>> {
    return this.resolve(flagKey, defaultValue, context, 'number');
  }

  resolveObjectEvaluation<T extends JsonValue>(
    flagKey: string,
    defaultValue: T,
    context: EvaluationContext,
    _logger: Logger,
  ): Promise<ResolutionDetails<T>> {
    return this.resolve(flagKey, defaultValue as FlagValue, context, 'object') as Promise<
      ResolutionDetails<T>
    >;
  }
}
