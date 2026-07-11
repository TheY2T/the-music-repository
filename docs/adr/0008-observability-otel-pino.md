# ADR 0008 — Observability: OpenTelemetry + Pino, OTLP → self-hosted Grafana stack

- **Status:** Accepted
- **Context:** Enterprise-grade traces, metrics, and structured logs, vendor-neutral and self-hostable.
- **Decision:** **OpenTelemetry** (`@opentelemetry/sdk-node` + auto-instrumentations) preloaded via
  `node --require ./dist/otel.js` (and imported first in `main.ts`) so instrumentation patches modules
  before Nest/pg load. **Pino** (`nestjs-pino`) for structured JSON logs with redaction; automatic
  `trace_id`/`span_id` injection. Apps export **OTLP → OpenTelemetry Collector → Tempo (traces) /
  Loki (logs) / Prometheus (metrics) / Grafana** — all in `infra/podman/observability`. Swapping to a
  SaaS (Grafana Cloud/Honeycomb/Datadog) is a one-file collector change.
- **Hexagonal placement:** the **domain stays OTEL-free**. Logging/tracing/context are exposed as
  **ports** (`AppLogger`, `Tracer`, `RequestContext` in `@TheY2T/tmr-observability`; named for the
  capability per ADR 0012) with
  Pino/OTEL/ALS adapters. Request context uses **AsyncLocalStorage** (nestjs-cls), not REQUEST-scoped DI.
- **Record-once:** the tracing interceptor marks the span ERROR; the ProblemDetails filter is the sole
  log site — no double logging/span-recording.
- **Ops:** `ParentBased(TraceIdRatio)` sampler (1.0 dev / 0.1 prod), `BatchSpanProcessor`, graceful
  shutdown. `pnpm obs:up` starts the stack; Grafana at http://localhost:3001.
