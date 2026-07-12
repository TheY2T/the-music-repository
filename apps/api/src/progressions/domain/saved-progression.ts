/** A single chord in a saved progression: root pitch-class (0–11) + quality key. */
export interface ProgressionChord {
  root: number;
  quality: string;
}

/** A user's saved chord progression (domain entity — framework-free). */
export interface SavedProgression {
  name: string;
  keyRoot: number;
  chords: ProgressionChord[];
  updatedAt: Date;
}
