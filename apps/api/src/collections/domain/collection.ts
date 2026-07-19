import type { ContentSummaryView } from '../../catalogue/domain/content-item';

/** Discovery facets carried by a collection (mirrored into the Meili collections index). */
export interface CollectionFacets {
  era?: string[];
  genre?: string[];
  technique?: string[];
  mood?: string[];
  instrument?: string[];
}

/** A chapter within a collection: an ordered group of items. */
export interface CollectionSection {
  id: string;
  title: string;
  description: string | null;
  position: number;
  itemSlugs: string[]; // ordered within the section
}

/** Per-membership annotations, in flattened (section-ordered) order. */
export interface CollectionItemMeta {
  contentSlug: string;
  sectionId: string | null;
  curatorNote: string | null;
  focusSkills: string[] | null;
}

/**
 * A collection aggregate: rich metadata + chaptered structure (POJO, no framework/db imports).
 * `itemSlugs` is the flattened, section-ordered list — the load-bearing contract the progress
 * module reads (`GetProgressSummaryUseCase`); do not remove it.
 */
export interface Collection {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  bodyMdx: string | null;
  kind: string; // course | path | syllabus | songlist
  visibility: string; // public | authed | private
  status: string; // draft | published
  curationType: string; // editorial | user
  ownerId: string | null; // null for editorial
  heroImageKey: string | null;
  accent: string | null;
  featured: boolean;
  difficultyMin: number | null;
  difficultyMax: number | null;
  estMinutes: number | null;
  curatorName: string | null;
  curatorBio: string | null;
  outcomes: string[] | null;
  facets: CollectionFacets | null;
  tags: string[] | null;
  popularity: number;
  createdAt: Date;
  updatedAt: Date;
  itemSlugs: string[]; // flattened, section-ordered (progress contract)
  sections: CollectionSection[];
  items: CollectionItemMeta[]; // flattened, section-ordered
}

/**
 * Overlay published per-locale translations onto a collection's text fields (ADR 0034).
 * `overlay` is a field→value map:
 * - top-level: `title` / `summary` / `bodyMdx` / `curatorBio`
 * - `section.<id>.title` / `section.<id>.description` for each section
 * - `outcome.<index>` for each "what you'll learn" line
 * - `item.<contentSlug>.curatorNote` for each item's curator note
 * Absent fields keep their base (English) value. Returns a new collection; a no-op for an empty overlay.
 */
export function applyCollectionOverlay(
  collection: Collection,
  overlay: Record<string, string>,
): Collection {
  const keys = Object.keys(overlay);
  if (keys.length === 0) {
    return collection;
  }
  const next: Collection = { ...collection };
  if (overlay.title !== undefined) {
    next.title = overlay.title;
  }
  if (overlay.summary !== undefined) {
    next.summary = overlay.summary;
  }
  if (overlay.bodyMdx !== undefined) {
    next.bodyMdx = overlay.bodyMdx;
  }
  if (overlay.curatorBio !== undefined) {
    next.curatorBio = overlay.curatorBio;
  }
  const touchesSections = next.sections.some(
    (s) =>
      overlay[`section.${s.id}.title`] !== undefined ||
      overlay[`section.${s.id}.description`] !== undefined,
  );
  if (touchesSections) {
    next.sections = next.sections.map((s) => ({
      ...s,
      title: overlay[`section.${s.id}.title`] ?? s.title,
      description: overlay[`section.${s.id}.description`] ?? s.description,
    }));
  }
  if (next.outcomes && keys.some((k) => k.startsWith('outcome.'))) {
    next.outcomes = next.outcomes.map((line, i) => overlay[`outcome.${i}`] ?? line);
  }
  if (keys.some((k) => k.startsWith('item.'))) {
    next.items = next.items.map((item) => {
      const value = overlay[`item.${item.contentSlug}.curatorNote`];
      return value !== undefined ? { ...item, curatorNote: value } : item;
    });
  }
  return next;
}

export interface CollectionWriteData {
  slug: string;
  title: string;
  summary?: string | null;
  bodyMdx?: string | null;
  kind: string;
  visibility?: string;
  curationType?: string;
  ownerId?: string | null;
  heroImageKey?: string | null;
  accent?: string | null;
  featured?: boolean;
  difficultyMin?: number | null;
  difficultyMax?: number | null;
  estMinutes?: number | null;
  curatorName?: string | null;
  curatorBio?: string | null;
  outcomes?: string[] | null;
  facets?: CollectionFacets | null;
  tags?: string[] | null;
}

export interface CollectionSectionWriteData {
  title: string;
  description?: string | null;
}

export interface CollectionItemWriteData {
  contentSlug: string;
  /** 0-based index into the collection's ordered sections; null/undefined = ungrouped. */
  sectionIndex?: number | null;
  curatorNote?: string | null;
  focusSkills?: string[] | null;
}

/** Aggregate rating for a collection (avg over 1..5, plus count). */
export interface CollectionRatingAggregate {
  average: number | null;
  count: number;
}

// --- Read models (match the API contract shapes) ---
export interface CollectionSummaryView {
  slug: string;
  title: string;
  summary?: string;
  kind: string;
  visibility: string;
  status: string;
  curationType: string;
  itemCount: number;
  featured: boolean;
  difficultyMin?: number;
  difficultyMax?: number;
  estMinutes?: number;
  curatorName?: string;
  heroImageKey?: string;
  accent?: string;
  tags?: string[];
  facets?: CollectionFacets;
  popularity: number;
  averageRating?: number;
  ratingCount: number;
}

export interface CollectionEntryView {
  position: number;
  content: ContentSummaryView;
  sectionId?: string;
  curatorNote?: string;
  focusSkills?: string[];
  completed?: boolean;
}

export interface CollectionSectionView {
  id: string;
  title: string;
  description?: string;
  position: number;
  items: CollectionEntryView[];
}

export interface CollectionDetailView extends CollectionSummaryView {
  /** Internal id — used by the translations admin to key per-locale translations. */
  id: string;
  ownerId?: string;
  bodyMdx?: string;
  outcomes?: string[];
  curatorBio?: string;
  items: CollectionEntryView[]; // flattened (backward compatible)
  sections: CollectionSectionView[];
}

export interface CollectionProgressDetailView extends CollectionDetailView {
  percentComplete: number;
  completedCount: number;
  nextUpSlug: string | null;
}

export function toCollectionSummaryView(
  collection: Collection,
  rating?: CollectionRatingAggregate,
): CollectionSummaryView {
  return {
    slug: collection.slug,
    title: collection.title,
    summary: collection.summary ?? undefined,
    kind: collection.kind,
    visibility: collection.visibility,
    status: collection.status,
    curationType: collection.curationType,
    itemCount: collection.itemSlugs.length,
    featured: collection.featured,
    difficultyMin: collection.difficultyMin ?? undefined,
    difficultyMax: collection.difficultyMax ?? undefined,
    estMinutes: collection.estMinutes ?? undefined,
    curatorName: collection.curatorName ?? undefined,
    heroImageKey: collection.heroImageKey ?? undefined,
    accent: collection.accent ?? undefined,
    tags: collection.tags ?? undefined,
    facets: collection.facets ?? undefined,
    popularity: collection.popularity,
    averageRating: rating?.average ?? undefined,
    ratingCount: rating?.count ?? 0,
  };
}
