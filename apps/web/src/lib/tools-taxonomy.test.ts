import { describe, expect, it } from 'vitest';
import { categoryOf, TOOL_CATEGORY_ORDER, TOOL_ICON, toolMatches } from './tools-taxonomy';

// The full set of tool slugs the /tools page lists (kept in sync with tools/index.astro).
const ALL_SLUGS = Object.keys(TOOL_ICON);

describe('categoryOf', () => {
  it('maps every known tool to one of the six categories', () => {
    for (const slug of ALL_SLUGS) {
      expect(TOOL_CATEGORY_ORDER).toContain(categoryOf(slug));
    }
  });

  it('spreads tools across all six categories (no empty groups)', () => {
    const used = new Set(ALL_SLUGS.map(categoryOf));
    for (const cat of TOOL_CATEGORY_ORDER) {
      expect(used).toContain(cat);
    }
  });

  it('classifies representative tools correctly', () => {
    expect(categoryOf('keyboard')).toBe('keyboard-fretboard');
    expect(categoryOf('circle-of-fifths')).toBe('theory-harmony');
    expect(categoryOf('ear-trainer')).toBe('ear-quizzes');
    expect(categoryOf('metronome')).toBe('rhythm-time');
    expect(categoryOf('score')).toBe('reading-notation');
    expect(categoryOf('backing-track')).toBe('play-practice');
  });

  it('falls back to play-practice for an unknown slug', () => {
    expect(categoryOf('some-brand-new-tool')).toBe('play-practice');
  });
});

describe('toolMatches', () => {
  it('matches on title or summary, case-insensitively', () => {
    expect(toolMatches('METRO', 'Metronome', 'Keep time')).toBe(true);
    expect(toolMatches('time', 'Metronome', 'Keep time')).toBe(true);
    expect(toolMatches('guitar', 'Metronome', 'Keep time')).toBe(false);
  });

  it('treats an empty/whitespace query as matching everything', () => {
    expect(toolMatches('', 'Anything', 'Whatever')).toBe(true);
    expect(toolMatches('   ', 'Anything', 'Whatever')).toBe(true);
  });
});
