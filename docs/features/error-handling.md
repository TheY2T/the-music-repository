# Feature: Error handling (RFC 9457 Problem Details)

- **Phase:** P · **Status:** shipped
- **ADR:** [0007](../adr/0007-error-handling-rfc9457.md)

## Purpose

One consistent, categorised error envelope for every endpoint; safe messages to callers, full detail
in logs, correlated by `traceId`.

## How to raise an error

In the **domain** (framework-free), extend a category base from `@TheY2T/tmr-errors`:

```ts
import { NotFoundError } from '@TheY2T/tmr-errors';
export class TrackNotFoundError extends NotFoundError {
  readonly code = 'TRACK_NOT_FOUND';
  constructor(id: string) { super(`No track exists with id '${id}'.`, { id }); }
}
```

Throw it from a use-case. The `ProblemDetailsExceptionFilter` maps it to `application/problem+json`.
Add each new `code` to `docs/features/` docs and (later) a docs page for `docUrl`.

## Response shape

```json
{ "type": "…/problems/track-not-found", "title": "Track not found", "status": 404,
  "detail": "…", "instance": "/demo/error", "code": "TRACK_NOT_FOUND",
  "traceId": "…", "docUrl": "…/errors/TRACK_NOT_FOUND" }
```

## Verify

`curl -i localhost:3000/demo/error` → 404, `Content-Type: application/problem+json`, body `code`
`TRACK_NOT_FOUND`, and the `traceId` matches the error log line.
