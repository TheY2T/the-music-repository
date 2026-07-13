import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { eq, inArray } from 'drizzle-orm';
import { AppModule } from '../../app.module';
import { MediaLibrary } from '../../catalogue/application/ports/media-library.port';
import { CatalogueReindexService } from '../../catalogue/infrastructure/catalogue-reindex.service';
import { DATABASE, type Database } from './database.module';
import * as schema from './schema';
import {
  COLLECTIONS,
  CONTENT,
  GENRES,
  HELP_TOPICS,
  INSTRUMENTS,
  makeMinimalPdf,
  SKILL_TOPICS,
  TAGS,
} from './seed-data';
import { SCORE_XML } from './seed-scores';

const log = new Logger('Seed');

async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  const db = app.get<Database>(DATABASE);
  const media = app.get(MediaLibrary);
  const reindex = app.get(CatalogueReindexService);

  await media.ensureBucket();

  await upsertTaxonomy(db, schema.genres, GENRES);
  await upsertTaxonomy(db, schema.instruments, INSTRUMENTS);
  await upsertTaxonomy(db, schema.skillTopics, SKILL_TOPICS);
  await upsertTaxonomy(db, schema.tags, TAGS);

  const genreIds = await idMap(db, schema.genres);
  const instrumentIds = await idMap(db, schema.instruments);
  const topicIds = await idMap(db, schema.skillTopics);
  const tagIds = await idMap(db, schema.tags);

  for (const item of CONTENT) {
    const [row] = await db
      .insert(schema.contentItems)
      .values({
        slug: item.slug,
        title: item.title,
        summary: item.summary,
        bodyMdx: item.bodyMdx ?? null,
        type: item.type,
        visibility: item.visibility ?? 'public',
        tier: item.tier ?? null,
        status: 'published',
        difficulty: item.difficulty ?? null,
        source: item.source,
        attribution: item.attribution,
        license: item.license,
      })
      .onConflictDoUpdate({
        target: schema.contentItems.slug,
        set: {
          title: item.title,
          summary: item.summary,
          bodyMdx: item.bodyMdx ?? null,
          type: item.type,
          visibility: item.visibility ?? 'public',
          tier: item.tier ?? null,
          difficulty: item.difficulty ?? null,
          source: item.source,
          attribution: item.attribution,
          license: item.license,
          updatedAt: new Date(),
        },
      })
      .returning({ id: schema.contentItems.id });
    if (!row) {
      continue;
    }
    const contentId = row.id;

    await replaceJoins(db, schema.contentGenres, 'genreId', contentId, ids(item.genres, genreIds));
    await replaceJoins(
      db,
      schema.contentInstruments,
      'instrumentId',
      contentId,
      ids(item.instruments, instrumentIds),
    );
    await replaceJoins(
      db,
      schema.contentSkillTopics,
      'skillTopicId',
      contentId,
      ids(item.topics, topicIds),
    );
    await replaceJoins(db, schema.contentTags, 'tagId', contentId, ids(item.tags, tagIds));

    await db.delete(schema.mediaAssets).where(eq(schema.mediaAssets.contentId, contentId));

    // Real engraved score (MusicXML) when we have one for this slug — rendered by the web
    // ScoreViewer via Verovio. Takes precedence over the placeholder PDF.
    const xml = SCORE_XML[item.slug];
    if (xml) {
      const key = `scores/${item.slug}.musicxml`;
      const bytes = new TextEncoder().encode(xml);
      await media.putObject(key, bytes, 'application/vnd.recordare.musicxml+xml');
      await db.insert(schema.mediaAssets).values({
        contentId,
        kind: 'musicxml',
        storageKey: key,
        filename: `${item.slug}.musicxml`,
        mime: 'application/vnd.recordare.musicxml+xml',
        bytes: bytes.byteLength,
        license: item.license,
        attribution: item.attribution,
      });
    }

    if (item.withPdf) {
      const key = `scores/${item.slug}.pdf`;
      const bytes = makeMinimalPdf(item.title);
      await media.putObject(key, bytes, 'application/pdf');
      await db.insert(schema.mediaAssets).values({
        contentId,
        kind: 'score_pdf',
        storageKey: key,
        filename: `${item.slug}.pdf`,
        mime: 'application/pdf',
        bytes: bytes.byteLength,
        license: item.license,
        attribution: item.attribution,
      });
    }
  }

  const indexed = await reindex.reindex();
  log.log(`Seeded ${CONTENT.length} content items; reindexed ${indexed} into Meilisearch.`);

  for (const collection of COLLECTIONS) {
    const [row] = await db
      .insert(schema.collections)
      .values({
        slug: collection.slug,
        title: collection.title,
        summary: collection.summary,
        kind: collection.kind,
        visibility: 'public',
        status: 'published',
      })
      .onConflictDoUpdate({
        target: schema.collections.slug,
        set: {
          title: collection.title,
          summary: collection.summary,
          kind: collection.kind,
          status: 'published',
          updatedAt: new Date(),
        },
      })
      .returning({ id: schema.collections.id });
    if (!row) {
      continue;
    }
    await db.delete(schema.collectionItems).where(eq(schema.collectionItems.collectionId, row.id));
    const contentRows = await db
      .select({ id: schema.contentItems.id, slug: schema.contentItems.slug })
      .from(schema.contentItems)
      .where(inArray(schema.contentItems.slug, collection.itemSlugs));
    const idBySlug = new Map(contentRows.map((r) => [r.slug, r.id]));
    const values = collection.itemSlugs
      .filter((slug) => idBySlug.has(slug))
      .map((slug, position) => ({
        collectionId: row.id,
        contentId: idBySlug.get(slug) as string,
        position,
      }));
    if (values.length) {
      await db.insert(schema.collectionItems).values(values);
    }
  }
  log.log(`Seeded ${COLLECTIONS.length} collections.`);

  for (const topic of HELP_TOPICS) {
    await db
      .insert(schema.helpTopics)
      .values({
        slug: topic.slug,
        term: topic.term,
        body: topic.body,
        linkSlug: topic.linkSlug ?? null,
      })
      .onConflictDoUpdate({
        target: schema.helpTopics.slug,
        set: {
          term: topic.term,
          body: topic.body,
          linkSlug: topic.linkSlug ?? null,
          updatedAt: new Date(),
        },
      });
  }
  log.log(`Seeded ${HELP_TOPICS.length} help topics.`);

  await app.close();
  process.exit(0);
}

