import { en, zhHans } from '@TheY2T/tmr-i18n-locales';
import type { Database } from './database.module';
import { i18nVersions, locales, uiMessages } from './schema';

/** The seed catalogues keyed by locale id — the published baseline every fresh deploy boots with. */
const CATALOGUES: Record<string, Record<string, string>> = {
  en: en as Record<string, string>,
  'zh-Hans': zhHans as Record<string, string>,
};

/** Display labels for the seeded locales in the CMS locale registry. */
const LOCALE_LABELS: Record<string, string> = {
  en: 'English',
  'zh-Hans': '中文 (Simplified)',
};

/**
 * Seed the DB-backed UI-string catalogue from the in-repo JSON (ADR 0034). Rows are inserted as
 * PUBLISHED, `seeded: true` baseline — so a fresh deploy renders immediately. Idempotent: existing
 * `(locale, key)` rows are left untouched (never clobbers admin edits), only missing baseline keys are
 * filled. The per-locale version is bumped each run so any newly-added baseline keys go live.
 */
export async function seedI18n(db: Database): Promise<Record<string, number>> {
  const version = Date.now().toString();
  const counts: Record<string, number> = {};

  for (const [locale, catalogue] of Object.entries(CATALOGUES)) {
    await db
      .insert(locales)
      .values({ code: locale, label: LOCALE_LABELS[locale] ?? locale })
      .onConflictDoNothing({ target: locales.code });
    const rows = Object.entries(catalogue).map(([key, value]) => ({
      locale,
      key,
      draftValue: value,
      publishedValue: value,
      status: 'published',
      seeded: true,
    }));
    if (rows.length) {
      await db
        .insert(uiMessages)
        .values(rows)
        .onConflictDoNothing({ target: [uiMessages.locale, uiMessages.key] });
    }
    await db
      .insert(i18nVersions)
      .values({ locale, version })
      .onConflictDoUpdate({
        target: i18nVersions.locale,
        set: { version, publishedAt: new Date() },
      });
    counts[locale] = rows.length;
  }

  return counts;
}
