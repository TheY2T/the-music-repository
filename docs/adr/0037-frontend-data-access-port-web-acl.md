# ADR 0037 — Frontend data-access port + `web-data` → `web-acl` anti-corruption layer

- **Status:** accepted
- **Date:** 2026-07
- **Supersedes (in part):** ADR 0033 (which named the data layer `@TheY2T/tmr-web-data`, framed it as a
  "data seam", and allowed the smart UI packages to depend on `@TheY2T/tmr-api-client` directly — both
  for the `ApiProvider`/generated hooks and for DTO types).

## Context

After ADR 0033, the UI packages `@TheY2T/tmr-musickit-ui` and `@TheY2T/tmr-common-ui` depended directly
on `@TheY2T/tmr-api-client`: ten island components imported `ApiProvider` + generated TanStack-Query
hooks (`useSearchCatalogue`, `useGetHealth`, …) and self-wrapped in `<ApiProvider>`, and both packages
(plus the data layer) imported api-client DTO types type-only. `apps/web` depended on api-client only to
bundle it.

This coupled the reusable UI to a generated, technology-specific client — the exact leak a hexagonal
architecture avoids on the backend. We want the same inversion on the frontend: the UI depends on an
**abstract data-access port**; the concrete api-client-backed implementation is owned by one seam and
bootstrapped by the composition root (`apps/web`).

## Decision

1. **Rename `@TheY2T/tmr-web-data` → `@TheY2T/tmr-web-acl`** (folder `packages/web-data` →
   `packages/web-acl`) and frame it as the **anti-corruption layer**: the single UI-facing package
   allowed to name `@TheY2T/tmr-api-client`. Its DAG position is unchanged
   (`… → music-core → web-acl → musickit-ui → common-ui → apps/web`).

2. **DTO boundary — `@TheY2T/tmr-web-acl/dto`.** web-acl re-exports the DTO types the UI needs
   (`ContentSummary`, `CollectionSummary`, `HelpTopic`, …). UI packages import DTO types from here, never
   from api-client. (The names exist only in api-client's orval `model/*`, not in
   `@TheY2T/tmr-contracts`, so the ACL re-export is the correct source.)

3. **Data-access port — `@TheY2T/tmr-web-acl/api-data`.** A React context carries an `ApiDataPort` — a
   set of hook functions (`useSearchCatalogue`, `useGetHealth`, …) whose types are inferred from the
   concrete generated hooks. `ApiDataProvider` composes a per-root `QueryClient` (via
   `createQueryClient` from api-client) + injects the concrete `apiClientPort`; `useApiData()` reads it.
   The provider accepts a `port` override for tests/Storybook. UI islands call
   `const { useSearchCatalogue } = useApiData()` instead of importing the hook — so **no UI source names
   api-client and no UI `package.json` depends on it** (nor on `@tanstack/react-query`, which moves into
   web-acl).

4. **Web-app-scoped island relaxation.** ADR 0033's "one island root per unit; React context doesn't
   cross islands" still holds for package authors, **but `apps/web` may bind a provider at the root of an
   interactive region** so the components in that region inherit it. `apps/web` owns an `AppProviders`
   composition and thin per-region island wrappers (`src/components/islands/*`,
   `withAppProviders(Island)`); pages mount the wrapped island. The provider element and its concrete
   api-client binding live in `web-acl`; `apps/web` decides where they mount. (Astro serializes island
   props, so the port cannot be passed across the island boundary as a prop — it must be provided inside
   the React root, which the wrapper does.)

5. **`ApiProvider` is removed from api-client** (only `createQueryClient` remains, consumed by web-acl).

## Consequences

- The UI packages are decoupled from the data-fetching technology: swapping the client, or injecting a
  mock/offline port, is a web-acl/`apps/web` concern, invisible to the UI.
- One anti-corruption layer owns every mention of api-client (hooks, DTO types, query client). The DAG
  stays acyclic; no new dependencies point into the UI packages.
- Each region gets its own `QueryClient` (per-root `useState`), replacing the previous module-singleton —
  region caches are isolated, and there is no cross-request state leak.
- `apps/web` gains a small set of thin wrapper islands (composition, not complex UI) — consistent with
  its shell role. Today no page co-renders two provider-needing islands, so the shared-region provider is
  mostly headroom; it pays off as more hook-based components land on a page.

## Alternatives considered

- **Keep the provider self-wrapped in each UI island (sourced from web-acl).** Less churn, but the
  provider element and its binding would live in the UI layer, not the composition root — weaker
  inversion and no path to app-level provider composition.
- **Pass the port from `apps/web` as an island prop.** Impossible: Astro serializes island props, so the
  hook-bearing port cannot cross the SSR→client boundary.
- **Source DTO types from `@TheY2T/tmr-contracts`.** Its generated Zod schemas are operation-shaped with
  different names; reworking that generation is orthogonal and larger than the ACL re-export.
