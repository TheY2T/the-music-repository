import { describe, expect, it } from 'vitest';
import { chordsByLevel, INTERVAL_NAMES, trebleStaffNotes } from '../../music-theory';
import { DRILL_GENERATORS, findGenerator } from './index';

/** Deterministic RNG (mulberry32) so generated items are reproducible in tests. */
function seeded(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('drill deck registry', () => {
  it('keeps the four original decks first (stable keys, SM-2 continuity) + engine additions', () => {
    expect(DRILL_GENERATORS.map((g) => g.deck)).toEqual([
      'intervals',
      'chord-quality',
      'scale-degrees',
      'staff-notes',
      'build-interval',
      'fretboard-note',
      'progression-ear',
      'cadence-ear',
    ]);
  });

  it('keeps card universes identical to the legacy decks', () => {
    expect(findGenerator('intervals')?.cards).toEqual(
      INTERVAL_NAMES.map((_, semitones) => String(semitones)),
    );
    expect(findGenerator('chord-quality')?.cards).toEqual(
      chordsByLevel('intermediate').map((c) => c.key),
    );
    expect(findGenerator('scale-degrees')?.cards).toEqual(['0', '2', '4', '5', '7', '9', '11']);
    expect(findGenerator('staff-notes')?.cards).toEqual(trebleStaffNotes().map((n) => n.name));
  });
});

describe('each generator: generate + check round-trip', () => {
  for (const gen of DRILL_GENERATORS) {
    it(`${gen.deck} scores the expected answer correct and a wrong answer incorrect`, () => {
      const rng = seeded(42);
      for (const card of gen.cards) {
        const item = gen.generate(card, 'beginner', rng);
        expect(item.card).toBe(card);
        expect(gen.check(item, item.expected).correct).toBe(true);
        expect(gen.check(item, item.expected).accuracy).toBe(1);

        // Option decks reveal a choice grid; play-instrument decks are checked directly.
        let wrong: string;
        if (item.options) {
          expect(item.options.length).toBeGreaterThan(1);
          expect(item.options.some((o) => o.value === item.expected)).toBe(true);
          wrong = item.options.find((o) => o.value !== item.expected)?.value ?? '__none__';
        } else {
          wrong = String((Number(item.expected) + 1) % 12);
        }
        expect(gen.check(item, wrong).correct).toBe(false);
        expect(gen.check(item, wrong).accuracy).toBe(0);
      }
    });
  }
});

describe('intervals generator', () => {
  it('plays two notes a card-many semitones apart from a shared root', () => {
    const item = findGenerator('intervals')?.generate('7', 'beginner', seeded(1));
    expect(item?.presentation.kind).toBe('audio');
    if (item?.presentation.kind === 'audio') {
      const [a, b] = item.presentation.notes;
      expect(b.midi - a.midi).toBe(7);
      expect(a.atMs).toBe(0);
      expect(b.atMs).toBeGreaterThan(0);
    }
    expect(item?.expected).toBe(INTERVAL_NAMES[7]);
  });
});

describe('staff-notes generator', () => {
  it('presents the note on the treble staff with a 4-option choice', () => {
    const note = trebleStaffNotes()[0];
    const item = findGenerator('staff-notes')?.generate(note.name, 'beginner', seeded(3));
    expect(item?.presentation).toEqual({ kind: 'staff', clef: 'treble', step: note.step });
    expect(item?.options).toHaveLength(4);
    expect(item?.modality).toBe('multiple-choice');
  });
});
