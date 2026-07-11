/** Catalogue domain — pure POJOs/interfaces, no framework or DB imports. */

export interface TaxonomyRef {
  slug: string;
  name: string;
}

export interface MediaAssetMeta {
  id: string;
  kind: string;
  storageKey: string;
  filename: string;
  mime: string;
  license?: string | null;
  attribution?: string | null;
}

export interface ContentItem {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  bodyMdx: string | null;
  type: string;
  visibility: string;
  status: string;
  difficulty: number | null;
  source: string | null;
  attribution: string | null;
  license: string | null;
  createdAt: Date;
  updatedAt: Date;
  genres: TaxonomyRef[];
  instruments: TaxonomyRef[];
  topics: TaxonomyRef[];
  tags: TaxonomyRef[];
  media: MediaAssetMeta[];
}

// --- Read models (match the API contract shapes) ---
export interface ContentSummaryView {
  slug: string;
  title: string;
  summary?: string;
  type: string;
  difficulty?: number;
  visibility: string;
  genres: TaxonomyRef[];
  instruments: TaxonomyRef[];
  topics: TaxonomyRef[];
}

export interface MediaView {
  id: string;
  kind: string;
  url: string;
  filename: string;
  mime: string;
  license?: string;
  attribution?: string;
}

export interface ContentDetailView extends ContentSummaryView {
  bodyMdx?: string;
  source?: string;
  attribution?: string;
  license?: string;
  tags: TaxonomyRef[];
  media: MediaView[];
  createdAt: string;
  updatedAt: string;
}

export interface CatalogueQuery {
  q?: string;
  genres: string[];
  instruments: string[];
  topics: string[];
  type?: string;
  difficulty?: number;
  page: number;
  pageSize: number;
}

export interface FacetValue {
  value: string;
  label: string;
  count: number;
}

export interface Facets {
  genres: FacetValue[];
  instruments: FacetValue[];
  topics: FacetValue[];
  types: FacetValue[];
  difficulties: FacetValue[];
}

export interface CatalogueResult {
  items: ContentSummaryView[];
  facets: Facets;
  total: number;
  page: number;
  pageSize: number;
}

/** `pop-rock` → `Pop rock`. Used for facet labels (no name lookup needed). */
export function slugToLabel(slug: string): string {
  const text = slug.replace(/[-_]/g, ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Project a hydrated {@link ContentItem} into the list/card summary shape. */
export function toContentSummaryView(item: ContentItem): ContentSummaryView {
  return {
    slug: item.slug,
    title: item.title,
    summary: item.summary ?? undefined,
    type: item.type,
    difficulty: item.difficulty ?? undefined,
    visibility: item.visibility,
    genres: item.genres,
    instruments: item.instruments,
    topics: item.topics,
  };
}

/** Map a hydrated {@link ContentItem} + presigned media into the API detail shape. Shared by the
 * catalogue read path and the authoring CMS so both emit an identical `ContentDetail`. */
export function toContentDetailView(item: ContentItem, media: MediaView[]): ContentDetailView {
  return {
    slug: item.slug,
    title: item.title,
    summary: item.summary ?? undefined,
    type: item.type,
    difficulty: item.difficulty ?? undefined,
    visibility: item.visibility,
    genres: item.genres,
    instruments: item.instruments,
    topics: item.topics,
    bodyMdx: item.bodyMdx ?? undefined,
    source: item.source ?? undefined,
    attribution: item.attribution ?? undefined,
    license: item.license ?? undefined,
    tags: item.tags,
    media,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}
