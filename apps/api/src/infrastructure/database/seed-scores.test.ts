import { describe, expect, it } from 'vitest';
import * as seedData from './seed-data';
import { SCORE_ALPHATEX, SCORE_META } from './seed-scores';

const VALID_ORIGINS = new Set(['openscore', 'kern', 'hand-authored']);

describe('seed-scores', () => {
  const slugs = Object.keys(SCORE_ALPHATEX);

  it('ships at least the migrated + deterministic scores', () => {
    expect(slugs.length).toBeGreaterThanOrEqual(4);
  });

  it.each(slugs)('%s is a non-empty alphaTex document with a track', (slug) => {
    const tex = SCORE_ALPHATEX[slug];
    expect(tex).toBeTruthy();
    expect(tex).toContain('\\track');
  });

  it.each(slugs)('%s has valid, license-clean provenance meta', (slug) => {
    const meta = SCORE_META[slug];
    if (!meta) throw new Error(`missing meta for ${slug}`);
    expect(VALID_ORIGINS.has(meta.origin)).toBe(true);
    expect(meta.source.length).toBeGreaterThan(0);
    expect(meta.license.length).toBeGreaterThan(0);
    expect(meta.attribution.length).toBeGreaterThan(0);
  });

  it('has no orphan meta entries', () => {
    for (const slug of Object.keys(SCORE_META)) {
      expect(SCORE_ALPHATEX[slug], `meta without score: ${slug}`).toBeDefined();
    }
  });

  it('scores are keyed to real catalogue slugs', () => {
    const contentSlugs = new Set(seedData.CONTENT.map((c) => c.slug));
    for (const slug of slugs) {
      expect(contentSlugs.has(slug), `score ${slug} has no content item`).toBe(true);
    }
  });
});

describe('placeholder-PDF removal (regression guard)', () => {
  it('no longer exports makeMinimalPdf', () => {
    expect('makeMinimalPdf' in seedData).toBe(false);
  });

  it('no content item carries the obsolete withPdf flag', () => {
    for (const item of seedData.CONTENT) {
      expect('withPdf' in item).toBe(false);
    }
  });
});
