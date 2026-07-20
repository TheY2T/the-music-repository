import type {
  InstrumentPreferences,
  StoredInstrumentPreferences,
} from '../../domain/instrument-preferences';

/**
 * UserPreferences (ADR 0012 — named for the domain capability) — persist a user's immersive-instrument
 * choices. Speaks in domain terms; the adapter owns the storage.
 */
export abstract class UserPreferences {
  /** The user's saved preferences, or `null` when they have never saved any. */
  abstract get(userId: string): Promise<StoredInstrumentPreferences | null>;
  /** Create or replace the user's preferences (idempotent upsert); returns the stored record. */
  abstract put(userId: string, prefs: InstrumentPreferences): Promise<StoredInstrumentPreferences>;
}
