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
  status: string;
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
