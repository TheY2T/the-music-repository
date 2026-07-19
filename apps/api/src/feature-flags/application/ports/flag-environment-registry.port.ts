import type { EnvironmentView, EnvironmentWrite } from '../../domain/feature-flag';

/**
 * FlagEnvironmentRegistry (ADR 0012) — CRUD for the deployable environments flags are targeted at
 * (dev/uat/prod + any admin-created ones). Named for the capability, no `Port` suffix. Creating an
 * environment backfills a setting row for every existing flag so the new environment is immediately
 * evaluatable.
 */
export abstract class FlagEnvironmentRegistry {
  abstract list(includeInactive?: boolean): Promise<EnvironmentView[]>;
  abstract getByKey(key: string): Promise<EnvironmentView | null>;
  abstract create(data: EnvironmentWrite, editedBy?: string): Promise<EnvironmentView>;
  abstract update(
    id: string,
    data: EnvironmentWrite,
    editedBy?: string,
  ): Promise<EnvironmentView | null>;
  abstract softDelete(id: string, editedBy?: string): Promise<EnvironmentView | null>;
}
