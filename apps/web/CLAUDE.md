# CLAUDE.md — apps/web (Astro)

Astro SSR + React islands + Tailwind v4 + shadcn/ui. See root `CLAUDE.md` for repo-wide rules.

## Structure

```
src/
  pages/*.astro        # routes (lowercase/kebab, [slug].astro for dynamic)
  components/*.tsx      # React islands (PascalCase files)
  components/ui/*.tsx   # shadcn components (Button, ...)
  lib/utils.ts          # cn() helper
  styles/global.css     # Tailwind v4 (@import) + shadcn tokens + dark mode (.dark)
  middleware.ts         # OpenFeature SSR eval → Astro.locals.flags (per request)
  env.d.ts              # App.Locals typing
```

## Islands rules

- **One island root per interactive unit.** Context-dependent shadcn (Dialog, Select, Tabs, Toast)
  must be composed inside a single `.tsx` island — React context does not cross island boundaries.
- Hydrate minimally: `client:load` only where immediately interactive; else `client:visible`/`idle`.
- Static markup stays in `.astro`.

## Feature flags

- **SSR:** `src/middleware.ts` sets the flagd provider and evaluates flags per request into
  `Astro.locals.flags`. Pass values into islands as **props** so first paint matches the server.
- **Island:** `src/components/FlagBanner.tsx` shows the react-sdk pattern (`OpenFeatureProvider` +
  `useFlag`). Phase 3 swaps the seeded InMemoryProvider for the OFREP web provider (live updates).

## Styling

Tailwind v4 is configured in CSS (`@import "tailwindcss"` + `@theme inline`), not a JS config.
shadcn config is `components.json`. Dark mode = `.dark` on `<html>`, set pre-paint in the layout.

## Commands

`pnpm --filter @TheY2T/tmr-web dev|build|preview|check-types|lint|test`
