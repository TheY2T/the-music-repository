import { describe, expect, it } from 'vitest';
import { evaluateFlag } from './evaluate';
import type { FlagSetting, FlagSnapshot } from './snapshot';

function setting(overrides: Partial<FlagSetting> & { key: string }): FlagSetting {
  return {
    enabled: true,
    defaultVariant: 'on',
    variants: { on: true, off: false },
    targeting: null,
    defaultValue: true,
    ...overrides,
  };
}

function snapshot(...settings: FlagSetting[]): FlagSnapshot {
  return {
    environment: 'dev',
    version: '1',
    flags: Object.fromEntries(settings.map((s) => [s.key, s])),
  };
}

describe('evaluateFlag', () => {
  it('resolves the code fallback (DEFAULT) when the flag is absent', () => {
    const result = evaluateFlag(snapshot(), 'tools.metronome', {}, true);
    expect(result).toEqual({ value: true, reason: 'DEFAULT' });
  });

  it('forces the off variant (DISABLED) when the env master switch is off', () => {
    const snap = snapshot(setting({ key: 'tools.metronome', enabled: false }));
    const result = evaluateFlag(snap, 'tools.metronome', {}, true);
    expect(result).toEqual({ value: false, variant: 'off', reason: 'DISABLED' });
  });

  it('resolves the default variant (STATIC) when enabled with no targeting', () => {
    const snap = snapshot(setting({ key: 'tools.metronome' }));
    const result = evaluateFlag(snap, 'tools.metronome', {}, true);
    expect(result).toEqual({ value: true, variant: 'on', reason: 'STATIC' });
  });

  it('resolves via a targeting match (TARGETING_MATCH)', () => {
    const snap = snapshot(
      setting({
        key: 'demo.new-banner',
        enabled: true,
        defaultVariant: 'off',
        defaultValue: false,
        targeting: { if: [{ in: ['beta', { var: 'roles' }] }, 'on', 'off'] },
      }),
    );
    expect(evaluateFlag(snap, 'demo.new-banner', { roles: ['beta'] }, false)).toEqual({
      value: true,
      variant: 'on',
      reason: 'TARGETING_MATCH',
    });
    // The rule's else-branch is itself a variant ('off'), so this is a targeting match to off.
    expect(evaluateFlag(snap, 'demo.new-banner', { roles: ['learner'] }, false)).toEqual({
      value: false,
      variant: 'off',
      reason: 'TARGETING_MATCH',
    });
  });

  it('honours a defaultVariant of off (premium-style, master switch off)', () => {
    const snap = snapshot(
      setting({
        key: 'monetization.premium',
        enabled: false,
        defaultVariant: 'off',
        defaultValue: false,
      }),
    );
    expect(evaluateFlag(snap, 'monetization.premium', {}, false).value).toBe(false);
  });
});
