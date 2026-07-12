import { describe, expect, it } from 'vitest';
import { FlagDefaults, type FlagKey, FlagKeys } from './index';

describe('FlagKeys registry', () => {
  const keys = Object.values(FlagKeys);

  it('follows the <domain>.<capability> naming convention', () => {
    for (const key of keys) {
      expect(key, key).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*\.[a-z0-9]+(?:-[a-z0-9]+)*$/);
    }
  });

  it('has no duplicate flag keys', () => {
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe('FlagDefaults', () => {
  it('declares a boolean default for every registered flag key', () => {
    for (const key of Object.values(FlagKeys)) {
      expect(FlagDefaults[key as FlagKey], key).toBeTypeOf('boolean');
    }
  });

  it('has no defaults for keys outside the registry', () => {
    const registered = new Set(Object.values(FlagKeys));
    for (const key of Object.keys(FlagDefaults)) {
      expect(registered.has(key as FlagKey), key).toBe(true);
    }
  });
});
