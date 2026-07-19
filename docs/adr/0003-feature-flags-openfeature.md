# ADR 0003 — Feature flags: OpenFeature + flagd

- **Status:** Superseded by **ADR 0035** (DB-backed feature flags). The OpenFeature *abstraction* below is
  retained; the **flagd** provider + `flags/flags.json` file described here are replaced by a custom
  Postgres-backed provider with per-environment targeting and admin-CMS CRUD. Read ADR 0035 first.
- **Context:** Every phase ships behind a flag; we want vendor-neutrality and cheap self-hosting.
- **Decision:** **OpenFeature** (CNCF, vendor-neutral) as the abstraction + **flagd** as the
  self-hosted provider — flags are JSON in git (`flags/flags.json`), no DB/UI, one container.
- **Wiring:** NestJS via `@openfeature/nestjs-sdk` (`contextFactory`, `@RequireFlagsEnabled`);
  Astro SSR via `@openfeature/server-sdk` in middleware; islands via `@openfeature/react-sdk`.
  Keys + eval-context shape live in `@TheY2T/tmr-flags`.
- **Consequences:** Swapping to Flipt/Flagsmith (toggle UI) or GrowthBook (experiment stats) is a
  one-line provider change. Premium entitlements (Phase 6) can be modelled as role-targeted flags.
