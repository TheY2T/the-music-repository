import { describe, expect, it } from 'vitest';
import {
  bassStaffNotes,
  CHORDS,
  chordsByLevel,
  diatonicChordsMinor,
  intervalLabel,
  isWithinLevel,
  midiToFrequency,
  pitchName,
  SCALES,
  scalePitchClasses,
  scalesByLevel,
  trebleStaffNotes,
} from './music-theory';

describe('pitchName', () => {
  it('names sharps by default and flats when asked', () => {
    expect(pitchName(0)).toBe('C');
    expect(pitchName(1)).toBe('C♯');
    expect(pitchName(1, true)).toBe('D♭');
  });

  it('wraps pitch classes into 0–11 (negative and >11)', () => {
    expect(pitchName(12)).toBe('C');
    expect(pitchName(-1)).toBe('B');
    expect(pitchName(13)).toBe('C♯');
  });
});

describe('midiToFrequency', () => {
  it('anchors A4 (MIDI 69) at 440 Hz', () => {
    expect(midiToFrequency(69)).toBeCloseTo(440, 6);
  });

  it('halves an octave down and doubles an octave up', () => {
    expect(midiToFrequency(57)).toBeCloseTo(220, 6);
    expect(midiToFrequency(81)).toBeCloseTo(880, 6);
  });
});

describe('scalePitchClasses', () => {
  it('builds a C major scale (root 0)', () => {
    const pcs = scalePitchClasses(0, [0, 2, 4, 5, 7, 9, 11]);
    expect([...pcs].sort((a, b) => a - b)).toEqual([0, 2, 4, 5, 7, 9, 11]);
  });

  it('wraps around the octave for a D major scale (root 2)', () => {
    const pcs = scalePitchClasses(2, [0, 2, 4, 5, 7, 9, 11]);
    expect(pcs.has(1)).toBe(true); // C♯
    expect(pcs.has(6)).toBe(true); // F♯
    expect(pcs.has(0)).toBe(false);
  });
});

describe('SCALES / CHORDS tables', () => {
  it('includes the expanded scale vocabulary', () => {
    const keys = SCALES.map((s) => s.key);
    for (const key of [
      'melodic-minor',
      'lydian',
      'whole-tone',
      'diminished-hw',
      'bebop-dominant',
    ]) {
      expect(keys).toContain(key);
    }
    const wholeTone = SCALES.find((s) => s.key === 'whole-tone');
    expect(wholeTone?.intervals).toEqual([0, 2, 4, 6, 8, 10]);
  });

  it('includes the expanded chord vocabulary with unique symbols', () => {
    const keys = CHORDS.map((c) => c.key);
    for (const key of ['half-diminished', 'sixth', 'dominant-9', 'add9', 'dominant-13']) {
      expect(keys).toContain(key);
    }
    const symbols = CHORDS.flatMap((c) => [c.symbol, ...(c.aliases ?? [])]);
    expect(new Set(symbols).size).toBe(symbols.length); // no suffix collisions
  });

  it('tags every scale and chord with a level', () => {
    expect(SCALES.every((s) => s.level)).toBe(true);
    expect(CHORDS.every((c) => c.level)).toBe(true);
  });
});

describe('level filters', () => {
  it('orders levels low → high', () => {
    expect(isWithinLevel('beginner', 'expert')).toBe(true);
    expect(isWithinLevel('expert', 'beginner')).toBe(false);
    expect(isWithinLevel('intermediate', 'intermediate')).toBe(true);
  });

  it('narrows scales/chords to a level ceiling', () => {
    const beginnerScales = scalesByLevel('beginner');
    expect(beginnerScales.every((s) => s.level === 'beginner')).toBe(true);
    expect(scalesByLevel('expert').length).toBe(SCALES.length);

    const intermediate = chordsByLevel('intermediate');
    expect(intermediate.map((c) => c.key)).not.toContain('dominant-13'); // expert
    expect(intermediate.map((c) => c.key)).toContain('major-7');
  });
});

describe('intervalLabel', () => {
  it('labels intervals within an octave', () => {
    expect(intervalLabel(0)).toBe('R');
    expect(intervalLabel(4)).toBe('3');
    expect(intervalLabel(10)).toBe('♭7');
  });

  it('reads compound tensions as 9/11/13', () => {
    expect(intervalLabel(14)).toBe('9');
    expect(intervalLabel(17)).toBe('11');
    expect(intervalLabel(21)).toBe('13');
    expect(intervalLabel(13)).toBe('♭9');
  });
});

describe('staff notes', () => {
  it('places the treble bottom line at E4 (step 0) and middle C below', () => {
    const notes = trebleStaffNotes();
    expect(notes.find((n) => n.name === 'E4')?.step).toBe(0);
    expect(notes.find((n) => n.name === 'C4')?.step).toBe(-2); // one ledger below
    expect(notes.at(-1)).toMatchObject({ name: 'C6', midi: 84 });
  });

  it('places the bass bottom line at G2 (step 0) and middle C above', () => {
    const notes = bassStaffNotes();
    expect(notes.find((n) => n.name === 'G2')?.step).toBe(0);
    expect(notes.find((n) => n.name === 'A3')?.step).toBe(8); // top line
    expect(notes.find((n) => n.name === 'C4')).toMatchObject({ midi: 60, step: 10 });
  });
});

describe('diatonicChordsMinor', () => {
  it('builds the natural-minor triads of A minor (root 9)', () => {
    const chords = diatonicChordsMinor(9, false);
    expect(chords.map((c) => c.roman)).toEqual(['i', 'ii°', '♭III', 'iv', 'v', '♭VI', '♭VII']);
    expect(chords.map((c) => c.name)).toEqual(['Am', 'B°', 'C', 'Dm', 'Em', 'F', 'G']);
    expect(chords[0].pitchClasses).toEqual([9, 0, 4]); // A C E
  });
});
