# Conventions

## Package naming

Every workspace package is scoped **`@TheY2T/tmr-*`** (e.g. `@TheY2T/tmr-contracts`). Folder names
stay kebab-case; the scoped name lives in `package.json`.

## Casing

| Thing | Casing | Example |
|---|---|---|
| folders, `apps/api` TS files | kebab-case | `create-content.use-case.ts` |
| `apps/web` component files | PascalCase | `HealthCard.tsx` |
| Astro pages / routes | lowercase / kebab | `sign-in.astro`, `[slug].astro` |
| classes / types / enums / DTOs | PascalCase | `CheckHealthUseCase` |
| variables / functions | camelCase (`is/has/should` for booleans) | `findByEmail` |
| constants / enum members / env | UPPER_SNAKE | `DATABASE_URL` |
| DB columns (Postgres) | snake_case → camelCase in code | `created_at` |

Enforced via Biome `useFilenamingConvention` (per package) and CI (macOS/Windows case-insensitive
filesystems otherwise pass locally but break Linux containers).

## Folder rules

- Backend features are hexagonal folders (`domain/`, `application/`, `infrastructure/`, `dto/`).
- No nested workspace packages; prefer `exports` over barrel files.

## Ports & adapters (hexagonal — see ADR 0012)

- **Ports** are named for the **capability the application core needs**, in the domain's ubiquitous
  language — **never the technology, and no `Port` suffix** on the identifier. Examples:
  `ContentRepository`, `CatalogueSearch`, `MediaLibrary`, `DatastoreHealthCheck`, `AppLogger`,
  `Tracer`, `RequestContext`. (`Repository` is DDD language and is kept.)
- **Adapters** are named `<Technology><Capability>`: `DrizzleContentRepository`,
  `MeilisearchCatalogueSearch`, `S3MediaLibrary`, `PinoAppLogger`, `OtelTracer`, `ClsRequestContext`.
- Use-cases inject the **port**; the module binds `{ provide: <PortClass>, useClass: <Adapter> }`.
- Files keep the `application/ports/*.port.ts` / `infrastructure/*.adapter.ts` role markers (a discovery
  aid — the filename may mark the role; the identifier stays technology-free).

## Icons (web UI — ADR 0019)

- **No emoji/unicode as icons** in `apps/web`. Use the **`Icon` atom** from `@TheY2T/tmr-ui`
  (`<Icon name="lock" className="size-4" />`) in React, and `@TheY2T/tmr-ui/astro/Icon.astro` in
  `.astro`. Both are Lucide. Add an icon via the registry in `packages/ui/src/components/ui/icon.tsx`.
- **Never bake glyphs into i18n strings** — render an icon beside the localized text.
- **Exception:** music-notation glyphs (`♯ ♭ ♮ ♪ ♩`), hand-drawn SVG rests, guitar open-string
  markers (`○`/`×`), strum-direction markers (`↓`/`↑`/`·`), and typographic arrows inside prose are
  content/notation, not icons — leave them. See `docs/features/icons.md`.

## Localization / i18n (web UI strings — ADR 0017)

- **No hardcoded user-facing strings** in `apps/web`. Every UI string goes through `t(locale, key)` from
  `@TheY2T/tmr-i18n`; the locale comes from `Astro.locals.locale` and is passed into islands as a plain
  `locale` prop (never React context — it can't cross island boundaries).
- **Message keys** live in `@TheY2T/tmr-i18n-locales` (`en.json` = source of truth for keys;
  `zh-Hans.json` = Simplified Chinese, missing → English). Naming: `domain.thing` (camelCase after the
  dot). Shared `tool.<slug>.*` keys back both the `/tools` hub and each tool page.
- **Never duplicate** message strings — add a key once, reference it everywhere.
- **Left language-neutral by design:** music-theory tokens (note names, chord symbols, Roman numerals),
  technical names (MusicXML/MEI/Verovio/MIDI/CAGED), and API/DB data (content titles, taxonomy names).
- Pages use `BaseLayout.astro` (owns `<html lang>`, hreflang, dark-mode script, language switcher) and
  build internal links with `localizedPath(locale, path)`. See the `add-translations` skill.

## Testing (ADR 0020 · docs/features/testing.md)

- **Tests are Definition of Done.** Every feature ships with tests: unit for logic/use-cases,
  component for islands/UI, E2E for user flows. Follow the **`add-tests`** skill.
- **Naming:** unit/component tests are `*.test.ts(x)` colocated with the source; API integration tests
  (real Postgres via Testcontainers) are `*.integration.test.ts`; Playwright E2E specs are
  `apps/web/e2e/*.spec.ts`.
- **Runner config is shared** — one line per package via `@TheY2T/tmr-config-vitest`
  (`nodePreset()` / `reactPreset()`); never hand-roll env/coverage config.
- **Hexagonal:** unit-test API use-cases by **mocking ports** (never Drizzle); reserve real Postgres
  for `*.integration.test.ts`. Assert domain errors surface as RFC 9457 problem+json.
- **i18n-by-prop holds in tests:** pass `locale` as a prop; render the island root (context doesn't
  cross islands). Keep the `en`↔`zh-Hans` catalogue parity guard green.
- **E2E selectors:** `getByRole` / `getByLabel` / `getByText` first, `getByTestId` last; no manual
  sleeps (web-first assertions auto-wait). E2E runs mocked (default) or live — see the feature doc.
- **Commands:** `pnpm test | test:watch | test:coverage | test:integration | test:e2e | test:e2e:live`.
