import { describe, expect, it } from 'vitest';
import en from './en.json';
import zhHans from './zh-Hans.json';

// en.json is the source of truth for keys. zh-Hans is a partial catalogue (missing keys fall back
// to English at runtime). These guards catch the two silent regressions that fallback would hide:
// orphan translations (a zh-Hans key that no longer matches any English key → dead string) and
// blank/whitespace values (render as empty UI).
describe('locale catalogues', () => {
  it('has no orphan zh-Hans keys (every translated key is a valid English key)', () => {
    const enKeys = new Set(Object.keys(en));
    const orphans = Object.keys(zhHans).filter((key) => !enKeys.has(key));
    expect(orphans).toEqual([]);
  });

  it('has non-empty string values in every catalogue', () => {
    for (const [key, value] of [...Object.entries(en), ...Object.entries(zhHans)]) {
      expect(typeof value, key).toBe('string');
      expect((value as string).trim().length, key).toBeGreaterThan(0);
    }
  });

  it('reports zh-Hans translation coverage (informational, non-failing)', () => {
    const total = Object.keys(en).length;
    const translated = Object.keys(en).filter((key) => key in zhHans).length;
    // Guard against a catalogue accidentally emptying out; real coverage grows via add-translations.
    expect(total).toBeGreaterThan(0);
    expect(translated).toBeGreaterThanOrEqual(0);
  });
});
