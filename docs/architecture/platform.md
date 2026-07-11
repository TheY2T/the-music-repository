# Platform architecture (spec-first · errors · observability)

Cross-cutting foundation every backend feature builds on. See ADRs 0006–0009.

## Spec-first API pipeline

```mermaid
flowchart LR
  tsp["packages/api-spec<br/>TypeSpec (main.tsp)"] -->|tsp compile| oas["openapi.json 3.1<br/>(committed)"]
  oas -->|redocly lint · oasdiff gate| ci{{CI}}
  ci -->|Orval client:zod| be["@TheY2T/tmr-contracts<br/>generated Zod DTOs"]
  ci -.->|"Orval react-query (Phase 1)"| fe["@TheY2T/tmr-api-client"]
  be --> api["apps/api (NestJS)<br/>createZodDto"]
```
Paths live only in TypeSpec. `pnpm spec:generate` recompiles + regenerates; CI fails on drift.

## Package dependency layering

```mermaid
flowchart TD
  errors["@TheY2T/tmr-errors<br/>(pure — domain-safe)"]
  obs["@TheY2T/tmr-observability<br/>(nest + otel + pino, ports)"]
  plat["@TheY2T/tmr-nest-platform<br/>(PlatformModule + filter)"]
  errors --> plat
  obs --> plat
  plat --> api["apps/api"]
  errors -. domain imports .- api
```

## Request error flow (record-once)

```mermaid
flowchart TD
  d["domain: throw DomainError(code, category)"] --> uc["use-case"]
  uc --> ctrl["controller"]
  ctrl --> itc["TracingInterceptor<br/>span.recordException + setStatus(ERROR)"]
  itc --> flt["ProblemDetailsExceptionFilter<br/>category→status · problem+json · attach traceId · log ONCE"]
  flt --> resp["application/problem+json"]
```

## Observability data flow

```mermaid
flowchart LR
  api["apps/api<br/>sdk-node + Pino"] -->|OTLP :4317| col["OTel Collector"]
  col --> tempo[("Tempo · traces")]
  col --> loki[("Loki · logs")]
  col --> prom[("Prometheus · metrics")]
  tempo --> graf["Grafana :3001"]
  loki --> graf
  prom --> graf
```
`pnpm obs:up` starts the stack. Every Pino log inside a span carries `trace_id`/`span_id`; the same
`traceId` appears in problem+json error bodies — one id across error → span → log.
