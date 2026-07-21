import { CHORDS, LEVELS, MODES, SCALES } from '@TheY2T/tmr-music-core/music-theory';
import { describe, expect, it } from 'vitest';

// The TheoryInspector renders these tables from the music-theory single source of truth. Its live
// rendering (Tabs/pagination) is exercised in e2e/sandbox.spec.ts — rendering music-core here trips the
// Vitest duplicate-React optimizer (see .claude/rules/testing.md), so this covers the data it surfaces.
describe('TheoryInspector data source', () => {
  it('exposes non-empty theory tables', () => {
    expect(SCALES.length).toBeGreaterThan(0);
    expect(CHORDS.length).toBeGreaterThan(0);
    expect(MODES.length).toBeGreaterThan(0);
  });

  it('includes the canonical major scale the inspector shows first', () => {
    expect(SCALES.some((s) => /Ionian|Major/.test(s.name))).toBe(true);
  });

  it('defines the difficulty levels rendered in the footer', () => {
    expect(LEVELS).toEqual(['beginner', 'intermediate', 'advanced', 'expert']);
  });
});
