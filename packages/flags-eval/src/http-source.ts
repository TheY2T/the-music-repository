import type { SnapshotSource } from './provider';
import type { FlagSnapshot } from './snapshot';

/**
 * The web SSR snapshot source for {@link TmrFlagProvider}: fetches the environment snapshot from the API's
 * public `GET /feature-flags/snapshot/:env` endpoint and caches it in-process, revalidating with a
 * conditional GET (ETag → 304) so an unchanged snapshot is a cheap round-trip. On any error it serves the
 * last-known snapshot (or `null`, letting the provider fall back to code defaults) rather than failing SSR.
 */
export class HttpSnapshotSource implements SnapshotSource {
  private cached: FlagSnapshot | null = null;
  private etag: string | null = null;

  /** @param snapshotUrl fully-qualified URL, e.g. `http://api:3000/feature-flags/snapshot/dev`. */
  constructor(private readonly snapshotUrl: string) {}

  async getSnapshot(): Promise<FlagSnapshot | null> {
    try {
      const response = await fetch(this.snapshotUrl, {
        headers: this.etag ? { 'if-none-match': this.etag } : {},
      });
      if (response.status === 304) {
        return this.cached;
      }
      if (!response.ok) {
        return this.cached; // stale-if-error
      }
      this.etag = response.headers.get('etag');
      this.cached = (await response.json()) as FlagSnapshot;
      return this.cached;
    } catch {
      return this.cached; // network error → last known snapshot (or null ⇒ code defaults)
    }
  }
}
