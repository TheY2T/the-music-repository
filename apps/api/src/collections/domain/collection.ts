import type { ContentSummaryView } from '../../catalogue/domain/content-item';

/** A collection aggregate: metadata + its ordered content slugs (POJO, no framework/db imports). */
export interface Collection {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  kind: string; // course | path | syllabus | songlist
  visibility: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  itemSlugs: string[]; // ordered
}

export interface CollectionWriteData {
  slug: string;
  title: string;
  summary?: string | null;
  kind: string;
  visibility?: string;
}

// --- Read models (match the API contract shapes) ---
export interface CollectionSummaryView {
  slug: string;
  title: string;
  summary?: string;
  kind: string;
  visibility: string;
  itemCount: number;
}

export interface CollectionEntryView {
  position: number;
  content: ContentSummaryView;
}

export interface CollectionDetailView extends CollectionSummaryView {
  status: string;
  items: CollectionEntryView[];
}

export function toCollectionSummaryView(collection: Collection): CollectionSummaryView {
  return {
    slug: collection.slug,
    title: collection.title,
    summary: collection.summary ?? undefined,
    kind: collection.kind,
    visibility: collection.visibility,
    itemCount: collection.itemSlugs.length,
  };
}
