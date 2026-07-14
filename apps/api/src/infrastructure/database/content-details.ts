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

/** Discovery facets carried by a collection — canonical definition in the collections domain. */
export type { CollectionFacets } from '../../collections/domain/collection';

import type { CollectionFacets } from '../../collections/domain/collection';

/** One authored item within a collection section (from `content/collections/*.md`). */
export interface SeedCollectionItem {
  contentSlug: string;
  curatorNote: string | null;
  focusSkills: string[];
}

/** One chapter within a collection. */
export interface SeedCollectionSection {
  title: string;
  description: string | null;
  items: SeedCollectionItem[];
}

/**
 * Provenance + licensing for one engraved score (the `<slug>.meta.json` sidecar next to its
 * `<slug>.musicxml`). Recorded on the `musicxml` media asset by the seed so the UI can show an
 * engraving credit and we keep an auditable licensing trail. `origin` says how we obtained it:
 * `openscore` (CC0 MusicXML), `kern` (CCARH/KernScores encoding), or `hand-authored` (by us).
 */
export interface ScoreMeta {
  origin: 'openscore' | 'kern' | 'hand-authored';
  /** Human-readable source name, e.g. "OpenScore" or "The Music Repository". */
  source: string;
  /** URL of the source edition/reference (may be the transcription reference for hand-authored). */
  sourceUrl: string | null;
  /** SPDX-ish license label, e.g. "CC0", "CC BY-SA 4.0", "Public Domain". */
  license: string;
  /** Attribution line, e.g. "OpenScore (musescore.com/openscore)". */
  attribution: string;
}

/** A fully-authored collection, built from Markdown and applied by the seed. */
export interface SeedCollectionDoc {
  slug: string;
  title: string;
  kind: string;
  summary: string | null;
  bodyMdx: string | null;
  curatorName: string | null;
  curatorBio: string | null;
  featured: boolean;
  difficultyMin: number | null;
  difficultyMax: number | null;
  estMinutes: number | null;
  accent: string | null;
  tags: string[];
  facets: CollectionFacets;
  outcomes: string[];
  sections: SeedCollectionSection[];
}
