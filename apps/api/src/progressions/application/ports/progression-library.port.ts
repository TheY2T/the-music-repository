import type { ProgressionChord, SavedProgression } from '../../domain/saved-progression';

/**
 * ProgressionLibrary (ADR 0012 — named for the domain capability) — persist a user's named chord
 * progressions. Speaks in domain terms; the adapter owns the storage.
 */
export abstract class ProgressionLibrary {
  /** The user's saved progressions, most-recently-updated first. */
  abstract list(userId: string): Promise<SavedProgression[]>;
  /** Create or replace a progression by name (idempotent upsert). */
  abstract save(
    userId: string,
    name: string,
    keyRoot: number,
    chords: ProgressionChord[],
  ): Promise<void>;
  abstract remove(userId: string, name: string): Promise<void>;
}
