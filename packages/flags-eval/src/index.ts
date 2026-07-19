/**
 * @TheY2T/tmr-flags-eval — the shared feature-flag evaluation engine. Consumed by the API (in-process
 * snapshot from `FeatureFlagCatalogue`) and the web SSR layer (HTTP snapshot from
 * `GET /feature-flags/snapshot/:env`), so a flag evaluates identically in both. Pure/portable: no
 * Nest/Drizzle/Astro imports.
 */

export {
  type EvaluationReason,
  type EvaluationResult,
  evaluateFlag,
} from './evaluate';
export { HttpSnapshotSource } from './http-source';
export { murmur3_32 } from './murmur';
export { type SnapshotSource, TmrFlagProvider } from './provider';
export type {
  FlagSetting,
  FlagSnapshot,
  FlagValue,
  TargetingRule,
} from './snapshot';
export { VARIANT_OFF, VARIANT_ON } from './snapshot';
export { evaluateTargeting, type TargetingData } from './targeting';
