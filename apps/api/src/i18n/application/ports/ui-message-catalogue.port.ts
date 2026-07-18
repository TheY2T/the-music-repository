import type { CatalogueSnapshot } from '../../domain/ui-message';

/**
 * UiMessageCatalogue (ADR 0012) — the read side of localization: assemble the published catalogue for a
 * locale and report per-locale versions. Named for the capability, no `Port` suffix.
 */
export abstract class UiMessageCatalogue {
  /** The published, non-deleted catalogue for `locale` (empty map + '0' version when nothing published). */
  abstract snapshot(locale: string): Promise<CatalogueSnapshot>;

  /** The current published version tag for every locale that has one. */
  abstract versions(): Promise<Record<string, string>>;
}
