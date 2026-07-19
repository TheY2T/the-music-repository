import { FlagKeys } from '@TheY2T/tmr-flags';
import { Inject, Injectable } from '@nestjs/common';
import {
  FeatureFlagKeyConflictError,
  FeatureFlagNotFoundError,
  FlagEnvironmentKeyConflictError,
  FlagEnvironmentNotFoundError,
  FlagSelfLockoutError,
} from '../domain/errors/feature-flag-errors';
import type {
  EnvironmentView,
  EnvironmentWrite,
  FlagAdminView,
  FlagCreateData,
  FlagQuery,
  FlagRevisionView,
  FlagSettingWrite,
  FlagUpdateData,
} from '../domain/feature-flag';
import { FeatureFlagAuthoring, type FlagImportEntry } from './ports/feature-flag-authoring.port';
import { FlagEnvironmentRegistry } from './ports/flag-environment-registry.port';

/** DI token carrying the environment key this deployment resolves against (from `APP_ENV`). */
export const CURRENT_ENV = Symbol('CURRENT_ENV');

/** Flags that gate the admin surface — disabling them in the current environment is refused (lockout). */
const ADMIN_GATING_FLAGS = new Set<string>([FlagKeys.FeatureFlags, FlagKeys.AdminCms]);

const KEY_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*\.[a-z0-9]+(?:-[a-z0-9]+)*$/;

@Injectable()
export class ListFeatureFlagsUseCase {
  constructor(private readonly authoring: FeatureFlagAuthoring) {}
  execute(query: FlagQuery): Promise<FlagAdminView[]> {
    return this.authoring.listFlags(query);
  }
}

@Injectable()
export class CreateFeatureFlagUseCase {
  constructor(private readonly authoring: FeatureFlagAuthoring) {}
  async execute(data: FlagCreateData): Promise<FlagAdminView> {
    const key = data.key.trim();
    if (!KEY_PATTERN.test(key)) {
      throw new FeatureFlagKeyConflictError(key); // reject malformed keys with a clear conflict-style error
    }
    if (await this.authoring.existsKey(key)) {
      throw new FeatureFlagKeyConflictError(key);
    }
    return this.authoring.createFlag({ ...data, key });
  }
}

@Injectable()
export class UpdateFeatureFlagUseCase {
  constructor(private readonly authoring: FeatureFlagAuthoring) {}
  async execute(id: string, data: FlagUpdateData, editedBy?: string): Promise<FlagAdminView> {
    const updated = await this.authoring.updateFlag(id, data, editedBy);
    if (!updated) throw new FeatureFlagNotFoundError(id);
    return updated;
  }
}

@Injectable()
export class DeleteFeatureFlagUseCase {
  constructor(private readonly authoring: FeatureFlagAuthoring) {}
  async execute(id: string, editedBy?: string): Promise<FlagAdminView> {
    const deleted = await this.authoring.softDelete(id, editedBy);
    if (!deleted) throw new FeatureFlagNotFoundError(id);
    return deleted;
  }
}

@Injectable()
export class RestoreFeatureFlagUseCase {
  constructor(private readonly authoring: FeatureFlagAuthoring) {}
  async execute(id: string, editedBy?: string): Promise<FlagAdminView> {
    const restored = await this.authoring.restore(id, editedBy);
    if (!restored) throw new FeatureFlagNotFoundError(id);
    return restored;
  }
}

@Injectable()
export class UpsertFlagSettingUseCase {
  constructor(
    private readonly authoring: FeatureFlagAuthoring,
    @Inject(CURRENT_ENV) private readonly currentEnv: string,
  ) {}

  async execute(
    flagId: string,
    environmentId: string,
    data: FlagSettingWrite,
    editedBy?: string,
  ): Promise<FlagAdminView> {
    const flag = await this.authoring.getFlag(flagId);
    if (!flag) throw new FeatureFlagNotFoundError(flagId);

    // Self-lockout guard: refuse to disable an admin-gating flag in the environment we resolve against.
    if (data.enabled === false && ADMIN_GATING_FLAGS.has(flag.key)) {
      const target = flag.settings.find((s) => s.environmentId === environmentId);
      if (target && target.environmentKey === this.currentEnv) {
        throw new FlagSelfLockoutError(flag.key, target.environmentKey);
      }
    }

    const updated = await this.authoring.upsertSetting(flagId, environmentId, data, editedBy);
    if (!updated) throw new FeatureFlagNotFoundError(flagId);
    return updated;
  }
}

@Injectable()
export class ListFlagRevisionsUseCase {
  constructor(private readonly authoring: FeatureFlagAuthoring) {}
  execute(flagId?: string): Promise<FlagRevisionView[]> {
    return this.authoring.listRevisions(flagId);
  }
}

@Injectable()
export class ImportFeatureFlagsUseCase {
  constructor(private readonly authoring: FeatureFlagAuthoring) {}
  execute(entries: Record<string, FlagImportEntry>, editedBy?: string): Promise<number> {
    return this.authoring.importMany(entries, editedBy);
  }
}

@Injectable()
export class ListEnvironmentsUseCase {
  constructor(private readonly registry: FlagEnvironmentRegistry) {}
  execute(includeInactive?: boolean): Promise<EnvironmentView[]> {
    return this.registry.list(includeInactive);
  }
}

@Injectable()
export class CreateEnvironmentUseCase {
  constructor(private readonly registry: FlagEnvironmentRegistry) {}
  async execute(data: EnvironmentWrite, editedBy?: string): Promise<EnvironmentView> {
    const key = data.key?.trim();
    if (!key || !/^[a-z0-9][a-z0-9-]*$/.test(key)) {
      throw new FlagEnvironmentKeyConflictError(key ?? '');
    }
    if (await this.registry.getByKey(key)) {
      throw new FlagEnvironmentKeyConflictError(key);
    }
    return this.registry.create({ ...data, key }, editedBy);
  }
}

@Injectable()
export class UpdateEnvironmentUseCase {
  constructor(private readonly registry: FlagEnvironmentRegistry) {}
  async execute(id: string, data: EnvironmentWrite, editedBy?: string): Promise<EnvironmentView> {
    const updated = await this.registry.update(id, data, editedBy);
    if (!updated) throw new FlagEnvironmentNotFoundError(id);
    return updated;
  }
}

@Injectable()
export class DeleteEnvironmentUseCase {
  constructor(private readonly registry: FlagEnvironmentRegistry) {}
  async execute(id: string, editedBy?: string): Promise<EnvironmentView> {
    const deleted = await this.registry.softDelete(id, editedBy);
    if (!deleted) throw new FlagEnvironmentNotFoundError(id);
    return deleted;
  }
}
