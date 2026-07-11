# Feature: Observability (OpenTelemetry + Pino)

- **Phase:** P · **Status:** shipped
- **ADR:** [0008](../adr/0008-observability-otel-pino.md)

## What you get

- **Traces** — auto-instrumented HTTP/DB spans; add business spans via `Tracer.startActiveSpan`.
- **Logs** — Pino JSON with redaction; automatic `trace_id`/`span_id` on every line.
- **Metrics** — RED metrics + custom counters (nestjs-otel).
- All exported OTLP → Collector → Tempo/Loki/Prometheus → Grafana (http://localhost:3001).

## Using it (application layer — via ports, never SDKs directly)

```ts
constructor(
  @Inject(LOGGER) private readonly log: AppLogger,
  @Inject(TRACER) private readonly tracer: Tracer,
  @Inject(REQUEST_CONTEXT) private readonly ctx: RequestContext,
) {}
```
(Ports named for the capability, not the tech — see ADR 0012.)

The **domain** imports none of these — keep spans/logs in application/infrastructure.

## Run & verify

```bash
pnpm obs:up          # collector + tempo + loki + prometheus + grafana
pnpm --filter @TheY2T/tmr-api dev
curl localhost:3000/health
```
In Grafana: the request is a trace in Tempo and a Pino log in Loki sharing one `trace_id`
(Loki→Tempo derived field jumps between them). `pnpm obs:down` to stop.
