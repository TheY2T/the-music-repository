import type {
  FlagAdminView,
  FlagCreateData,
  FlagQuery,
  FlagRevisionView,
  FlagSettingWrite,
  FlagUpdateData,
} from '../../domain/feature-flag';

/** One entry in the import payload: `key → { variants, defaultVariant, targeting, ... }`. */
export interface FlagImportEntry {
  variants?: Record<string, unknown>;
  defaultVariant?: string;
  targeting?: Record<string, unknown> | null;
  enabled?: boolean;
  description?: string;
}

/**
 * FeatureFlagAuthoring (ADR 0012) — the write side of feature flags: flag registry CRUD, per-environment
 * setting upserts (the core toggle + targeting), revision history, and bulk import. Named for the
 * capability, no `Port` suffix. Every write bumps the affected environment's version tag.
 */
export abstract class FeatureFlagAuthoring {
  abstract listFlags(query: FlagQuery): Promise<FlagAdminView[]>;
  abstract getFlag(id: string): Promise<FlagAdminView | null>;
  abstract existsKey(key: string): Promise<boolean>;
  /** Create a flag (`source: 'runtime'`) plus an initial setting in every environment. */
  abstract createFlag(data: FlagCreateData): Promise<FlagAdminView>;
  abstract updateFlag(
    id: string,
    data: FlagUpdateData,
    editedBy?: string,
  ): Promise<FlagAdminView | null>;
  abstract softDelete(id: string, editedBy?: string): Promise<FlagAdminView | null>;
  abstract restore(id: string, editedBy?: string): Promise<FlagAdminView | null>;
  /** Upsert one flag's setting for one environment; bumps that environment's version tag. */
  abstract upsertSetting(
    flagId: string,
    environmentId: string,
    data: FlagSettingWrite,
    editedBy?: string,
  ): Promise<FlagAdminView | null>;
  /** The change history, newest first — all flags, or one flag when `flagId` is given. */
  abstract listRevisions(flagId?: string): Promise<FlagRevisionView[]>;
  /** Bulk-upsert flags from a `key → config` map. Returns the number of flags imported/updated. */
  abstract importMany(entries: Record<string, FlagImportEntry>, editedBy?: string): Promise<number>;
}
