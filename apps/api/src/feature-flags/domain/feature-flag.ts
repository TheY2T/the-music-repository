/**
 * Feature-flag admin domain types (ADR 0035). Framework-free POJOs — no Nest/Drizzle imports. These are
 * the write-side/admin views; the read-side evaluatable snapshot lives in `@TheY2T/tmr-flags-eval`.
 */

import type { FlagValue, TargetingRule } from '@TheY2T/tmr-flags-eval';

/** One flag's per-environment configuration, as shown/edited in the admin matrix. */
export interface FlagSettingView {
  environmentId: string;
  environmentKey: string;
  enabled: boolean;
  defaultVariant: string;
  variants: Record<string, FlagValue>;
  targeting: TargetingRule | null;
}

/** An admin-table view of one flag plus its settings across every environment. */
export interface FlagAdminView {
  id: string;
  key: string;
  description: string;
  domain: string;
  flagType: string;
  defaultValue: FlagValue;
  source: string; // code | runtime
  seeded: boolean;
  deleted: boolean;
  updatedAt: string;
  updatedBy?: string;
  settings: FlagSettingView[];
}

/** A deployable environment, as managed in the admin CMS. */
export interface EnvironmentView {
  id: string;
  key: string;
  label: string;
  rank: number;
  isDefault: boolean;
  archived: boolean;
  deleted: boolean;
  updatedAt: string;
}

/** One entry in the flag change history. */
export interface FlagRevisionView {
  id: string;
  flagId?: string;
  flagKey?: string;
  environmentId?: string;
  environmentKey?: string;
  action: string;
  before?: unknown;
  after?: unknown;
  actorId?: string;
  createdAt: string;
}

/** Filters for the admin flag list. */
export interface FlagQuery {
  search?: string;
  domain?: string;
  includeDeleted?: boolean;
}

/** A new flag authored in the CMS (defaults to a boolean off in every environment). */
export interface FlagCreateData {
  key: string;
  description?: string;
  defaultValue?: boolean;
  editedBy?: string;
}

/** Editable flag-registry fields (not per-environment). */
export interface FlagUpdateData {
  description?: string;
  defaultValue?: boolean;
}

/** A per-environment setting write (the core toggle + targeting). */
export interface FlagSettingWrite {
  enabled?: boolean;
  defaultVariant?: string;
  variants?: Record<string, FlagValue>;
  targeting?: TargetingRule | null;
}

/** A new/edited environment. */
export interface EnvironmentWrite {
  key?: string;
  label?: string;
  rank?: number;
  isDefault?: boolean;
  archived?: boolean;
}
