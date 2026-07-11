# System architecture

Deployment topology and request/data flow. Runs as a single podman-compose stack.

```mermaid
flowchart LR
  user([Browser])
  subgraph pod["podman-compose network"]
    web["apps/web<br/>Astro SSR + React islands<br/>Tailwind v4 + shadcn"]
    api["apps/api<br/>NestJS (hexagonal)"]
    flagd["flagd<br/>OpenFeature provider<br/>gRPC 8013 / OFREP 8016"]
    db[("Postgres 16<br/>app data")]
  end
  user -->|HTTPS| web
  web -->|"REST (typed via @TheY2T/tmr-contracts)"| api
  web -->|"SSR + island flag eval"| flagd
  api -->|Drizzle| db
  api -->|"flag eval (gRPC)"| flagd
  api -.->|"Better Auth: Google + Microsoft OIDC (Phase 1)"| idp[[Google / Microsoft Entra]]
  flagd -. hot-reload .- flagsfile["flags/flags.json (git)"]
```

## Services

| Service | Tech | Ports | Notes |
|---|---|---|---|
| `web` | Astro SSR (`@astrojs/node`) | 4321 | React islands; evaluates flags in middleware per request |
| `api` | NestJS | 3000 | Hexagonal; `GET /health`, flag-gated demo routes |
| `flagd` | OpenFeature flag daemon | 8013 (gRPC), 8016 (OFREP) | Flags from `flags/flags.json`, no DB/UI |
| `db` | Postgres 16 | 5432 | App data via Drizzle; healthchecked |

Auth (Phase 1) uses Better Auth with Google + Microsoft/Entra OIDC and session cookies.
