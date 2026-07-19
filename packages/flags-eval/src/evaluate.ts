import type { FlagEvaluationContext } from '@TheY2T/tmr-flags';
import { type FlagSnapshot, type FlagValue, VARIANT_OFF } from './snapshot';
import { evaluateTargeting, type TargetingData } from './targeting';

/** Why a value was resolved (OpenFeature-style reasons, as plain strings). */
export type EvaluationReason = 'TARGETING_MATCH' | 'STATIC' | 'DISABLED' | 'DEFAULT' | 'ERROR';

/** The outcome of evaluating one flag against a snapshot + context. */
export interface EvaluationResult {
  value: FlagValue;
  variant?: string;
  reason: EvaluationReason;
}

/**
 * Evaluate one flag from a snapshot for the given context. Resolution order:
 *  1. Flag missing from the snapshot → the caller's code default (`FlagDefaults[key]`), reason DEFAULT.
 *  2. `enabled === false` → the feature is off for this environment → the `off` variant, reason DISABLED.
 *  3. A targeting rule that resolves to a variant → that variant, reason TARGETING_MATCH.
 *  4. Otherwise → `defaultVariant`, reason STATIC.
 *
 * The per-environment `enabled` master switch is an admin toggle: turning a flag off forces the off value
 * regardless of the code default, which is what the CMS toggle does.
 */
export function evaluateFlag(
  snapshot: FlagSnapshot,
  key: string,
  context: FlagEvaluationContext,
  fallback: FlagValue,
): EvaluationResult {
  const setting = snapshot.flags[key];
  if (!setting) {
    return { value: fallback, reason: 'DEFAULT' };
  }

  const resolveVariant = (variant: string, reason: EvaluationReason): EvaluationResult => {
    const value = setting.variants[variant];
    if (value !== undefined) {
      return { value, variant, reason };
    }
    return { value: setting.defaultValue, reason: 'ERROR' };
  };

  if (!setting.enabled) {
    // Force off: the off variant if present, else the code fallback coerced to false-ish.
    const off = setting.variants[VARIANT_OFF];
    if (off !== undefined) {
      return { value: off, variant: VARIANT_OFF, reason: 'DISABLED' };
    }
    return { value: false, reason: 'DISABLED' };
  }

  if (setting.targeting) {
    const data: TargetingData = {
      flagKey: key,
      targetingKey: context.targetingKey,
      email: context.email,
      roles: context.roles,
    };
    const matched = evaluateTargeting(setting.targeting, data);
    if (matched) {
      return resolveVariant(matched, 'TARGETING_MATCH');
    }
  }

  return resolveVariant(setting.defaultVariant, 'STATIC');
}
