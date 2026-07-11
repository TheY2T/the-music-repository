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
