import type { TranslationOverlay } from '../../domain/entity-translation';

/**
 * ContentTranslations (ADR 0012) — the read side of content translations: fetch the published,
 * non-deleted field→value overlay for an entity in a locale. Injected by the catalogue/collections/help
 * read use-cases to overlay translated fields over the base row (missing field → base). Named for the
 * capability, no `Port` suffix.
 */
export abstract class ContentTranslations {
  /** Published overlay for one entity (empty map when none / base locale). */
  abstract overlay(
    entityType: string,
    entityId: string,
    locale: string,
  ): Promise<TranslationOverlay>;

  /** Published overlays for many entities in one query, keyed by entityId (for lists/related). */
  abstract overlayMany(
    entityType: string,
    entityIds: string[],
    locale: string,
  ): Promise<Map<string, TranslationOverlay>>;
}
