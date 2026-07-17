import { describe, expect, it } from 'vitest';
import { beatsToDuration, melodyToAlphaTex, tabToAlphaTex, toAlphaTexPitch } from './alphatex';

describe('beatsToDuration', () => {
  it('maps common quarter-beat values to duration + dot', () => {
    expect(beatsToDuration(4)).toEqual({ duration: 1, dotted: false }); // whole
    expect(beatsToDuration(3)).toEqual({ duration: 2, dotted: true }); // dotted half
    expect(beatsToDuration(2)).toEqual({ duration: 2, dotted: false }); // half
    expect(beatsToDuration(1.5)).toEqual({ duration: 4, dotted: true }); // dotted quarter
    expect(beatsToDuration(1)).toEqual({ duration: 4, dotted: false }); // quarter
    expect(beatsToDuration(0.5)).toEqual({ duration: 8, dotted: false }); // eighth
    expect(beatsToDuration(0.25)).toEqual({ duration: 16, dotted: false }); // 16th
  });
});

describe('toAlphaTexPitch', () => {
  it('lowercases the tone and keeps accidentals + octave', () => {
    expect(toAlphaTexPitch('C4')).toBe('c4');
    expect(toAlphaTexPitch('C#4')).toBe('c#4');
    expect(toAlphaTexPitch('Bb3')).toBe('bb3');
    expect(toAlphaTexPitch('F#5')).toBe('f#5');
  });
});

describe('melodyToAlphaTex', () => {
  it('emits pitched beats with durations, rests, and bar separators', () => {
    const tex = melodyToAlphaTex(
      [
        { name: 'E4', beats: 1 },
        { name: 'E4', beats: 1 },
        { name: 'F4', beats: 1 },
        { name: 'G4', beats: 1 },
        { name: null, beats: 2 }, // rest
        { name: 'C5', beats: 2 },
      ],
      { title: 'Ode', tempo: 96, key: 'c' },
    );
    expect(tex).toContain('\\title "Ode"');
    expect(tex).toContain('\\tempo 96');
    expect(tex).toContain('\\staff{score} \\tuning piano');
    expect(tex).toContain('e4.4');
    expect(tex).toContain('r.2'); // rest as a half note
    expect(tex).toContain('|'); // a bar break after 4 quarters
  });
});

describe('tabToAlphaTex', () => {
  it('emits fret.string with :duration prefix, effects, and a tuning', () => {
    const tex = tabToAlphaTex(
      [
        { string: 1, fret: 8 },
        { string: 1, fret: 5, hammerTo: 7 },
        { string: 2, fret: 3, beats: 2 },
      ],
      [64, 59, 55, 50, 45, 40],
    );
    expect(tex).toContain('\\staff{tabs score}');
    expect(tex).toContain('\\tuning (E4 B3 G3 D3 A2 E2)');
    expect(tex).toContain(':4 8.1');
    expect(tex).toContain('{h}'); // hammer-on
    expect(tex).toContain(':2 3.2'); // half-note on string 2
  });
});
