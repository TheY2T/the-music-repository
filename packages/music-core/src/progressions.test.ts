import { describe, expect, it } from 'vitest';
import { PROGRESSION_TEMPLATES, realizeProgression } from './progressions';

describe('realizeProgression', () => {
  it('renders I–V–vi–IV in C major', () => {
    const tpl = PROGRESSION_TEMPLATES.find((t) => t.key === 'pop-axis')!;
    const chords = realizeProgression(0, tpl, false);
    expect(chords.map((c) => c.name)).toEqual(['C', 'G', 'Am', 'F']);
    expect(chords.map((c) => c.roman)).toEqual(['I', 'V', 'vi', 'IV']);
    expect(chords[0].pitchClasses).toEqual([0, 4, 7]); // C E G
  });

  it('renders ii–V–I with sevenths in C major', () => {
    const tpl = PROGRESSION_TEMPLATES.find((t) => t.key === 'jazz-251')!;
    const chords = realizeProgression(0, tpl, false);
    expect(chords.map((c) => c.name)).toEqual(['Dm7', 'G7', 'Cmaj7']);
    expect(chords[2].pitchClasses).toEqual([0, 4, 7, 11]); // Cmaj7
  });

  it('spells flat keys correctly (12-bar blues in F)', () => {
    const tpl = PROGRESSION_TEMPLATES.find((t) => t.key === 'blues-12bar')!;
    const chords = realizeProgression(5, tpl, true); // F
    expect(chords[0].name).toBe('F7'); // I7
    expect(chords[1].name).toBe('B♭7'); // IV7 = Bb7, flat-spelled
    expect(chords[8].name).toBe('C7'); // V7
  });

  it('every template renders every chord with valid pitch classes', () => {
    for (const tpl of PROGRESSION_TEMPLATES) {
      const chords = realizeProgression(7, tpl, false); // G major
      expect(chords.length).toBe(tpl.chords.length);
      for (const c of chords) {
        expect(c.pitchClasses.length).toBeGreaterThanOrEqual(3);
        expect(c.pitchClasses.every((pc) => pc >= 0 && pc < 12)).toBe(true);
      }
    }
  });
});
