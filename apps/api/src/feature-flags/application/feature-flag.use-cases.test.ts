import { describe, expect, it, vi } from 'vitest';
import {
  FeatureFlagKeyConflictError,
  FlagSelfLockoutError,
} from '../domain/errors/feature-flag-errors';
import type { FlagAdminView } from '../domain/feature-flag';
import { CreateFeatureFlagUseCase, UpsertFlagSettingUseCase } from './feature-flag.use-cases';
import type { FeatureFlagAuthoring } from './ports/feature-flag-authoring.port';

function adminFlag(key: string): FlagAdminView {
  return {
    id: 'f1',
    key,
    description: '',
    domain: key.split('.')[0] ?? key,
    flagType: 'boolean',
    defaultValue: true,
    source: 'code',
    seeded: true,
    deleted: false,
    updatedAt: '',
    settings: [
      {
        environmentId: 'e-dev',
        environmentKey: 'dev',
        enabled: true,
        defaultVariant: 'on',
        variants: { on: true, off: false },
        targeting: null,
      },
      {
        environmentId: 'e-uat',
        environmentKey: 'uat',
        enabled: true,
        defaultVariant: 'on',
        variants: { on: true, off: false },
        targeting: null,
      },
    ],
  };
}

function authoringMock(overrides: Partial<FeatureFlagAuthoring> = {}): FeatureFlagAuthoring {
  return {
    listFlags: vi.fn(),
    getFlag: vi.fn(),
    existsKey: vi.fn().mockResolvedValue(false),
    createFlag: vi.fn(),
    updateFlag: vi.fn(),
    softDelete: vi.fn(),
    restore: vi.fn(),
    upsertSetting: vi.fn(),
    listRevisions: vi.fn(),
    importMany: vi.fn(),
    ...overrides,
  } as FeatureFlagAuthoring;
}

describe('UpsertFlagSettingUseCase — self-lockout guard', () => {
  it('refuses to disable admin.feature-flags in the current environment', async () => {
    const authoring = authoringMock({
      getFlag: vi.fn().mockResolvedValue(adminFlag('admin.feature-flags')),
    });
    const useCase = new UpsertFlagSettingUseCase(authoring, 'dev');
    await expect(useCase.execute('f1', 'e-dev', { enabled: false })).rejects.toBeInstanceOf(
      FlagSelfLockoutError,
    );
    expect(authoring.upsertSetting).not.toHaveBeenCalled();
  });

  it('allows disabling admin.feature-flags in a different environment', async () => {
    const flag = adminFlag('admin.feature-flags');
    const authoring = authoringMock({
      getFlag: vi.fn().mockResolvedValue(flag),
      upsertSetting: vi.fn().mockResolvedValue(flag),
    });
    const useCase = new UpsertFlagSettingUseCase(authoring, 'dev');
    await useCase.execute('f1', 'e-uat', { enabled: false });
    expect(authoring.upsertSetting).toHaveBeenCalledWith(
      'f1',
      'e-uat',
      { enabled: false },
      undefined,
    );
  });

  it('allows disabling a normal flag in the current environment', async () => {
    const flag = adminFlag('tools.metronome');
    const authoring = authoringMock({
      getFlag: vi.fn().mockResolvedValue(flag),
      upsertSetting: vi.fn().mockResolvedValue(flag),
    });
    const useCase = new UpsertFlagSettingUseCase(authoring, 'dev');
    await useCase.execute('f1', 'e-dev', { enabled: false });
    expect(authoring.upsertSetting).toHaveBeenCalled();
  });
});

describe('CreateFeatureFlagUseCase', () => {
  it('rejects a duplicate key', async () => {
    const authoring = authoringMock({ existsKey: vi.fn().mockResolvedValue(true) });
    const useCase = new CreateFeatureFlagUseCase(authoring);
    await expect(useCase.execute({ key: 'tools.metronome' })).rejects.toBeInstanceOf(
      FeatureFlagKeyConflictError,
    );
  });

  it('rejects a malformed key', async () => {
    const authoring = authoringMock();
    const useCase = new CreateFeatureFlagUseCase(authoring);
    await expect(useCase.execute({ key: 'NotAValidKey' })).rejects.toBeInstanceOf(
      FeatureFlagKeyConflictError,
    );
    expect(authoring.createFlag).not.toHaveBeenCalled();
  });

  it('creates a valid new flag', async () => {
    const flag = adminFlag('tools.new-thing');
    const authoring = authoringMock({ createFlag: vi.fn().mockResolvedValue(flag) });
    const useCase = new CreateFeatureFlagUseCase(authoring);
    const result = await useCase.execute({ key: 'tools.new-thing', description: 'x' });
    expect(result.key).toBe('tools.new-thing');
    expect(authoring.createFlag).toHaveBeenCalled();
  });
});
