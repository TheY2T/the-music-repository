import { describe, expect, it } from 'vitest';
import { fretboardNoteDeck } from './fretboard-note';

describe('fretboard-note deck', () => {
  it('is a play-instrument drill keyed by the seven natural pitch classes', () => {
    expect(fretboardNoteDeck.modality).toBe('play-instrument');
    expect(fretboardNoteDeck.cards).toEqual(['0', '2', '4', '5', '7', '9', '11']);
  });

  it('names the target note in a localized instruction and expects its pitch class', () => {
    const item = fretboardNoteDeck.generate('9', 'beginner', Math.random); // A
    expect(item.instrument).toBe('fretboard');
    expect(item.expected).toBe('9');
    expect(item.answerLabel).toBe('A');
    expect(item.instruction).toEqual({ key: 'drill.playNoteOnFretboard', params: { note: 'A' } });
  });

  it('accepts any fret of the target pitch class, rejects others', () => {
    const item = fretboardNoteDeck.generate('7', 'beginner', Math.random); // G
    expect(fretboardNoteDeck.check(item, '7').correct).toBe(true); // G2 open
    expect(fretboardNoteDeck.check(item, '19').correct).toBe(true); // G3 (19 % 12 = 7)
    expect(fretboardNoteDeck.check(item, '8').correct).toBe(false);
  });
});
