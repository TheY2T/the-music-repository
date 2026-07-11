# ADR 0007 — Error handling: RFC 9457 Problem Details + domain-error taxonomy

- **Status:** Accepted
- **Context:** Every service needs one consistent error envelope that categorises failures and gives
  upstream callers safe, actionable messages while logging full detail internally.
- **Decision:** Responses use **RFC 9457** `application/problem+json` with stable extension members
  `code` (UPPER_SNAKE_CASE, immutable — clients branch on this, never the message), `traceId`,
  `errors[]`, `docUrl`. `@TheY2T/tmr-errors` holds the **framework-free** `DomainError` hierarchy
  (stable `code` + `category`) so the domain can raise errors with zero framework imports. The
  `ProblemDetailsExceptionFilter` (in `@TheY2T/tmr-nest-platform`) is the **only** place HTTP status
  is decided — the anti-corruption boundary — and the single error **log** site.
- **Taxonomy:** category → status (`VALIDATION`→400, `UNPROCESSABLE`→422, `NOT_FOUND`→404,
  `CONFLICT`→409, `RATE_LIMIT`→429, `DEPENDENCY`→502, `TIMEOUT`→504, `INTERNAL`→500, …). Downstream
  failures are **re-categorised** in outbound adapters (never forward a dependency's status verbatim).
- **Consequences:** metadata is suppressed on 5xx (no internal leakage); `traceId` in every error body
  ties support tickets to traces + logs. Verified live: `/demo/error` → 404 problem+json with matching
  `traceId` in the response and the log line.
