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
