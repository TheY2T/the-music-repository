/** Guitar orientation. `left` mirrors the fretboard + chord diagrams horizontally. */
export type Handedness = 'left' | 'right';

/** A user's immersive-instrument choices (domain entity — framework-free). */
export interface InstrumentPreferences {
  handedness: Handedness;
  /** Chosen piano skin id (governed by the web keyboard skin registry). */
  keyboardSkin: string;
  /** Chosen guitar/fretboard skin id (governed by the web fretboard skin registry). */
  fretboardSkin: string;
  /** Whether the tools open in fullscreen by default. */
  fullscreen: boolean;
}

/** A stored preferences record with its last-updated time. */
export interface StoredInstrumentPreferences extends InstrumentPreferences {
  updatedAt: Date;
}

/** The values a user starts with: right-handed, the token-themed default skin, windowed. */
export const DEFAULT_INSTRUMENT_PREFERENCES: InstrumentPreferences = {
  handedness: 'right',
  keyboardSkin: 'theme',
  fretboardSkin: 'theme',
  fullscreen: false,
};
