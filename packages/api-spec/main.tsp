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
  kind: "score_pdf" | "audio" | "image" | "midi" | "musicxml";
  url: string;
  filename: string;
  mime: string;
  license?: string;
  attribution?: string;
}

/** List/card view of a catalogue item. */
model ContentSummary {
  slug: string;
  title: string;
  summary?: string;
  type: ContentType;
  difficulty?: int32;
  visibility: Visibility;
  genres: TaxonomyRef[];
  instruments: TaxonomyRef[];
  topics: TaxonomyRef[];
}

/** Full detail view of a catalogue item. */
model ContentDetail {
  ...ContentSummary;
  bodyMdx?: string;
  source?: string;
  attribution?: string;
  license?: string;
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
  types: FacetValue[];
  difficulties: FacetValue[];
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
  @query type?: ContentType,
  @query difficulty?: int32,
  @query page?: int32,
  @query pageSize?: int32,
): CatalogueList;

/** Fetch a single catalogue item (with taxonomy + presigned media) by slug. */
@route("/catalogue/items/{slug}")
@tag("catalogue")
@get
op getContentBySlug(@path slug: string): ContentDetail | {
  @statusCode statusCode: 404;
  @body body: ProblemDetails;
};

// ===================== Admin CMS (Slice 2b) =====================
// RBAC-gated authoring surface. Enforcement lives in NestJS guards; the contract documents shapes.

alias ContentStatus = "draft" | "review" | "published";
alias MediaKind = "score_pdf" | "audio" | "image" | "midi" | "musicxml";

/** Create/replace payload for a content item. Taxonomy is given as slug arrays. */
model ContentWriteInput {
  slug: string;
  title: string;
  summary?: string;
  bodyMdx?: string;
  type: ContentType;
  visibility?: Visibility;
  difficulty?: int32;
  source?: string;
  attribution?: string;
  license?: string;
  genres: string[];
  instruments: string[];
  topics: string[];
  tags: string[];
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
