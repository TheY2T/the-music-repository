/** RFC 9457 Problem Details, plus our stable extension members. */
export interface ProblemDetails {
  /** URI identifying the problem category (documented in the OpenAPI spec). */
  type: string;
  /** Short, stable, human summary of the problem type. */
  title: string;
  /** HTTP status code (MUST equal the response status). */
  status: number;
  /** Human explanation of this specific occurrence. */
  detail?: string;
  /** URI identifying this specific occurrence (e.g. the request path). */
  instance?: string;
  /** Extension: stable machine-readable code — the programmatic contract. */
  code: string;
  /** Extension: W3C trace id for support correlation. */
  traceId?: string;
  /** Extension: field-level validation errors. */
  errors?: ProblemFieldError[];
  /** Extension: link to human documentation for this code. */
  docUrl?: string;
  [key: string]: unknown;
}

export interface ProblemFieldError {
  pointer?: string;
  code?: string;
  detail?: string;
}
