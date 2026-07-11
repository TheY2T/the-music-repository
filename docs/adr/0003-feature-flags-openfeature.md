# ADR 0003 — Feature flags: OpenFeature + flagd

- **Status:** Accepted
- **Context:** Every phase ships behind a flag; we want vendor-neutrality and cheap self-hosting.
- **Decision:** **OpenFeature** (CNCF, vendor-neutral) as the abstraction + **flagd** as the
  self-hosted provider — flags are JSON in git (`flags/flags.json`), no DB/UI, one container.
- **Wiring:** NestJS via `@openfeature/nestjs-sdk` (`contextFactory`, `@RequireFlagsEnabled`);
  Astro SSR via `@openfeature/server-sdk` in middleware; islands via `@openfeature/react-sdk`.
  Keys + eval-context shape live in `@TheY2T/tmr-flags`.
- **Consequences:** Swapping to Flipt/Flagsmith (toggle UI) or GrowthBook (experiment stats) is a
  one-line provider change. Premium entitlements (Phase 6) can be modelled as role-targeted flags.
