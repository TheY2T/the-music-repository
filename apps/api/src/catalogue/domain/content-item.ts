/** Catalogue domain — pure POJOs/interfaces, no framework or DB imports. */

/**
 * Premium tiers, ordered by rank (higher unlocks lower): `premium` < `pro` < `institution`. A `pro`
 * entitlement unlocks `premium` + `pro` content; `institution` unlocks everything. Null tier on a
 * premium item == `premium`. Non-gating access (staff / flag off) uses rank `Infinity`.
 */
export const TIER_RANK: Record<string, number> = { premium: 1, pro: 2, institution: 3 };

/** Rank of a content tier (default `premium` when unset). */
export function tierRank(tier: string | null | undefined): number {
  return tier ? (TIER_RANK[tier] ?? 1) : 1;
}

/** Highest rank among a user's entitlement keys (0 = none). */
export function entitledRank(keys: string[]): number {
  return keys.reduce((max, key) => Math.max(max, TIER_RANK[key] ?? 0), 0);
}

export interface TaxonomyRef {
  slug: string;
  name: string;
}

/**
 * A preconfigured interactive tool embedded in a catalogue article (rendered below the prose). Flat
 * shape (a `tool` discriminator + optional per-tool config) mirroring the `ContentEmbed` contract model;
 * authored in the content Markdown's `embeds` block, stored in `details` JSONB, served on the detail view.
 */
export interface ContentEmbed {
  tool:
    | 'score'
    | 'keyboard'
    | 'scale-boxes'
    | 'chord-diagrams'
    | 'progression'
    | 'circle-of-fifths'
    | 'strum'
    | 'rhythm'
    | 'chord-board'
    | 'intervals'
    | 'fingering';
  title?: string;
  caption?: string;
  tex?: string;
  scoreSlug?: string;
  mode?: 'standard' | 'tab';
  tuning?: number[];
  instrument?: string;
  root?: string;
  scale?: string;
  key?: string;
  chords?: string[];
  size?: number;
  pattern?: string[];
  labels?: string[];
  tempo?: number;
}

/**
 * The block editor's canonical document — TipTap/ProseMirror JSON, stored verbatim in `body_doc`. The
 * core treats it as **opaque**: persisted and returned unchanged, never interpreted server-side (the
 * public render path reads the derived `bodyMdx` + `details.embeds`, never this). Typed as an open
 * record so the domain carries no ProseMirror dependency and the generated write DTO flows straight
 * through. See ADR "Editor storage".
 */
export type ProseMirrorDoc = Record<string, unknown>;

/** Structured facts stored on a content item (JSONB `details`). `related` = curated "if you like
 * this" slugs (served via the related endpoint, not shown in the Details panel). `embeds` = authored
 * interactive-tool embeds (served on the detail view, not in the Details facts panel). */
export interface ContentDetails {
  key?: string;
  era?: string;
  form?: string;
  timeSignature?: string;
  composer?: string;
  composerDates?: string;
  composedYear?: string;
  related?: string[];
  embeds?: ContentEmbed[];
}

/** The facts subset surfaced on the detail page (no `related`) — matches the `ContentDetails` DTO. */
export type ContentDetailsView = Omit<ContentDetails, 'related'>;

export interface MediaAssetMeta {
  id: string;
  kind: string;
  storageKey: string;
  filename: string;
  mime: string;
  license?: string | null;
  attribution?: string | null;
  sourceUrl?: string | null;
}

export interface ContentItem {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  bodyMdx: string | null;
  type: string;
  visibility: string;
  tier: string | null;
  status: string;
  difficulty: number | null;
  source: string | null;
  attribution: string | null;
  license: string | null;
  details: ContentDetails | null;
  /** Canonical block-editor document; null for file-authored/legacy items. Editor-only, never rendered. */
  bodyDoc: ProseMirrorDoc | null;
  createdAt: Date;
  updatedAt: Date;
  genres: TaxonomyRef[];
  instruments: TaxonomyRef[];
  topics: TaxonomyRef[];
  tags: TaxonomyRef[];
  media: MediaAssetMeta[];
}

/**
 * Overlay published per-locale translations onto a content item's text fields (ADR 0034, Phase 2).
 * `overlay` is a field→value map: `title` / `summary` / `bodyMdx`, and `details.<field>` for detail
 * facts. Absent fields keep their base (English) value. Returns a new item; a no-op for an empty overlay.
 */
