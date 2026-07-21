import type { DashboardSpacesData, StoredDashboardSpaces } from '../../domain/dashboard-space';

/**
 * DashboardSpaces (ADR 0012 — named for the domain capability) — persist a user's collection of
 * customizable practice spaces. Speaks in domain terms; the adapter owns the storage.
 */
export abstract class DashboardSpaces {
  /** The user's saved spaces, or `null` when they have never saved any. */
  abstract get(userId: string): Promise<StoredDashboardSpaces | null>;
  /** Create or replace the user's spaces (idempotent upsert); returns the stored record. */
  abstract put(userId: string, data: DashboardSpacesData): Promise<StoredDashboardSpaces>;
}
