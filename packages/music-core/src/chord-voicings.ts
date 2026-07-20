// Resolver over the imported real-world voicing library (fingerings + barres, from chords-db) with a
// generated-shape fallback. Kept separate from `chord-library` so the sizeable generated dataset only
// loads for the rich-voicing surfaces (the chord dictionary), not every chord embed.

import { type GenerateOptions, generateChordShapes, type Instrument } from './chord-library';
import type { ChordShape } from './chord-shapes';
import { IMPORTED_GUITAR_VOICINGS, IMPORTED_UKULELE_VOICINGS } from './chord-voicings.generated';

/** Imported real-world voicings for a chord (guitar/ukulele only); empty when none are catalogued. */
export function importedVoicingsFor(
  rootPc: number,
  quality: string,
  instrument: Instrument,
): ChordShape[] {
  const map =
    instrument === 'ukulele'
      ? IMPORTED_UKULELE_VOICINGS
      : instrument === 'guitar'
        ? IMPORTED_GUITAR_VOICINGS
        : null;
  if (!map) return [];
  const pc = (((rootPc % 12) + 12) % 12).toString();
  return map[`${pc}:${quality}`] ?? [];
}

/**
 * Every playable voicing for a chord: the catalogued real-world positions (with fingering + barres)
 * when available, else the generated movable shapes. Guitar + ukulele draw on the imported library;
 * bass and uncatalogued qualities fall through to the generator.
 */
export function voicingsFor(
  rootPc: number,
  quality: string,
  instrument: Instrument = 'guitar',
  opts: GenerateOptions = {},
): ChordShape[] {
  const imported = importedVoicingsFor(rootPc, quality, instrument);
  if (imported.length > 0) return imported;
  return generateChordShapes(rootPc, quality, instrument, opts);
}
