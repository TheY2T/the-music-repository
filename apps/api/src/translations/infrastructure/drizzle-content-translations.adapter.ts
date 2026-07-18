import { Inject, Injectable } from '@nestjs/common';
import { and, eq, inArray, isNotNull, isNull } from 'drizzle-orm';
import { DATABASE, type Database } from '../../infrastructure/database/database.module';
import { entityTranslations } from '../../infrastructure/database/schema';
import { ContentTranslations } from '../application/ports/content-translations.port';
import type { TranslationOverlay } from '../domain/entity-translation';

/**
 * Read side of content translations. Returns the published, non-deleted field→value overlay for an
 * entity+locale. The catalogue/collections/help read use-cases merge this over the base row.
 */
@Injectable()
export class DrizzleContentTranslations extends ContentTranslations {
  constructor(@Inject(DATABASE) private readonly db: Database) {
    super();
  }

  async overlay(entityType: string, entityId: string, locale: string): Promise<TranslationOverlay> {
    const rows = await this.db
      .select({ field: entityTranslations.field, value: entityTranslations.publishedValue })
      .from(entityTranslations)
      .where(
        and(
          eq(entityTranslations.entityType, entityType),
          eq(entityTranslations.entityId, entityId),
          eq(entityTranslations.locale, locale),
          isNull(entityTranslations.deletedAt),
          isNotNull(entityTranslations.publishedValue),
        ),
      );
    const overlay: TranslationOverlay = {};
    for (const row of rows) {
      if (row.value !== null) {
        overlay[row.field] = row.value;
      }
    }
    return overlay;
  }

  async overlayMany(
    entityType: string,
    entityIds: string[],
    locale: string,
  ): Promise<Map<string, TranslationOverlay>> {
    const result = new Map<string, TranslationOverlay>();
    if (entityIds.length === 0) {
      return result;
    }
    const rows = await this.db
      .select({
        entityId: entityTranslations.entityId,
        field: entityTranslations.field,
        value: entityTranslations.publishedValue,
      })
      .from(entityTranslations)
      .where(
        and(
          eq(entityTranslations.entityType, entityType),
          inArray(entityTranslations.entityId, entityIds),
          eq(entityTranslations.locale, locale),
          isNull(entityTranslations.deletedAt),
          isNotNull(entityTranslations.publishedValue),
        ),
      );
    for (const row of rows) {
      if (row.value === null) {
        continue;
      }
      const overlay = result.get(row.entityId) ?? {};
      overlay[row.field] = row.value;
      result.set(row.entityId, overlay);
    }
    return result;
  }
}
