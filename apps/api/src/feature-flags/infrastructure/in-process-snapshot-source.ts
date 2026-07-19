import type { FlagSnapshot, SnapshotSource } from '@TheY2T/tmr-flags-eval';
import type { FeatureFlagCatalogue } from '../application/ports/feature-flag-catalogue.port';

/**
 * The API's snapshot source for {@link TmrFlagProvider}: reads the current environment's snapshot straight
 * from the DB via the {@link FeatureFlagCatalogue} read port (no network hop — the API owns the database).
 * The catalogue caches by version tag, so this stays a cheap per-evaluation call.
 */
export class InProcessSnapshotSource implements SnapshotSource {
  constructor(
    private readonly catalogue: FeatureFlagCatalogue,
    private readonly environmentKey: string,
  ) {}

  getSnapshot(): Promise<FlagSnapshot | null> {
    return this.catalogue.snapshot(this.environmentKey);
  }
}
