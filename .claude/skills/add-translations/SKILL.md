---
name: add-translations
description: Add or use localized UI strings in the web app (English + 中文 zh-Hans) via @TheY2T/tmr-i18n. Use whenever adding a new page/island or any user-facing text, or adding a new language. UI strings are DB-backed + admin-managed (ADR 0034); the in-repo JSON is the seed/type/fallback. See docs/features/i18n.md + ADR 0017/0034.
---

# add-translations

Every user-facing UI string in `apps/web` goes through `t(locale, key)` — no hardcoded English. Locale
is resolved in middleware (`Astro.locals.locale`) and passed into islands as a plain `locale` prop. At
runtime, string **values** come from the database (ADR 0034); the in-repo JSON seeds them and is the
compile-time key type + fallback.

## 1. Add / change the string — two paths

**A. Change wording or a translation for an existing key, or add a runtime-only string** (no code change,
no redeploy): do it in the **admin CMS** — the **Localization** section (`/admin/localization`), which
manages the general-site **UI strings**. The table is grouped by key; edit a key to manage all its locales,
or **Add string** / **Import** a key→value JSON, then **Publish**. Live within seconds. Admins can also
**create new locales** and **export** a locale's strings (filterable by origin) here. To translate
**content** (catalogue / collection / help item text) instead of UI strings, open that item in its own admin
editor (`/admin/content|collections|help/<slug>/edit`) and use the embedded **Localization** section
(`ContentLocalizationEditor`) — locale tabs + the block editor for body fields. A brand-new locale is translatable/servable immediately, but wiring it into URL routing +
the switcher is still a deploy (see §Adding a language). This is the normal path for copy + translation work.

**B. Add a brand-new key that typed code references** (`t(locale, 'new.key')` in a page/island): add it
to the in-repo catalogues so `MessageKey` widens and the key seeds, then ship once:
- `packages/i18n-locales/src/en.json` — the **key type source** (`MessageKey = keyof typeof en`) + seed.
- `packages/i18n-locales/src/zh-Hans.json` — the Simplified Chinese seed value (missing → English).

After deploy + `db:seed`, that key's wording is CMS-editable like any other (path A).

Key naming: `domain.thing` (camelCase after the dot), e.g. `catalogue.search`, `upgrade.subtitle`.
Interpolate with `{name}` placeholders: `"catalogue.results": "{count} results"`.

**No glyphs in strings.** Never embed emoji or unicode icon-glyphs (`←`/`→` arrows, `✓`, `♥`, `🎉`,
etc.) in a value. Keep the string plain text and render an `<Icon>` beside it (ADR 0019 /
`docs/features/icons.md`). (Music-notation glyphs like `♯♭♮` are the exception — see §4.)

For path B, rebuild so the new keys/types are available:
`pnpm --filter @TheY2T/tmr-i18n-locales --filter @TheY2T/tmr-i18n build`

## 2. Use it — `.astro` page

```astro
---
import BaseLayout from '@/layouts/BaseLayout.astro';
import { localizedPath, t } from '@TheY2T/tmr-i18n';
const locale = Astro.locals.locale;
---
<BaseLayout title={`${t(locale, 'foo.title')} — ${t(locale, 'site.name')}`}>
  <a href={localizedPath(locale, '/tools')}>{t(locale, 'common.backTools')}</a>
  <h1>{t(locale, 'foo.title')}</h1>
  <MyIsland client:load locale={locale} />
</BaseLayout>
```
- Wrap **every** internal link with `localizedPath(locale, '/path')` so a zh page stays in Chinese.
- Never write a bare `<html>`/`<head>` — use `BaseLayout` (it owns `<html lang>`, dark-mode script,
  hreflang, and the language switcher).

## 3. Use it — React island

```tsx
import { type Locale, t } from '@TheY2T/tmr-i18n';
export default function MyIsland({ locale }: { locale: Locale }) {
  return <button>{t(locale, 'foo.save')}</button>;
}
```
- Add `locale: Locale` to the component props; thread it to any sub-component that renders text.
- Pass params: `t(locale, 'catalogue.results', { count })`.
- For a value that maps to one of several keys, build a typed `MessageKey`:
  `const key: MessageKey = x === 'pro' ? 'tier.pro' : 'tier.premium';`
- **Design-system components (`@TheY2T/tmr-ui`) are i18n-by-prop** — they never call `t()`. Resolve
  the string in the app and pass it in: `<Field label={t(locale, 'form.title')}>…`,
  `<Button>{t(locale, 'foo.save')}</Button>`. Never hardcode text inside a library component (ADR 0018).

## 4. Don't translate

Music-theory tokens (note names, chord symbols, Roman numerals), technical names (MusicXML/MEI/Verovio/
MIDI/CAGED), and **API/DB data** (content titles, taxonomy, user/classroom names). Those are either
language-neutral or a separate backend/DB-content concern.

## 5. Verify

`pnpm --filter @TheY2T/tmr-web check-types lint` (0 errors; the `MessageKey` type catches unknown/missing
keys). Then browser-check the page at `/` (en) and `/zh/…` (zh); confirm `<html lang>` and no hydration
flash. Clean up any Playwright artifacts.

## Adding a whole language

See "Adding a language" in `docs/features/i18n.md`: drop `src/<locale>.json`, export it, register in
`@TheY2T/tmr-i18n` (`LOCALES`/`URL_PREFIX`/`LOCALE_LABELS`/`htmlLang`/`matchAcceptLanguage`), rebuild.

## Tests (Definition of Done — `add-tests` skill)

- The **seed parity guard** (`packages/i18n-locales/src/index.test.ts`) fails on orphan `zh-Hans` keys or
  blank values — keep it green after editing the JSON seed (`pnpm --filter @TheY2T/tmr-i18n-locales test`).
- Admin CMS changes (path A) need no test edit — the manager is covered by
  `packages/common-ui/src/AdminLocaleManager.test.tsx` + `apps/web/e2e/locale-strings.spec.ts`.
- When you add a **new island** that renders localized text, add a component test that passes `locale`
  as a prop and asserts the rendered string (see the `add-tests` skill). Localized routing is covered by
  the E2E i18n spec (`apps/web/e2e/i18n.spec.ts`) — extend it if you add a locale.
