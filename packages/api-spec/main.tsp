import "@typespec/http";

using Http;

/**
 * The Music Repository API — the single source of truth for the HTTP contract.
 * Compiles to OpenAPI 3.1 (`openapi.json`), which drives Orval (FE client + Zod) and the
 * backend Zod DTOs. Paths are declared ONLY here (never in NestJS decorators).
 */
@service(#{ title: "The Music Repository API" })
namespace TheMusicRepository;

/** Service health snapshot. */
model HealthStatus {
  status: "ok" | "degraded" | "down";
  service: string;
  version: string;
  uptimeSeconds: int32;
  checks: HealthChecks;
}

model HealthChecks {
  database: "up" | "down";
}

/** RFC 9457 Problem Details (`application/problem+json`). */
@error
model ProblemDetails {
  /** URI identifying the problem category. */
  type: string;

  /** Short, stable, human summary of the problem type. */
  title: string;

  /** HTTP status code. */
  status: int32;

  /** Human explanation of this occurrence. */
  detail?: string;

  /** URI identifying this specific occurrence. */
  instance?: string;

  /** Stable machine-readable code — the programmatic contract. */
  code: string;

  /** W3C trace id for support correlation. */
  traceId?: string;

  /** Link to human documentation for this code. */
  docUrl?: string;
}

@route("/health")
@tag("health")
@get
op getHealth(): HealthStatus;

/** Reference endpoint that always fails with a Problem Details 404 (proves the error pipeline). */
@route("/demo/error")
@tag("demo")
@get
op getDemoError(): {
  @statusCode statusCode: 404;
  @body body: ProblemDetails;
};

// ===================== Catalogue (Phase 1) =====================

alias ContentType =
  | "lesson"
  | "song"
  | "score"
  | "exercise"
  | "technique"
  | "backing_track"
  | "tool_page";

alias Visibility = "public" | "authed" | "premium";

/** A taxonomy reference (genre / instrument / topic / tag). */
model TaxonomyRef {
  slug: string;
  name: string;
}

/** A media file attached to a content item, with a ready-to-use (presigned) URL. */
model MediaAsset {
  id: string;
  kind: "score_pdf" | "audio" | "image" | "alphatex";
  url: string;
  filename: string;
  mime: string;
  license?: string;
  attribution?: string;
  /** Provenance URL of the engraving (source edition or transcription reference). */
  sourceUrl?: string;
}

/** List/card view of a catalogue item. */
model ContentSummary {
  slug: string;
  title: string;
  summary?: string;
  type: ContentType;
  difficulty?: int32;
  visibility: Visibility;
  /** For premium items: which plan unlocks it — "premium" or "pro". */
  tier?: string;
  /** True when this is premium content the current viewer is not entitled to (body/media withheld). */
  locked?: boolean;
  genres: TaxonomyRef[];
  instruments: TaxonomyRef[];
  topics: TaxonomyRef[];
}

/** Structured "facts" for the detail-page Details panel + the Era facet. All optional. */
model ContentDetails {
  key?: string;
  era?: string;
  form?: string;
  timeSignature?: string;
  composer?: string;
  composerDates?: string;
  composedYear?: string;
}

/**
 * A preconfigured interactive tool embedded in a catalogue article, rendered (in order) below the
 * prose. The `tool` field selects which learning tool; the remaining optional fields configure it for
 * the specific lesson (a flat shape rather than a per-tool union to keep the generated DTO simple — the
 * web narrows on `tool`). Authored in the content Markdown's `embeds` block; stored in `details` JSONB.
 */
model ContentEmbed {
  /** Which tool to render. */
  tool:
    | "score"
    | "keyboard"
    | "scale-boxes"
    | "chord-diagrams"
    | "progression"
    | "circle-of-fifths"
    // Fit-for-purpose Pixi visualisations (ADR 0029) that replace static ASCII examples:
    | "strum"
    | "rhythm"
    | "chord-board"
    | "intervals"
    | "fingering";
  /** Optional heading shown above the embed. */
  title?: string;
  /** Optional explanatory caption shown under the heading. */
  caption?: string;
  /** `score`: inline alphaTex source to render + play. */
  tex?: string;
  /** `score`: reference an existing catalogue score by slug instead of inline `tex`. */
  scoreSlug?: string;
  /** `score`/`scale-boxes`: engraving mode (piano-style `standard` vs guitar `tab`). */
  mode?: "standard" | "tab";
  /** `score` (tab): open-string MIDI pitches so a pitched score renders as tablature. */
  tuning?: int32[];
  /** Fretted/keyboard instrument hint: `guitar` | `ukulele` | `bass` | `piano`. */
  instrument?: string;
  /** `scale-boxes`/`keyboard`: scale root note, e.g. `A`, `C#`. */
  root?: string;
  /** `scale-boxes`/`keyboard`: scale id, e.g. `major`, `minor-pentatonic`, `blues`. */
  scale?: string;
  /** `progression`: key the Roman-numeral/chord progression is in, e.g. `A`. */
  key?: string;
  /** `chord-diagrams`/`progression`/`chord-board`: chord symbols, e.g. `["C","G","Am","F"]`. */
  chords?: string[];
  /** `keyboard`: number of keys (e.g. 25, 49, 61, 88). */
  size?: int32;
  /** `strum`/`rhythm`: per-cell tokens over one bar, e.g. `["D","-","D","U","-","U","D","U"]`
   * (strum: `D`=down `U`=up `-`=rest) or note values (`rhythm`: `whole|half|quarter|eighth`). */
  pattern?: string[];
  /** `chord-board`: parallel labels for `chords` (e.g. Roman numerals `["I","ii","iii",…]`). */
  labels?: string[];
  /** `strum`/`progression`: beats per minute for playback. */
  tempo?: int32;
}

/** Full detail view of a catalogue item. */
model ContentDetail {
  ...ContentSummary;

  /** Internal id — used by the translations admin to key per-locale content translations. */
  id: string;

  bodyMdx?: string;
  source?: string;
  attribution?: string;
  license?: string;
  details?: ContentDetails;
  /** Preconfigured interactive tools to render below the prose (authored, from `details` JSONB). */
  embeds?: ContentEmbed[];
  tags: TaxonomyRef[];
  media: MediaAsset[];
  createdAt: string;
  updatedAt: string;
}

/** One facet bucket (a value + its result count). */
model FacetValue {
  value: string;
  label: string;
  count: int32;
}

/** Available facets for the current result set. */
model Facets {
  genres: FacetValue[];
  instruments: FacetValue[];
  topics: FacetValue[];
  eras: FacetValue[];
  types: FacetValue[];
  difficulties: FacetValue[];
  composers: FacetValue[];
  keys: FacetValue[];
}

/** Paginated, faceted catalogue search result. */
model CatalogueList {
  items: ContentSummary[];
  facets: Facets;
  total: int32;
  page: int32;
  pageSize: int32;
}

/** Browse & search the catalogue with faceted filters. */
@route("/catalogue/items")
@tag("catalogue")
@get
op searchCatalogue(
  @query q?: string,
  @query genre?: string[],
  @query instrument?: string[],
  @query topic?: string[],
  @query era?: string[],
  @query composer?: string[],
  @query key?: string[],
  @query type?: ContentType,
  @query difficulty?: int32,
  /** Inclusive lower bound on difficulty (1..10) — used by the level-band facet. */
  @query difficultyMin?: int32,
  /** Inclusive upper bound on difficulty (1..10) — used by the level-band facet. */
  @query difficultyMax?: int32,
  /** Result ordering: `relevance` (default) | `difficulty-asc` | `difficulty-desc` | `title-asc`. */
  @query sort?: string,
  @query page?: int32,
  @query pageSize?: int32,
  /** Locale to overlay published content translations for (e.g. `zh-Hans`); default/absent = base. */
  @query locale?: string,
): CatalogueList;

/** Fetch a single catalogue item (with taxonomy + presigned media) by slug. */
@route("/catalogue/items/{slug}")
@tag("catalogue")
@get
op getContentBySlug(@path slug: string, @query locale?: string): ContentDetail | {
  @statusCode statusCode: 404;
  @body body: ProblemDetails;
};

/** Related items — published content sharing genre/instrument/topic, ranked by overlap. */
model RelatedContent {
  items: ContentSummary[];
}

@route("/catalogue/items/{slug}/related")
@tag("catalogue")
@get
op getRelatedContent(@path slug: string, @query locale?: string): RelatedContent;

// ===================== Admin CMS (Slice 2b) =====================
// RBAC-gated authoring surface. Enforcement lives in NestJS guards; the contract documents shapes.

alias ContentStatus = "draft" | "review" | "published";
alias MediaKind = "score_pdf" | "audio" | "image" | "alphatex";

/** Create/replace payload for a content item. Taxonomy is given as slug arrays. */
model ContentWriteInput {
  slug: string;
  title: string;
  summary?: string;
  bodyMdx?: string;
  type: ContentType;
  visibility?: Visibility;
  /** For premium items: which plan unlocks it — "premium" or "pro". */
  tier?: string;
  difficulty?: int32;
  source?: string;
  attribution?: string;
  license?: string;
  genres: string[];
  instruments: string[];
  topics: string[];
  tags: string[];
  /** Structured facts (key/era/form/composer/…) stored in the `details` JSONB. */
  details?: ContentDetails;
  /** Curated "if you like this" slugs, merged into `details.related`. */
  related?: string[];
  /** Preconfigured interactive-tool embeds, merged into `details.embeds`. */
  embeds?: ContentEmbed[];
  /** Canonical block-editor document (TipTap/ProseMirror JSON). Opaque — stored + returned verbatim,
   * never interpreted server-side; `bodyMdx`/`embeds` are the derived render fields. */
  bodyDoc?: Record<unknown>;
}

/** Admin list row (any status). */
model ContentAdminSummary {
  slug: string;
  title: string;
  type: ContentType;
  status: ContentStatus;
  visibility: Visibility;
  difficulty?: int32;
  updatedAt: string;

  /** Premium plan that unlocks the item (`premium`/`pro`), if any. */
  tier?: string;

  /** Historical era from `details.era`, if set. */
  era?: string;

  /** Taxonomy slugs — enough to drive admin axes/facets; labels derive client-side. */
  genres: string[];
  instruments: string[];
}

model ContentAdminList {
  items: ContentAdminSummary[];
}

/** Request a direct-to-storage upload slot for a media file. */
model MediaUploadRequest {
  filename: string;
  mime: string;
  kind: MediaKind;
  license?: string;
  attribution?: string;
}

/** A presigned PUT ticket the browser uploads the bytes to. */
model MediaUploadTicket {
  mediaId: string;
  storageKey: string;
  uploadUrl: string;
}

model TaxonomyWriteInput {
  slug: string;
  name: string;
}

model TaxonomyList {
  items: TaxonomyRef[];
}

/** List every content item (all statuses) for the admin table. */
@route("/content")
@tag("authoring")
@get
op listContent(): ContentAdminList;

/** Create a content item (starts as draft). */
@route("/content")
@tag("authoring")
@post
op createContent(@body body: ContentWriteInput): {
  @statusCode statusCode: 201;
  @body body: ContentDetail;
};

/** Fetch a content item of any status for editing. */
@route("/content/{slug}")
@tag("authoring")
@get
op getContentForEdit(@path slug: string): ContentDetail | {
  @statusCode statusCode: 404;
  @body body: ProblemDetails;
};

/** Replace a content item (taxonomy + fields). */
@route("/content/{slug}")
@tag("authoring")
@put
op updateContent(@path slug: string, @body body: ContentWriteInput): ContentDetail;

@route("/content/{slug}/publish")
@tag("authoring")
@post
op publishContent(@path slug: string): ContentDetail;

@route("/content/{slug}/unpublish")
@tag("authoring")
@post
op unpublishContent(@path slug: string): ContentDetail;

/** Body for a direct status change (used by the admin manager's board + status menu). */
model ContentStatusInput {
  status: ContentStatus;
}

@route("/content/{slug}/status")
@tag("authoring")
@post
op setContentStatus(@path slug: string, @body body: ContentStatusInput): ContentDetail;

@route("/content/{slug}")
@tag("authoring")
@delete
op deleteContent(@path slug: string): {
  @statusCode statusCode: 204;
};

/** Reserve a media row + presigned PUT URL; the browser uploads bytes directly to storage. */
@route("/content/{slug}/media")
@tag("authoring")
@post
op requestMediaUpload(@path slug: string, @body body: MediaUploadRequest): {
  @statusCode statusCode: 201;
  @body body: MediaUploadTicket;
};

/** alphaTex source for a standalone score content item. */
model ContentScoreInput {
  tex: string;
}

/** Set (replace) a score item's alphaTex — stored as its single `alphatex` media asset. */
@route("/content/{slug}/score")
@tag("authoring")
@put
op setContentScore(@path slug: string, @body body: ContentScoreInput): ContentDetail;

/** One saved content snapshot (written on publish). */
model ContentRevisionSummary {
  id: string;
  title: string;
  /** Better Auth user id of who published this snapshot, if known. */
  authorId?: string;
  createdAt: string;
}

/** Version history for a content item, newest first. */
model ContentRevisionList {
  items: ContentRevisionSummary[];
}

/** List a content item's saved revisions (newest first). */
@route("/content/{slug}/revisions")
@tag("authoring")
@get
op listContentRevisions(@path slug: string): ContentRevisionList;

/** Restore a revision's snapshot onto the content item; returns the updated detail. */
@route("/content/{slug}/revisions/{revisionId}/restore")
@tag("authoring")
@post
op restoreContentRevision(@path slug: string, @path revisionId: string): ContentDetail;

/** List taxonomy terms for a dimension (`genres` | `instruments` | `topics` | `tags`). */
@route("/taxonomy/{dimension}")
@tag("authoring")
@get
op listTaxonomy(@path dimension: string): TaxonomyList;

/** Create (or upsert) a taxonomy term in a dimension. */
@route("/taxonomy/{dimension}")
@tag("authoring")
@post
op createTaxonomy(@path dimension: string, @body body: TaxonomyWriteInput): {
  @statusCode statusCode: 201;
  @body body: TaxonomyRef;
};

// ===================== Collections (Phase 2) =====================
// Ordered groupings of catalogue items: courses / learning paths / syllabi / song lists.

alias CollectionKind = "course" | "path" | "syllabus" | "songlist";
alias CollectionCuration = "editorial" | "user";
alias CollectionVisibility = "public" | "authed" | "private";

/** Discovery facets carried by a collection. */
model CollectionFacets {
  era?: string[];
  genre?: string[];
  technique?: string[];
  mood?: string[];
  instrument?: string[];
}

/** List/card view of a collection. */
model CollectionSummary {
  slug: string;
  title: string;
  summary?: string;
  kind: CollectionKind;
  visibility: CollectionVisibility;
  status: ContentStatus;
  curationType: CollectionCuration;
  itemCount: int32;
  featured: boolean;
  difficultyMin?: int32;
  difficultyMax?: int32;
  estMinutes?: int32;
  curatorName?: string;
  heroImageKey?: string;
  accent?: string;
  tags?: string[];
  facets?: CollectionFacets;
  popularity: int32;
  averageRating?: float32;
  ratingCount: int32;
}

/** One ordered entry in a collection (a catalogue item at a position + curator annotations). */
model CollectionEntry {
  position: int32;
  content: ContentSummary;
  sectionId?: string;
  curatorNote?: string;
  focusSkills?: string[];
  completed?: boolean;
}

/** A chapter within a collection: an ordered group of entries. */
model CollectionSectionView {
  id: string;
  title: string;
  description?: string;
  position: int32;
  items: CollectionEntry[];
}

/** Full collection with its ordered items grouped into sections. */
model CollectionDetail {
  ...CollectionSummary;

  /** Internal id — used by the translations admin to key per-locale collection translations. */
  id: string;

  ownerId?: string;
  bodyMdx?: string;
  outcomes?: string[];
  curatorBio?: string;
  items: CollectionEntry[];
  sections: CollectionSectionView[];
}

/** Collection detail with per-item completion + overall progress (auth-aware). */
model CollectionProgressDetail {
  ...CollectionDetail;
  percentComplete: int32;
  completedCount: int32;
  nextUpSlug: string | null;
}

model CollectionList {
  items: CollectionSummary[];
}

/** Create/replace payload for an editorial collection (items/sections set separately). */
model CollectionWriteInput {
  slug: string;
  title: string;
  summary?: string;
  bodyMdx?: string;
  kind: CollectionKind;
  visibility?: CollectionVisibility;
  featured?: boolean;
  difficultyMin?: int32;
  difficultyMax?: int32;
  estMinutes?: int32;
  curatorName?: string;
  curatorBio?: string;
  accent?: string;
  outcomes?: string[];
  tags?: string[];
  facets?: CollectionFacets;
}

/** One item in a structured items payload. */
model CollectionItemInput {
  contentSlug: string;
  sectionIndex?: int32;
  curatorNote?: string;
  focusSkills?: string[];
}

/** Ordered items that make up a collection (with notes + section links). */
model CollectionItemsInput {
  items: CollectionItemInput[];
}

/** One chapter in a sections payload (ordered by array position). */
model CollectionSectionInput {
  title: string;
  description?: string;
}

/** Replace the collection's chapters (ordered by array position). */
model CollectionSectionsInput {
  sections: CollectionSectionInput[];
}

/** A user-created collection's editable fields. */
model UserCollectionWriteInput {
  title: string;
  summary?: string;
  bodyMdx?: string;
  visibility?: CollectionVisibility;
}

/** A 1..5 rating submission. */
model CollectionRatingInput {
  rating: int32;
}

/** Aggregate rating + the viewer's own rating after submitting. */
model CollectionRatingResult {
  average?: float32;
  count: int32;
  yourRating: int32;
}

/** Browse published collections. */
@route("/collections")
@tag("collections")
@get
op listCollections(@query locale?: string): CollectionList;

/** A published collection with ordered items. */
@route("/collections/{slug}")
@tag("collections")
@get
op getCollectionBySlug(@path slug: string, @query locale?: string): CollectionDetail | {
  @statusCode statusCode: 404;
  @body body: ProblemDetails;
};

// --- Admin authoring (RBAC-gated in NestJS) ---

@route("/admin/collections")
@tag("collections")
@get
op listCollectionsAdmin(): CollectionList;

@route("/admin/collections")
@tag("collections")
@post
op createCollection(@body body: CollectionWriteInput): {
  @statusCode statusCode: 201;
  @body body: CollectionDetail;
};

@route("/admin/collections/{slug}")
@tag("collections")
@get
op getCollectionForEdit(@path slug: string): CollectionDetail | {
  @statusCode statusCode: 404;
  @body body: ProblemDetails;
};

@route("/admin/collections/{slug}")
@tag("collections")
@put
op updateCollection(@path slug: string, @body body: CollectionWriteInput): CollectionDetail;

/** Replace the ordered items of a collection. */
@route("/admin/collections/{slug}/items")
@tag("collections")
@put
op setCollectionItems(@path slug: string, @body body: CollectionItemsInput): CollectionDetail;

@route("/admin/collections/{slug}/publish")
@tag("collections")
@post
op publishCollection(@path slug: string): CollectionDetail;

@route("/admin/collections/{slug}/unpublish")
@tag("collections")
@post
op unpublishCollection(@path slug: string): CollectionDetail;

@route("/admin/collections/{slug}")
@tag("collections")
@delete
op deleteCollection(@path slug: string): {
  @statusCode statusCode: 204;
};

/** Replace the collection's chapters (admin). */
@route("/admin/collections/{slug}/sections")
@tag("collections")
@put
op setCollectionSections(@path slug: string, @body body: CollectionSectionsInput): CollectionDetail;

// --- Discovery + progress (public; progress/open are auth-aware in NestJS) ---

/** A published collection with per-item completion + overall progress for the current viewer. */
@route("/collections/{slug}/progress")
@tag("collections")
@get
op getCollectionWithProgress(@path slug: string, @query locale?: string): CollectionProgressDetail | {
  @statusCode statusCode: 404;
  @body body: ProblemDetails;
};

/** Record that a collection was opened (best-effort popularity signal). */
@route("/collections/{slug}/open")
@tag("collections")
@post
op recordCollectionOpen(@path slug: string): {
  @statusCode statusCode: 204;
};

/** One facet value + its result count. */
model CollectionFacetValue {
  value: string;
  label: string;
  count: int32;
}

/** Facet distributions for the current collection search. */
model CollectionSearchFacets {
  kinds: CollectionFacetValue[];
  eras: CollectionFacetValue[];
  instruments: CollectionFacetValue[];
  techniques: CollectionFacetValue[];
  moods: CollectionFacetValue[];
  curators: CollectionFacetValue[];
  difficulties: CollectionFacetValue[];
}

/** A page of collection search results + facets. */
model CollectionSearchResult {
  items: CollectionSummary[];
  facets: CollectionSearchFacets;
  total: int32;
  page: int32;
  pageSize: int32;
}

/** Published collections that feature a given catalogue item (cross-linking from a content page). */
@route("/collections/by-content/{slug}")
@tag("collections")
@get
op listCollectionsForContent(@path slug: string): CollectionList;

/** Faceted discovery over published collections. */
@route("/collections/search")
@tag("collections")
@get
op searchCollections(
  @query q?: string,
  @query kind?: string,
  @query era?: string[],
  @query instrument?: string[],
  @query technique?: string[],
  @query mood?: string[],
  @query curator?: string[],
  @query difficulty?: int32,
  @query featured?: boolean,
  @query sort?: string,
  @query page?: int32,
  @query pageSize?: int32,
): CollectionSearchResult;

// --- Personal engagement + user-created collections (auth-gated in NestJS) ---

/** The current user's saved (bookmarked) collections. */
@route("/me/saved-collections")
@tag("collections")
@get
op listCollectionBookmarks(): CollectionList;

/** Save a collection to the current user's library. */
@route("/me/collections/{slug}/bookmark")
@tag("collections")
@post
op addCollectionBookmark(@path slug: string): {
  @statusCode statusCode: 204;
};

/** Remove a collection from the current user's library. */
@route("/me/collections/{slug}/bookmark")
@tag("collections")
@delete
op removeCollectionBookmark(@path slug: string): {
  @statusCode statusCode: 204;
};

/** Rate a collection (1..5) as the current user. */
@route("/me/collections/{slug}/rating")
@tag("collections")
@put
op rateCollection(@path slug: string, @body body: CollectionRatingInput): CollectionRatingResult;

/** The current user's own collections. */
@route("/me/collections")
@tag("collections")
@get
op listMyCollections(): CollectionList;

/** Create a user-owned collection. */
@route("/me/collections")
@tag("collections")
@post
op createUserCollection(@body body: UserCollectionWriteInput): {
  @statusCode statusCode: 201;
  @body body: CollectionDetail;
};

/** One of the current user's collections (for editing). */
@route("/me/collections/{slug}")
@tag("collections")
@get
op getMyCollection(@path slug: string): CollectionDetail | {
  @statusCode statusCode: 404;
  @body body: ProblemDetails;
};

/** Update a user-owned collection's metadata. */
@route("/me/collections/{slug}")
@tag("collections")
@put
op updateUserCollection(@path slug: string, @body body: UserCollectionWriteInput): CollectionDetail;

/** Replace a user-owned collection's ordered items. */
@route("/me/collections/{slug}/items")
@tag("collections")
@put
op setUserCollectionItems(@path slug: string, @body body: CollectionItemsInput): CollectionDetail;

/** Delete a user-owned collection. */
@route("/me/collections/{slug}")
@tag("collections")
@delete
op deleteUserCollection(@path slug: string): {
  @statusCode statusCode: 204;
};

// ===================== Favorites (Slice 2c) =====================
// Personalization: a signed-in user's bookmarked content. Auth-gated in NestJS.

model FavoritesList {
  items: ContentSummary[];
}

/** The current user's favorited content (published items). */
@route("/me/favorites")
@tag("favorites")
@get
op listFavorites(): FavoritesList;

/** Add a content item to the current user's favorites. */
@route("/me/favorites/{slug}")
@tag("favorites")
@post
op addFavorite(@path slug: string): {
  @statusCode statusCode: 204;
};

/** Remove a content item from the current user's favorites. */
@route("/me/favorites/{slug}")
@tag("favorites")
@delete
op removeFavorite(@path slug: string): {
  @statusCode statusCode: 204;
};

// ===================== Saved progressions (Phase 5 backlog) =====================
// Personalization: a signed-in user's saved chord progressions (from the chord analyzer). The
// client keeps a localStorage copy for anonymous use; when signed in these sync to the account.

/** One chord in a saved progression: root pitch-class (0–11) + quality key. */
model ProgressionChord {
  root: int32;
  quality: string;
}

/** The body sent when saving/updating a progression (keyed by name in the path). */
model SavedProgressionInput {
  keyRoot: int32;
  chords: ProgressionChord[];
}

/** A saved progression as returned to the client. */
model SavedProgressionView {
  name: string;
  keyRoot: int32;
  chords: ProgressionChord[];
  updatedAt: string;
}

model SavedProgressionList {
  items: SavedProgressionView[];
}

/** The current user's saved progressions, most-recently-updated first. */
@route("/me/progressions")
@tag("progressions")
@get
op listProgressions(): SavedProgressionList;

/** Create or replace a saved progression by name (idempotent upsert). */
@route("/me/progressions/{name}")
@tag("progressions")
@put
op saveProgression(@path name: string, @body body: SavedProgressionInput): {
  @statusCode statusCode: 204;
};

/** Delete a saved progression by name. */
@route("/me/progressions/{name}")
@tag("progressions")
@delete
op deleteProgression(@path name: string): {
  @statusCode statusCode: 204;
};

// ===================== Progress (Phase 2) =====================
// Per-user learning progress: completion, streaks, and practice time. Auth-gated in NestJS.

/** Progress for a single collection. */
model CollectionProgress {
  slug: string;
  title: string;
  totalItems: int32;
  completedItems: int32;
}

/** Dashboard summary for the current user. */
model ProgressSummary {
  completedCount: int32;
  completedSlugs: string[];
  currentStreakDays: int32;
  totalPracticeMinutes: int32;
  collections: CollectionProgress[];
}

/** Log a practice session (optionally tied to a content item). */
model PracticeInput {
  contentSlug?: string;
  minutes: int32;
}

/** The current user's progress dashboard. */
@route("/me/progress")
@tag("progress")
@get
op getProgress(): ProgressSummary;

/** Mark a content item complete for the current user. */
@route("/me/progress/{slug}")
@tag("progress")
@post
op markComplete(@path slug: string): {
  @statusCode statusCode: 204;
};

/** Mark a content item not complete. */
@route("/me/progress/{slug}")
@tag("progress")
@delete
op markIncomplete(@path slug: string): {
  @statusCode statusCode: 204;
};

/** Record a practice session. */
@route("/me/practice")
@tag("progress")
@post
op logPractice(@body body: PracticeInput): {
  @statusCode statusCode: 201;
  @body body: ProgressSummary;
};

// ===================== Trainers / SRS reviews (Phase 4) =====================
// Spaced-repetition (SM-2) state per user + deck + card. Decks are defined client-side; the server
// only tracks scheduling. Auth-gated in NestJS.

/** SM-2 scheduling state for a single card. */
model ReviewState {
  card: string;
  easeFactor: float32;
  intervalDays: int32;
  repetitions: int32;
  dueAt: string;
}

model DeckReviews {
  cards: ReviewState[];
}

model DeckSummary {
  deck: string;
  learned: int32;
  due: int32;
}

model ReviewSummary {
  decks: DeckSummary[];
  totalDue: int32;
  reviewsToday: int32;
  streakDays: int32;
}

/** A recall grade: 0–5 (SM-2). Typically Again=2, Good=4, Easy=5. */
model ReviewGrade {
  quality: int32;
}

/** Per-deck learned + due counts for the current user. */
@route("/me/reviews")
@tag("reviews")
@get
op getReviewSummary(): ReviewSummary;

/** All stored review states for a deck (the client computes new/due from its deck definition). */
@route("/me/reviews/{deck}")
@tag("reviews")
@get
op getDeckReviews(@path deck: string): DeckReviews;

/** Grade a card; applies SM-2 and returns the updated state. */
@route("/me/reviews/{deck}/{card}")
@tag("reviews")
@post
op gradeCard(@path deck: string, @path card: string, @body body: ReviewGrade): {
  @statusCode statusCode: 201;
  @body body: ReviewState;
};

// ===================== Drill engine attempts (objective grading) =====================
// Objective drill attempts + per-skill mastery. An attempt records measured accuracy for a card; the
// server maps it to an SM-2 quality and delegates scheduling to the reviews context. Auth-gated.

/** One objectively-graded drill attempt reported by the client. */
model DrillAttempt {
  deck: string;
  card: string;
  /** Answer-input modality (multiple-choice | play-instrument | ear-identify | pitch-mic | rhythm-tap). */
  modality: string;
  /** 0–1 objective accuracy. */
  accuracy: float32;
  correct: boolean;
  /** Response latency in ms, if measured. */
  responseMs?: int32;
}

/** The result of recording an attempt: the SM-2 state after grading + the applied quality. */
model DrillAttemptResult {
  state: ReviewState;
  quality: int32;
  /** True when this attempt set a new best rolling accuracy for the deck. */
  isPersonalBest: boolean;
  /** The deck's mastery level after this attempt (beginner…expert). */
  level: string;
  /** True when this attempt advanced the deck to a higher mastery level. */
  leveledUp: boolean;
}

/** Rolling mastery for one deck/skill, computed from the attempt log. */
model SkillMastery {
  deck: string;
  attempts: int32;
  /** Rolling accuracy 0–1 over recent attempts. */
  accuracy: float32;
  /** Mastery score 0–1 (EWMA of correctness). */
  mastery: float32;
  /** Recommended level tier from mastery (beginner…expert). */
  level: string;
}

model DrillStatsSummary {
  skills: SkillMastery[];
  streakDays: int32;
  attemptsToday: int32;
}

/** Record an objective attempt; grades via SM-2 and returns the updated state. */
@route("/me/drills/attempts")
@tag("drills")
@post
op recordDrillAttempt(@body body: DrillAttempt): {
  @statusCode statusCode: 201;
  @body body: DrillAttemptResult;
};

/** Per-skill mastery + streak for the current user. */
@route("/me/drills/stats")
@tag("drills")
@get
op getDrillStats(): DrillStatsSummary;

/** Per-skill mastery for a single deck. */
@route("/me/drills/stats/{deck}")
@tag("drills")
@get
op getDeckMastery(@path deck: string): SkillMastery;

// ===================== Info View / help topics (Phase 2) =====================
// Context-sensitive help: elements tagged `data-help="<slug>"` show the matching topic.

model HelpTopic {
  /** Internal id — used by the translations admin to key per-locale help translations. */
  id: string;

  slug: string;
  term: string;
  body: string;
  linkSlug?: string;
}

model HelpTopicList {
  items: HelpTopic[];
}

model HelpTopicWriteInput {
  slug: string;
  term: string;
  body: string;
  linkSlug?: string;
}

/** All help topics (the web preloads these to answer hovers without per-term fetches). */
@route("/help-topics")
@tag("help")
@get
op listHelpTopics(@query locale?: string): HelpTopicList;

@route("/help-topics/{slug}")
@tag("help")
@get
op getHelpTopic(@path slug: string, @query locale?: string): HelpTopic | {
  @statusCode statusCode: 404;
  @body body: ProblemDetails;
};

// --- Admin authoring (RBAC-gated in NestJS) ---

@route("/admin/help-topics")
@tag("help")
@post
op createHelpTopic(@body body: HelpTopicWriteInput): {
  @statusCode statusCode: 201;
  @body body: HelpTopic;
};

@route("/admin/help-topics/{slug}")
@tag("help")
@put
op updateHelpTopic(@path slug: string, @body body: HelpTopicWriteInput): HelpTopic;

@route("/admin/help-topics/{slug}")
@tag("help")
@delete
op deleteHelpTopic(@path slug: string): {
  @statusCode statusCode: 204;
};

// ===================== Monetization (Phase 6) =====================
// Premium entitlements gate `visibility: "premium"` content. The subscription endpoints are a local,
// mock stand-in for a payment provider's checkout + webhook (no real billing wired yet). Auth-gated.

/** The current user's premium-entitlement status. */
model SubscriptionStatus {
  premium: boolean;
  /** How premium was granted: "subscription" (mock checkout), "staff" (admin/editor), or "none". */
  source: string;
  /** ISO timestamp premium was granted, when applicable. */
  since?: string;
}

/** The current user's subscription/entitlement status. */
@route("/me/subscription")
@tag("monetization")
@get
op getSubscription(): SubscriptionStatus;

/** Activate premium (mock checkout — stands in for a payment-provider webhook). */
@route("/me/subscription/activate")
@tag("monetization")
@post
op activateSubscription(): SubscriptionStatus;

/** Cancel premium. */
@route("/me/subscription")
@tag("monetization")
@delete
op cancelSubscription(): {
  @statusCode statusCode: 204;
};

/** A payment-provider checkout session to redirect the user to. */
model CheckoutSession {
  /** URL to redirect the browser to (Stripe Checkout, or the mock checkout page in dev). */
  url: string;
}

/** Body for starting a checkout. */
model StartCheckoutInput {
  /** Tier to purchase: "premium" (default) or "pro". */
  plan?: string;
}

/** Start a subscription checkout — returns the URL to redirect to. The entitlement is granted by the
 * provider webhook (`POST /billing/webhook`) on completion, not here. */
@route("/me/checkout")
@tag("monetization")
@post
op startCheckout(@body body: StartCheckoutInput): CheckoutSession;

/** A payment-provider billing-portal session (manage card / cancel / invoices). */
model BillingPortalSession {
  url: string;
}

/** Open the customer billing portal — returns the URL to redirect to. */
@route("/me/billing-portal")
@tag("monetization")
@post
op openBillingPortal(): BillingPortalSession;

/** One entry in the entitlement audit log. */
model EntitlementEvent {
  key: string;
  action: string;
  source: string;
  at: string;
}

model EntitlementHistory {
  items: EntitlementEvent[];
}

/** The acting user's entitlement grant/revoke history (most-recent first). */
@route("/me/entitlements/history")
@tag("monetization")
@get
op getEntitlementHistory(): EntitlementHistory;

// ----- Gift / redeem codes (Phase 6, 6B) -----

/** Body for minting a gift code (staff only). */
model CreateRedeemCodeInput {
  /** Entitlement tier granted: "premium" (default) or "pro". */
  tier?: string;
  /** Days the granted premium lasts; omit for no expiry. */
  durationDays?: int32;
  /** How many times the code can be redeemed (default 1). */
  uses?: int32;
}

model RedeemCodeCreated {
  code: string;
}

/** Body for redeeming a code. */
model RedeemCodeInput {
  code: string;
}

model RedeemResult {
  redeemed: boolean;
  expiresAt?: string;
}

/** Mint a gift/redeem code (staff only). */
@route("/admin/redeem-codes")
@tag("monetization")
@post
op createRedeemCode(@body body: CreateRedeemCodeInput): {
  @statusCode statusCode: 201;
  @body body: RedeemCodeCreated;
};

/** Redeem a gift code for the acting user → grants premium. */
@route("/me/redeem")
@tag("monetization")
@post
op redeemCode(@body body: RedeemCodeInput): RedeemResult;

// ===================== Classrooms (Phase 6, teacher mode) =====================
// A teacher creates a classroom (join code); learners join; the teacher can grant premium to the class
// (institutional/seat entitlement). Auth-gated in NestJS.

model Classroom {
  id: string;
  name: string;
  joinCode: string;
  memberCount: int32;
  /** The acting user's relationship to the classroom. */
  role: "owner" | "member";
  /** True once the teacher has granted premium to the class. */
  premiumGranted: boolean;
}

model ClassroomMember {
  id: string;
  name: string;
  email: string;
}

model ClassroomDetail {
  ...Classroom;
  members: ClassroomMember[];
}

model ClassroomList {
  items: Classroom[];
}

model CreateClassroomInput {
  name: string;
}

model JoinClassroomInput {
  code: string;
}

/** Classrooms the current user owns or has joined. */
@route("/me/classrooms")
@tag("classrooms")
@get
op listClassrooms(): ClassroomList;

/** Create a classroom (the caller becomes its teacher/owner). */
@route("/me/classrooms")
@tag("classrooms")
@post
op createClassroom(@body body: CreateClassroomInput): {
  @statusCode statusCode: 201;
  @body body: Classroom;
};

/** Join a classroom by its code. */
@route("/classrooms/join")
@tag("classrooms")
@post
op joinClassroom(@body body: JoinClassroomInput): Classroom;

/** A classroom with its roster (owner or member only). */
@route("/classrooms/{id}")
@tag("classrooms")
@get
op getClassroom(@path id: string): ClassroomDetail;

/** Grant premium to every current member of the classroom (owner only). */
@route("/classrooms/{id}/grant-premium")
@tag("classrooms")
@post
op grantClassroomPremium(@path id: string): ClassroomDetail;

/** Leave a classroom (a member removes themselves; the owner cannot leave — archive instead). */
@route("/classrooms/{id}/leave")
@tag("classrooms")
@post
op leaveClassroom(@path id: string): {
  @statusCode statusCode: 204;
};

/** Remove a member from the classroom (owner only). */
@route("/classrooms/{id}/members/{memberId}")
@tag("classrooms")
@delete
op removeClassroomMember(@path id: string, @path memberId: string): {
  @statusCode statusCode: 204;
};

/** Archive a classroom (owner only) — hides it from all rosters. */
@route("/classrooms/{id}/archive")
@tag("classrooms")
@post
op archiveClassroom(@path id: string): {
  @statusCode statusCode: 204;
};

/** Transfer ownership to a current member (owner only). */
model TransferOwnershipInput {
  memberId: string;
}

@route("/classrooms/{id}/transfer")
@tag("classrooms")
@post
op transferClassroomOwnership(@path id: string, @body body: TransferOwnershipInput): {
  @statusCode statusCode: 204;
};

// ----- Assignments + class progress (6C) -----

model Assignment {
  slug: string;
  title: string;
}

model AssignmentList {
  items: Assignment[];
}

model AssignContentInput {
  contentSlug: string;
}

/** A member's completion across the class's assigned content. */
model MemberProgress {
  id: string;
  name: string;
  email: string;
  completedCount: int32;
  total: int32;
}

model ClassProgress {
  assignments: Assignment[];
  members: MemberProgress[];
}

/** The class's assigned content (any owner or member). */
@route("/classrooms/{id}/assignments")
@tag("classrooms")
@get
op listAssignments(@path id: string): AssignmentList;

/** Assign content to the class by slug (owner only). */
@route("/classrooms/{id}/assignments")
@tag("classrooms")
@post
op assignContent(@path id: string, @body body: AssignContentInput): {
  @statusCode statusCode: 201;
  @body body: AssignmentList;
};

/** Remove an assignment (owner only). */
@route("/classrooms/{id}/assignments/{slug}")
@tag("classrooms")
@delete
op unassignContent(@path id: string, @path slug: string): {
  @statusCode statusCode: 204;
};

/** Per-student progress across the class's assigned content (owner only). */
@route("/classrooms/{id}/progress")
@tag("classrooms")
@get
op getClassProgress(@path id: string): ClassProgress;

// ----- Email invitations (6C) -----

model InviteInput {
  email: string;
}

/** A created invitation — the accept URL is returned so the teacher can share it directly too. */
model Invitation {
  email: string;
  acceptUrl: string;
}

model InvitationListItem {
  email: string;
  accepted: boolean;
}

model InvitationList {
  items: InvitationListItem[];
}

/** Invite an email to the class (owner only) — emails an accept link. */
@route("/classrooms/{id}/invitations")
@tag("classrooms")
@post
op inviteToClassroom(@path id: string, @body body: InviteInput): {
  @statusCode statusCode: 201;
  @body body: Invitation;
};

/** The class's invitations (owner only). */
@route("/classrooms/{id}/invitations")
@tag("classrooms")
@get
op listInvitations(@path id: string): InvitationList;

/** Accept an invitation token → the signed-in user joins the class. */
@route("/classrooms/invitations/{token}/accept")
@tag("classrooms")
@post
op acceptInvitation(@path token: string): Classroom;

// ===================== Localization (ADR 0034) =====================
// UI message strings served from the DB and edited via the admin CMS. Public reads
// deliver the published catalogue (cache-busted by a per-locale version); admin ops are RBAC-gated.

/** The published-catalogue version tag per locale (the web cache-bust / ETag signal). */
model LocaleVersions {
  versions: Record<string>;
}

/** A locale's full published catalogue: every published, non-deleted key → its string. */
model LocaleCatalogue {
  version: string;
  locale: string;
  messages: Record<string>;
}

/** One admin table row for a message string. */
model UiMessageAdminRow {
  id: string;
  locale: string;
  key: string;

  /** Latest edited value (pending until published). */
  draftValue?: string;

  /** Live value served to the site (null until first publish). */
  publishedValue?: string;

  status: string; // draft | published (draft ⇒ an unpublished edit is pending)

  /** true = pristine seeded baseline; false = added or edited at runtime. */
  seeded: boolean;

  /** true when soft-deleted (restorable). */
  deleted: boolean;

  updatedAt: string;

  /** Better Auth user id of the last editor, if known. */
  updatedBy?: string;
}

model UiMessageAdminList {
  items: UiMessageAdminRow[];
}

/** Create a new message string (starts as a draft, `seeded=false`). */
model UiMessageWriteInput {
  locale: string;
  key: string;
  value: string;
}

/** Edit an existing message's draft value. */
model UiMessageEditInput {
  value: string;
}

/** One entry in a message's change history. */
model UiMessageRevisionSummary {
  id: string;
  action: string; // create | update | delete | restore | publish
  value?: string;
  editedBy?: string;
  editedAt: string;
}

model UiMessageRevisionList {
  items: UiMessageRevisionSummary[];
}

/** Publish drafts for one locale, or all locales when `locale` is omitted. */
model PublishLocaleInput {
  locale?: string;
}

/** Current published-catalogue versions for every locale. */
@route("/i18n/version")
@tag("localization")
@get
op getLocaleVersions(): LocaleVersions;

/** A locale's published catalogue (served with an ETag; supports conditional GET). */
@route("/i18n/catalogue/{locale}")
@tag("localization")
@get
op getLocaleCatalogue(@path locale: string): LocaleCatalogue;

/** List message strings for the admin table (all locales/statuses; optional filters). */
@route("/admin/i18n/messages")
@tag("localization")
@get
op listUiMessages(
  @query search?: string,
  @query locale?: string,
  @query status?: string,
  @query includeDeleted?: boolean,
): UiMessageAdminList;

/** Create a message string (draft). */
@route("/admin/i18n/messages")
@tag("localization")
@post
op createUiMessage(@body body: UiMessageWriteInput): {
  @statusCode statusCode: 201;
  @body body: UiMessageAdminRow;
};

/** Edit a message's draft value. */
@route("/admin/i18n/messages/{id}")
@tag("localization")
@put
op updateUiMessage(@path id: string, @body body: UiMessageEditInput): UiMessageAdminRow | {
  @statusCode statusCode: 404;
  @body body: ProblemDetails;
};

/** Soft-delete a message (restorable); returns the updated row. */
@route("/admin/i18n/messages/{id}")
@tag("localization")
@delete
op deleteUiMessage(@path id: string): UiMessageAdminRow | {
  @statusCode statusCode: 404;
  @body body: ProblemDetails;
};

/** Restore a soft-deleted message. */
@route("/admin/i18n/messages/{id}/restore")
@tag("localization")
@post
op restoreUiMessage(@path id: string): UiMessageAdminRow;

/** A message's change history (newest first). */
@route("/admin/i18n/messages/{id}/revisions")
@tag("localization")
@get
op listUiMessageRevisions(@path id: string): UiMessageRevisionList;

/** Restore a prior revision's value as the current draft. */
@route("/admin/i18n/messages/{id}/revisions/{revisionId}/restore")
@tag("localization")
@post
op restoreUiMessageRevision(@path id: string, @path revisionId: string): UiMessageAdminRow;

/** Publish pending drafts (one locale, or all) → bumps the catalogue version(s). */
@route("/admin/i18n/publish")
@tag("localization")
@post
op publishUiMessages(@body body: PublishLocaleInput): LocaleVersions;

/** A locale the CMS can author strings for (a superset of the routing locales). */
model LocaleInfo {
  code: string;
  label: string;
}

model LocaleList {
  items: LocaleInfo[];
}

/** Register a new locale so the CMS can author + import its strings. */
model CreateLocaleInput {
  code: string;
  label: string;
}

/** Bulk import a locale's strings from a flat key→value map (upserted as drafts). */
model ImportStringsInput {
  locale: string;

  /** Optional label used to auto-register the locale if it does not exist yet. */
  label?: string;

  entries: Record<string>;
}

model ImportResult {
  imported: int32;
}

/** The locales the CMS knows about (for the admin locale pickers). */
@route("/i18n/locales")
@tag("localization")
@get
op getLocales(): LocaleList;

/** Register a new locale (code + label) so its strings can be authored/imported. */
@route("/admin/i18n/locales")
@tag("localization")
@post
op createLocale(@body body: CreateLocaleInput): {
  @statusCode statusCode: 201;
  @body body: LocaleInfo;
};

/** Bulk-import strings for a locale from a key→value map (drafts; auto-registers the locale). */
@route("/admin/i18n/import")
@tag("localization")
@post
op importUiMessages(@body body: ImportStringsInput): ImportResult;

// ===================== Content translations (ADR 0034, Phase 2) =====================
// Per-locale translations of catalogue/collection/help *content* fields (title/summary/body…). Overlaid
// onto read responses when a request carries `?locale=`; authored here (RBAC-gated, draft→publish→
// revisions + soft delete). Only published, non-deleted rows overlay; missing fields fall back to base.

model EntityTranslationRow {
  id: string;
  entityType: string; // content | collection | help
  entityId: string;
  locale: string;
  field: string; // title | summary | bodyMdx | …
  draftValue?: string;
  publishedValue?: string;
  status: string; // draft | published
  deleted: boolean;
  updatedAt: string;
  updatedBy?: string;
}

model EntityTranslationList {
  items: EntityTranslationRow[];
}

/** Upsert a field translation — create the row or edit its draft. */
model TranslationUpsertInput {
  entityType: string;
  entityId: string;
  locale: string;
  field: string;
  value: string;
}

model TranslationRevisionSummary {
  id: string;
  action: string; // create | update | delete | restore
  value?: string;
  editedBy?: string;
  editedAt: string;
}

model TranslationRevisionList {
  items: TranslationRevisionSummary[];
}

/** Publish pending translation drafts for an entity (or all when omitted). */
model TranslationPublishInput {
  entityType?: string;
  entityId?: string;
}

model TranslationPublishResult {
  published: int32;
}

/** List content-field translations for the admin editor (optionally filtered). */
@route("/admin/translations")
@tag("localization")
@get
op listTranslations(
  @query entityType?: string,
  @query entityId?: string,
  @query locale?: string,
  @query includeDeleted?: boolean,
): EntityTranslationList;

/** Create or edit a field translation's draft. */
@route("/admin/translations")
@tag("localization")
@put
op upsertTranslation(@body body: TranslationUpsertInput): EntityTranslationRow;

/** Soft-delete a translation (restorable); returns the updated row. */
@route("/admin/translations/{id}")
@tag("localization")
@delete
op deleteTranslation(@path id: string): EntityTranslationRow | {
  @statusCode statusCode: 404;
  @body body: ProblemDetails;
};

/** Restore a soft-deleted translation. */
@route("/admin/translations/{id}/restore")
@tag("localization")
@post
op restoreTranslation(@path id: string): EntityTranslationRow;

/** A translation's change history (newest first). */
@route("/admin/translations/{id}/revisions")
@tag("localization")
@get
op listTranslationRevisions(@path id: string): TranslationRevisionList;

/** Publish pending translation drafts (for an entity, or all) → they overlay live reads. */
@route("/admin/translations/publish")
@tag("localization")
@post
op publishTranslations(@body body: TranslationPublishInput): TranslationPublishResult;

// ===================== Feature flags (ADR 00XX) =====================
// Flag configuration lives in the DB and is toggled per environment via the admin CMS.
// The public snapshot feeds the web SSR OpenFeature provider (@TheY2T/tmr-flags-eval); it is cache-busted
// by a per-environment version tag (ETag / conditional GET → 304). Admin CRUD ops land in a later slice.

/** One flag's resolved configuration for an environment (as evaluated by @TheY2T/tmr-flags-eval). */
model FeatureFlagSettingDto {
  key: string;

  /** Admin master switch for this environment (off ⇒ the feature is off). */
  enabled: boolean;

  /** Variant returned when enabled and no targeting rule matches (e.g. "on"). */
  defaultVariant: string;

  /** Named variant → value map (e.g. { on: true, off: false }). */
  variants: Record<unknown>;

  /** Optional flagd-style JSONLogic targeting rule; null ⇒ use defaultVariant. */
  targeting: unknown;

  /** Code-registry fallback used if a variant can't be resolved. */
  defaultValue: unknown;
}

/** The full evaluatable snapshot for one environment + its version tag. */
model FeatureFlagSnapshot {
  environment: string;
  version: string;
  flags: Record<FeatureFlagSettingDto>;
}

/** A deployable environment flags can be targeted at. */
model FeatureFlagEnvironmentDto {
  key: string;
  label: string;
  rank: int32;
  isDefault: boolean;
}

model FeatureFlagEnvironmentList {
  items: FeatureFlagEnvironmentDto[];
}

/** The evaluatable snapshot for an environment (public; consumed by the web SSR provider). Cache-busted
 *  by the per-environment version via ETag / conditional GET → 304. */
@route("/feature-flags/snapshot/{env}")
@tag("feature-flags")
@get
op getFeatureFlagSnapshot(@path env: string): FeatureFlagSnapshot;

/** The active (non-deleted, non-archived) environments, for the admin environment picker. */
@route("/feature-flags/environments")
@tag("feature-flags")
@get
op listFeatureFlagEnvironments(): FeatureFlagEnvironmentList;

// --- Feature-flag admin CRUD (ADR 00XX) — RBAC-gated (`featureFlags` resource, admin-only) + method-level
//     flag-gated on `admin.feature-flags`. Toggles apply immediately (no draft/publish); the revision log
//     records every change. Every write bumps the affected environment's version tag. ---

model FeatureFlagSettingAdmin {
  environmentId: string;
  environmentKey: string;
  enabled: boolean;
  defaultVariant: string;
  variants: Record<unknown>;
  targeting: unknown;
}

model FeatureFlagAdminRow {
  id: string;
  key: string;
  description: string;
  domain: string;
  flagType: string;
  defaultValue: unknown;
  source: string; // code | runtime
  seeded: boolean;
  deleted: boolean;
  updatedAt: string;
  updatedBy?: string;
  settings: FeatureFlagSettingAdmin[];
}

model FeatureFlagAdminList {
  items: FeatureFlagAdminRow[];
}

/** Create a new (runtime) flag; initialised disabled in every environment. */
model CreateFeatureFlagInput {
  key: string;
  description?: string;
  defaultValue?: boolean;
}

/** Edit a flag's registry fields (not per-environment). */
model UpdateFeatureFlagInput {
  description?: string;
  defaultValue?: boolean;
}

/** Upsert one flag's per-environment setting (the core toggle + targeting). */
model FlagSettingWriteInput {
  enabled?: boolean;
  defaultVariant?: string;
  variants?: Record<unknown>;
  targeting?: unknown;
}

model FlagRevisionRow {
  id: string;
  flagId?: string;
  flagKey?: string;
  environmentId?: string;
  environmentKey?: string;
  action: string;
  before?: unknown;
  after?: unknown;
  actorId?: string;
  createdAt: string;
}

model FlagRevisionList {
  items: FlagRevisionRow[];
}

model FlagEnvironmentAdminRow {
  id: string;
  key: string;
  label: string;
  rank: int32;
  isDefault: boolean;
  archived: boolean;
  deleted: boolean;
  updatedAt: string;
}

model FlagEnvironmentAdminList {
  items: FlagEnvironmentAdminRow[];
}

model CreateEnvironmentInput {
  key: string;
  label: string;
  rank?: int32;
  isDefault?: boolean;
}

model UpdateEnvironmentInput {
  label?: string;
  rank?: int32;
  isDefault?: boolean;
  archived?: boolean;
}

/** Bulk-import flags from a flags.json-shaped map (`key → { variants, defaultVariant, targeting, … }`). */
model ImportFlagsInput {
  entries: Record<unknown>;
}

model ImportFlagsResult {
  imported: int32;
}

/** List flags with their per-environment settings for the admin matrix. */
@route("/admin/feature-flags/flags")
@tag("feature-flags")
@get
op listFeatureFlags(
  @query search?: string,
  @query domain?: string,
  @query includeDeleted?: boolean,
): FeatureFlagAdminList;

/** Create a new runtime flag. */
@route("/admin/feature-flags/flags")
@tag("feature-flags")
@post
op createFeatureFlag(@body body: CreateFeatureFlagInput): {
  @statusCode statusCode: 201;
  @body body: FeatureFlagAdminRow;
};

/** Edit a flag's registry fields. */
@route("/admin/feature-flags/flags/{id}")
@tag("feature-flags")
@put
op updateFeatureFlag(@path id: string, @body body: UpdateFeatureFlagInput): FeatureFlagAdminRow | {
  @statusCode statusCode: 404;
  @body body: ProblemDetails;
};

/** Soft-delete a flag (restorable). */
@route("/admin/feature-flags/flags/{id}")
@tag("feature-flags")
@delete
op deleteFeatureFlag(@path id: string): FeatureFlagAdminRow | {
  @statusCode statusCode: 404;
  @body body: ProblemDetails;
};

/** Restore a soft-deleted flag. */
@route("/admin/feature-flags/flags/{id}/restore")
@tag("feature-flags")
@post
op restoreFeatureFlag(@path id: string): FeatureFlagAdminRow;

/** Upsert one flag's setting for one environment (enable/disable + targeting). */
@route("/admin/feature-flags/flags/{id}/settings/{envId}")
@tag("feature-flags")
@put
op upsertFlagSetting(
  @path id: string,
  @path envId: string,
  @body body: FlagSettingWriteInput,
): FeatureFlagAdminRow | {
  @statusCode statusCode: 404;
  @body body: ProblemDetails;
};

/** A flag's change history (newest first). */
@route("/admin/feature-flags/flags/{id}/revisions")
@tag("feature-flags")
@get
op listFeatureFlagRevisions(@path id: string): FlagRevisionList;

/** The whole change history (newest first). */
@route("/admin/feature-flags/revisions")
@tag("feature-flags")
@get
op listAllFeatureFlagRevisions(): FlagRevisionList;

/** Bulk-import flags from a flags.json-shaped payload. */
@route("/admin/feature-flags/import")
@tag("feature-flags")
@post
op importFeatureFlags(@body body: ImportFlagsInput): ImportFlagsResult;

/** List environments (for the admin environment manager). */
@route("/admin/feature-flags/environments")
@tag("feature-flags")
@get
op listAdminEnvironments(@query includeInactive?: boolean): FlagEnvironmentAdminList;

/** Create a new environment (backfills a setting for every flag). */
@route("/admin/feature-flags/environments")
@tag("feature-flags")
@post
op createEnvironment(@body body: CreateEnvironmentInput): {
  @statusCode statusCode: 201;
  @body body: FlagEnvironmentAdminRow;
};

/** Edit an environment. */
@route("/admin/feature-flags/environments/{id}")
@tag("feature-flags")
@put
op updateEnvironment(@path id: string, @body body: UpdateEnvironmentInput): FlagEnvironmentAdminRow | {
  @statusCode statusCode: 404;
  @body body: ProblemDetails;
};

/** Soft-delete an environment. */
@route("/admin/feature-flags/environments/{id}")
@tag("feature-flags")
@delete
op deleteEnvironment(@path id: string): FlagEnvironmentAdminRow | {
  @statusCode statusCode: 404;
  @body body: ProblemDetails;
};
