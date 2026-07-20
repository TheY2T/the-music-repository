import { describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_INSTRUMENT_PREFERENCES,
  type InstrumentPreferences,
  type StoredInstrumentPreferences,
} from '../../domain/instrument-preferences';
import type { UserPreferences } from '../ports/user-preferences.port';
import { GetPreferencesUseCase } from './get-preferences.use-case';
import { UpdatePreferencesUseCase } from './update-preferences.use-case';

const stored: StoredInstrumentPreferences = {
  handedness: 'left',
  keyboardSkin: 'classic',
  fretboardSkin: 'sunburst',
  fullscreen: true,
  updatedAt: new Date('2026-07-01T00:00:00Z'),
};

function mockPort(overrides: Partial<UserPreferences> = {}): UserPreferences {
  return {
    get: vi.fn().mockResolvedValue(null),
    put: vi.fn(),
    ...overrides,
  } as UserPreferences;
}

describe('GetPreferencesUseCase', () => {
  it('returns the defaults when the user has never saved preferences', async () => {
    const port = mockPort({ get: vi.fn().mockResolvedValue(null) });
    const result = await new GetPreferencesUseCase(port).execute('user-1');
    expect(result).toMatchObject(DEFAULT_INSTRUMENT_PREFERENCES);
  });

  it('returns the stored preferences when present', async () => {
    const port = mockPort({ get: vi.fn().mockResolvedValue(stored) });
    const result = await new GetPreferencesUseCase(port).execute('user-1');
    expect(result).toEqual(stored);
  });
});

describe('UpdatePreferencesUseCase', () => {
  it('delegates the upsert to the port and returns the stored record', async () => {
    const put = vi.fn().mockResolvedValue(stored);
    const port = mockPort({ put });
    const input: InstrumentPreferences = {
      handedness: 'left',
      keyboardSkin: 'classic',
      fretboardSkin: 'sunburst',
      fullscreen: true,
    };
    const result = await new UpdatePreferencesUseCase(port).execute('user-1', input);
    expect(put).toHaveBeenCalledWith('user-1', input);
    expect(result).toEqual(stored);
  });
});
