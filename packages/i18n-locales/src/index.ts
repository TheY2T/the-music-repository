/**
 * @TheY2T/tmr-i18n-locales — the raw translation catalogues, one JSON file per language.
 *
 * `en.json` is the **source of truth for message keys**: `MessageKey` is derived from it, so a new
 * key must be added to `en.json` first (TypeScript then flags any consumer using an unknown key).
 * Other languages are `Partial` — a missing key falls back to English at runtime (see `@TheY2T/tmr-i18n`).
 *
 * To add a language: drop a `<locale>.json` next to these, export it here, and register the locale in
 * `@TheY2T/tmr-i18n` (`LOCALES` + `URL_PREFIX`) and the Astro middleware.
 */
import en from './en.json';
import zhHans from './zh-Hans.json';

/** Every valid message key, derived from the English catalogue (the source of truth). */
export type MessageKey = keyof typeof en;

/** A complete catalogue has every key; non-default languages may be partial (fallback to English). */
export type Catalogue = Partial<Record<MessageKey, string>>;

export { en, zhHans };
