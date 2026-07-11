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