function ids(slugs: string[], map: Record<string, string>): string[] {
  return slugs.map((slug) => map[slug]).filter((id): id is string => Boolean(id));
}

// biome-ignore lint/suspicious/noExplicitAny: generic helper over interchangeable taxonomy tables.
async function upsertTaxonomy(db: Database, table: any, rows: { slug: string; name: string }[]) {
  for (const row of rows) {
    await db.insert(table).values(row).onConflictDoNothing({ target: table.slug });
  }
}

// biome-ignore lint/suspicious/noExplicitAny: generic helper over interchangeable taxonomy tables.
async function idMap(db: Database, table: any): Promise<Record<string, string>> {
  const rows: { id: string; slug: string }[] = await db
    .select({ id: table.id, slug: table.slug })
    .from(table);
  return Object.fromEntries(rows.map((r) => [r.slug, r.id]));
}

async function replaceJoins(
  db: Database,
  // biome-ignore lint/suspicious/noExplicitAny: generic helper over interchangeable join tables.
  joinTable: any,
  fkColumn: string,
  contentId: string,
  taxonomyIds: string[],
): Promise<void> {
  await db.delete(joinTable).where(eq(joinTable.contentId, contentId));
  if (taxonomyIds.length > 0) {
    await db.insert(joinTable).values(taxonomyIds.map((id) => ({ contentId, [fkColumn]: id })));
  }
}

main().catch((error) => {
  log.error(error);
  process.exit(1);
});
