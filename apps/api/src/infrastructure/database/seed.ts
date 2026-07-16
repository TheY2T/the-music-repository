import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { and, eq, inArray, notInArray } from 'drizzle-orm';
import { AppModule } from '../../app.module';
import { MediaLibrary } from '../../catalogue/application/ports/media-library.port';
import { CatalogueReindexService } from '../../catalogue/infrastructure/catalogue-reindex.service';
import { CollectionReindexService } from '../../collections/infrastructure/collection-reindex.service';
import { DATABASE, type Database } from './database.module';
import * as schema from './schema';
import { SEED_COLLECTIONS } from './seed-collections';
import { SEED_CONTENT } from './seed-content';
import { CONTENT, GENRES, HELP_TOPICS, INSTRUMENTS, SKILL_TOPICS, TAGS } from './seed-data';
import { SCORE_ALPHATEX, SCORE_META } from './seed-scores';

/** Fold the near-synonym era "Folk" into "Traditional" so the Era facet isn't split. */
function normalizeEra(era: string): string {
  return era === 'Folk' ? 'Traditional' : era;
}

const log = new Logger('Seed');

async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  const db = app.get<Database>(DATABASE);
  const media = app.get(MediaLibrary);
  const reindex = app.get(CatalogueReindexService);
  const collectionReindex = app.get(CollectionReindexService);

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
    // Enriched content authored via research (body + structured facts + suggested tags). Falls back
    // to any inline body on the seed item (e.g. the pre-bodied OMT lessons) when not in the bundle.
    const extra = SEED_CONTENT[item.slug];
    const bodyMdx = extra?.bodyMdx ?? item.bodyMdx ?? null;
    const details = extra?.details
      ? { ...extra.details, ...(extra.details.era ? { era: normalizeEra(extra.details.era) } : {}) }
      : null;
    // Canonical block-editor document derived from the authored Markdown (DB-first authoring, ADR 0030).
    const bodyDoc = extra?.bodyDoc ?? null;
    const tagSlugs = [...new Set([...item.tags, ...(extra?.extraTags ?? [])])];

    const [row] = await db
      .insert(schema.contentItems)
      .values({
        slug: item.slug,
        title: item.title,
        summary: item.summary,
        bodyMdx,
        details,
        bodyDoc,
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
          bodyMdx,
          details,
          bodyDoc,
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
    await replaceJoins(db, schema.contentTags, 'tagId', contentId, ids(tagSlugs, tagIds));

    await db.delete(schema.mediaAssets).where(eq(schema.mediaAssets.contentId, contentId));

    // Real score (alphaTex) when we have one for this slug — the web player renders + plays it with
    // alphaTab (notation-synced playback + client-side PDF export). Provenance/licensing come from the
    // score's own meta (the engraving's license, not the piece's), falling back to the item's.
    const tex = SCORE_ALPHATEX[item.slug];
    if (tex) {
      const scoreMeta = SCORE_META[item.slug];
      const key = `scores/${item.slug}.alphatex`;
      const bytes = new TextEncoder().encode(tex);
      await media.putObject(key, bytes, 'text/plain; charset=utf-8');
      await db.insert(schema.mediaAssets).values({
        contentId,
        kind: 'alphatex',
        storageKey: key,
        filename: `${item.slug}.alphatex`,
        mime: 'text/plain; charset=utf-8',
        bytes: bytes.byteLength,
        license: scoreMeta?.license ?? item.license,
        attribution: scoreMeta?.attribution ?? item.attribution,
        sourceUrl: scoreMeta?.sourceUrl ?? null,
      });
    }
  }

  const indexed = await reindex.reindex();
  log.log(`Seeded ${CONTENT.length} content items; reindexed ${indexed} into Meilisearch.`);

  for (const collection of SEED_COLLECTIONS) {
    const meta = {
      title: collection.title,
      summary: collection.summary,
      bodyMdx: collection.bodyMdx,
      kind: collection.kind,
      visibility: 'public',
      status: 'published',
      curationType: 'editorial',
      featured: collection.featured,
      difficultyMin: collection.difficultyMin,
      difficultyMax: collection.difficultyMax,
      estMinutes: collection.estMinutes,
      curatorName: collection.curatorName,
      curatorBio: collection.curatorBio,
      accent: collection.accent,
      outcomes: collection.outcomes.length ? collection.outcomes : null,
      facets: Object.keys(collection.facets).length ? collection.facets : null,
      tags: collection.tags.length ? collection.tags : null,
    } as const;
    const [row] = await db
      .insert(schema.collections)
      .values({ slug: collection.slug, ...meta })
      .onConflictDoUpdate({
        target: schema.collections.slug,
        set: { ...meta, updatedAt: new Date() },
      })
      .returning({ id: schema.collections.id });
    if (!row) {
      continue;
    }

    // Replace structure: items first (FK), then sections, then re-insert both.
    await db.delete(schema.collectionItems).where(eq(schema.collectionItems.collectionId, row.id));
    await db
      .delete(schema.collectionSections)
      .where(eq(schema.collectionSections.collectionId, row.id));

    // Resolve every referenced content slug → id.
    const allSlugs = collection.sections.flatMap((s) => s.items.map((i) => i.contentSlug));
    const contentRows = allSlugs.length
      ? await db
          .select({ id: schema.contentItems.id, slug: schema.contentItems.slug })
          .from(schema.contentItems)
          .where(inArray(schema.contentItems.slug, allSlugs))
      : [];
    const idBySlug = new Map(contentRows.map((r) => [r.slug, r.id]));

    let position = 0;
    for (const [sectionIndex, section] of collection.sections.entries()) {
      const [sectionRow] = await db
        .insert(schema.collectionSections)
        .values({
          collectionId: row.id,
          title: section.title,
          description: section.description,
          position: sectionIndex,
        })
        .returning({ id: schema.collectionSections.id });
      if (!sectionRow) {
        continue;
      }
      const values = section.items
        .filter((item) => idBySlug.has(item.contentSlug))
        .map((item) => ({
          collectionId: row.id,
          sectionId: sectionRow.id,
          contentId: idBySlug.get(item.contentSlug) as string,
          position: position++,
          curatorNote: item.curatorNote,
          focusSkills: item.focusSkills.length ? item.focusSkills : null,
        }));
      if (values.length) {
        await db.insert(schema.collectionItems).values(values);
      }
    }
  }

  // Remove superseded editorial collections (never touch user-created ones).
  const seededSlugs = SEED_COLLECTIONS.map((c) => c.slug);
  await db
    .delete(schema.collections)
    .where(
      and(
        eq(schema.collections.curationType, 'editorial'),
        notInArray(schema.collections.slug, seededSlugs),
      ),
    );

  const collectionsIndexed = await collectionReindex.reindex();
  log.log(
    `Seeded ${SEED_COLLECTIONS.length} collections; reindexed ${collectionsIndexed} into Meilisearch.`,
  );

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
