import { Inject, Injectable } from '@nestjs/common';
import { and, eq, isNotNull, isNull } from 'drizzle-orm';
import { DATABASE, type Database } from '../../infrastructure/database/database.module';
import { i18nVersions, uiMessages } from '../../infrastructure/database/schema';
import { UiMessageCatalogue } from '../application/ports/ui-message-catalogue.port';
import type { CatalogueSnapshot } from '../domain/ui-message';

/**
 * Read side of localization. Assembles each locale's published catalogue and caches it in memory keyed
 * by the locale's version tag: every call reads the tiny `i18n_versions` row (indexed PK) and only
 * re-scans `ui_messages` when the version changed (i.e. after a publish) — so the hot path never does a
 * full-catalogue scan. Provider is a singleton, so the cache is shared across requests.
 */
@Injectable()
export class DrizzleUiMessageCatalogue extends UiMessageCatalogue {
  private readonly cache = new Map<string, CatalogueSnapshot>();

  constructor(@Inject(DATABASE) private readonly db: Database) {
    super();
  }

  private async versionOf(locale: string): Promise<string> {
    const [row] = await this.db
      .select({ version: i18nVersions.version })
      .from(i18nVersions)
      .where(eq(i18nVersions.locale, locale))
      .limit(1);
    return row?.version ?? '0';
  }

  async snapshot(locale: string): Promise<CatalogueSnapshot> {
    const version = await this.versionOf(locale);
    const cached = this.cache.get(locale);
    if (cached && cached.version === version) {
      return cached;
    }
    const rows = await this.db
      .select({ key: uiMessages.key, value: uiMessages.publishedValue })
      .from(uiMessages)
      .where(
        and(
          eq(uiMessages.locale, locale),
          isNull(uiMessages.deletedAt),
          isNotNull(uiMessages.publishedValue),
        ),
      );
    const messages: Record<string, string> = {};
    for (const row of rows) {
      if (row.value !== null) {
        messages[row.key] = row.value;
      }
    }
    const snapshot: CatalogueSnapshot = { version, locale, messages };
    this.cache.set(locale, snapshot);
    return snapshot;
  }

  async versions(): Promise<Record<string, string>> {
    const rows = await this.db
      .select({ locale: i18nVersions.locale, version: i18nVersions.version })
      .from(i18nVersions);
    const result: Record<string, string> = {};
    for (const row of rows) {
      result[row.locale] = row.version;
    }
    return result;
  }
}