export function applyContentOverlay(
  item: ContentItem,
  overlay: Record<string, string>,
): ContentItem {
  const keys = Object.keys(overlay);
  if (keys.length === 0) {
    return item;
  }
  const next: ContentItem = { ...item };
  if (overlay.title !== undefined) {
    next.title = overlay.title;
  }
  if (overlay.summary !== undefined) {
    next.summary = overlay.summary;
  }
  if (overlay.bodyMdx !== undefined) {
    next.bodyMdx = overlay.bodyMdx;
  }
  const detailKeys = keys.filter((k) => k.startsWith('details.'));
  if (detailKeys.length > 0 && next.details) {
    const details: Record<string, unknown> = { ...next.details };
    for (const key of detailKeys) {
      details[key.slice('details.'.length)] = overlay[key];
    }
    next.details = details as ContentDetails;
  }
  return next;
}

// --- Read models (match the API contract shapes) ---
export interface ContentSummaryView {
  slug: string;
  title: string;
  summary?: string;
  type: string;
  difficulty?: number;
  visibility: string;
  /** Which plan unlocks this premium item: `premium` | `pro`. Present on premium items. */
  tier?: string;
  /** True when this premium item is withheld from the current viewer (Phase 6). */
  locked?: boolean;
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
  sourceUrl?: string;
}

export interface ContentDetailView extends ContentSummaryView {
  /** Internal id — used by the translations admin to key per-locale translations. */
  id: string;
  bodyMdx?: string;
  source?: string;
  attribution?: string;
  license?: string;
  details?: ContentDetailsView;
  /** Preconfigured interactive-tool embeds rendered below the prose. */
  embeds?: ContentEmbed[];
  tags: TaxonomyRef[];
  media: MediaView[];
  createdAt: string;
  updatedAt: string;
}

/** Result ordering for a catalogue query. `relevance` = Meili's default text ranking (no sort). */
export type CatalogueSort = 'relevance' | 'difficulty-asc' | 'difficulty-desc' | 'title-asc';

export const CATALOGUE_SORTS: CatalogueSort[] = [
  'relevance',
  'difficulty-asc',
  'difficulty-desc',
  'title-asc',
];

export interface CatalogueQuery {
  q?: string;
  genres: string[];
  instruments: string[];
  topics: string[];
  eras: string[];
  composers: string[];
  keys: string[];
  type?: string;
  difficulty?: number;
  /** Inclusive difficulty range (1..10), driving the level-band facet. */
  difficultyMin?: number;
  difficultyMax?: number;
  sort?: CatalogueSort;
  page: number;
  pageSize: number;
}

/** Normalize a free-form `details.key` string to a facetable primary key — the leading key token
 * before any qualifier (e.g. "B-flat major (opening), moving to E-flat major" → "B-flat major"). */
export function normalizeKey(raw: string | null | undefined): string | null {
  if (!raw) {
    return null;
  }
  const primary = raw.split(/[(,;]/)[0]?.trim();
  return primary ? primary : null;
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
  eras: FacetValue[];
  types: FacetValue[];
  difficulties: FacetValue[];
  composers: FacetValue[];
  keys: FacetValue[];
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

/** Facts subset for the detail-page Details panel — drops the internal `related` slugs. */
export function toContentDetailsView(details: ContentDetails): ContentDetailsView {
  return {
    key: details.key,
    era: details.era,
    form: details.form,
    timeSignature: details.timeSignature,
    composer: details.composer,
    composerDates: details.composerDates,
    composedYear: details.composedYear,
  };
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
    tier: item.visibility === 'premium' ? (item.tier ?? 'premium') : undefined,
    genres: item.genres,
    instruments: item.instruments,
    topics: item.topics,
  };
}

/** Map a hydrated {@link ContentItem} + presigned media into the API detail shape. Shared by the
 * catalogue read path and the authoring CMS so both emit an identical `ContentDetail`. */
export function toContentDetailView(item: ContentItem, media: MediaView[]): ContentDetailView {
  return {
    id: item.id,
    slug: item.slug,
    title: item.title,
    summary: item.summary ?? undefined,
    type: item.type,
    difficulty: item.difficulty ?? undefined,
    visibility: item.visibility,
    tier: item.visibility === 'premium' ? (item.tier ?? 'premium') : undefined,
    genres: item.genres,
    instruments: item.instruments,
    topics: item.topics,
    bodyMdx: item.bodyMdx ?? undefined,
    source: item.source ?? undefined,
    attribution: item.attribution ?? undefined,
    license: item.license ?? undefined,
    details: item.details ? toContentDetailsView(item.details) : undefined,
    embeds: item.details?.embeds,
    tags: item.tags,
    media,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

/**
 * A locked preview of premium content for a non-entitled viewer: metadata is visible, but the paywalled
 * payload (`bodyMdx` + `media`) is withheld and `locked` is set. Media is never presigned.
 */
export function toLockedContentDetailView(item: ContentItem): ContentDetailView {
  return {
    ...toContentDetailView(item, []),
    bodyMdx: undefined,
    embeds: undefined,
    locked: true,
  };
}
