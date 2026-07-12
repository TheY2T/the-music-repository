---
name: add-translations
description: Add or use localized UI strings in the web app (English + 中文 zh-Hans) via @TheY2T/tmr-i18n. Use whenever adding a new page/island or any user-facing text, or adding a new language. See docs/features/i18n.md + ADR 0017.
---

# add-translations

Every user-facing UI string in `apps/web` goes through `t(locale, key)` — no hardcoded English. Locale
is resolved in middleware (`Astro.locals.locale`) and passed into islands as a plain `locale` prop.

## 1. Add the key(s)

Edit **both** catalogues in `@TheY2T/tmr-i18n-locales`:
- `packages/i18n-locales/src/en.json` — the **source of truth for keys** (`MessageKey = keyof typeof en`).
- `packages/i18n-locales/src/zh-Hans.json` — the Simplified Chinese value (missing → falls back to English).

Key naming: `domain.thing` (camelCase after the dot), e.g. `catalogue.search`, `upgrade.subtitle`.
Interpolate with `{name}` placeholders: `"catalogue.results": "{count} results"`.

Rebuild the packages so the new keys/types are available:
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
