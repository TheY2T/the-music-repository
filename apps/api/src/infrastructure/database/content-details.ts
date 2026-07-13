/**
 * Seed-side content types. The canonical `ContentDetails` lives in the catalogue domain
 * (`catalogue/domain/content-item.ts`); re-exported here so the schema, seed, and generated
 * `seed-content.ts` share one definition.
 */
export type { ContentDetails } from '../../catalogue/domain/content-item';

import type { ContentDetails } from '../../catalogue/domain/content-item';

/** One item's enriched content, applied by the seed on top of the base metadata in seed-data.ts. */
export interface SeedContentExtra {
  bodyMdx: string;
  details: ContentDetails;
  /** Suggested tag slugs; the seed attaches only those present in its TAGS vocabulary. */
  extraTags: string[];
}
