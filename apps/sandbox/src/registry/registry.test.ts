import { describe, expect, it } from 'vitest';
import {
  DOMAIN_META,
  DOMAIN_ORDER,
  getSpecimen,
  groupByDomain,
  groupByPackage,
  PACKAGE_META,
  PACKAGE_ORDER,
  specimens,
} from './index';

describe('specimen registry', () => {
  it('has a reasonably complete catalogue', () => {
    expect(specimens.length).toBeGreaterThan(100);
  });

  it('has unique ids', () => {
    const ids = specimens.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every specimen is renderable — it has a loader or an inspector', () => {
    for (const s of specimens) {
      expect(Boolean(s.load) || Boolean(s.inspector), `${s.id} needs load or inspector`).toBe(true);
    }
  });

  it('every specimen has a known package and at least one known domain', () => {
    for (const s of specimens) {
      expect(PACKAGE_ORDER).toContain(s.pkg);
      expect(s.domains.length).toBeGreaterThan(0);
      for (const d of s.domains) {
        expect(DOMAIN_ORDER, `${s.id} has unknown domain ${d}`).toContain(d);
      }
    }
  });

  it('every package + domain has a label', () => {
    for (const pkg of PACKAGE_ORDER) expect(PACKAGE_META[pkg]?.label).toBeTruthy();
    for (const domain of DOMAIN_ORDER) expect(DOMAIN_META[domain]).toBeTruthy();
  });

  it('control names are unique within a specimen', () => {
    for (const s of specimens) {
      const names = (s.controls ?? []).map((c) => c.name);
      expect(new Set(names).size, `${s.id} has duplicate control names`).toBe(names.length);
    }
  });

  it('getSpecimen resolves known ids and rejects unknown ones', () => {
    expect(getSpecimen('ui-button')?.name).toBe('Button');
    expect(getSpecimen('nope')).toBeUndefined();
  });
});

describe('grouping', () => {
  it('groups by package covering every specimen exactly once', () => {
    const groups = groupByPackage();
    const count = groups.reduce((n, g) => n + g.items.length, 0);
    expect(count).toBe(specimens.length);
  });

  it('groups by domain, and every specimen appears under at least one domain', () => {
    const groups = groupByDomain();
    const seen = new Set(groups.flatMap((g) => g.items.map((s) => s.id)));
    expect(seen.size).toBe(specimens.length);
  });
});
