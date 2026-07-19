import { join } from 'node:path';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../infrastructure/database/database.module';
import * as schema from '../../infrastructure/database/schema';
import { DrizzleContentTranslations } from './drizzle-content-translations.adapter';
import { DrizzleEntityTranslationAuthoring } from './drizzle-entity-translation-authoring.adapter';

// Proves the content-translation write→publish→overlay round-trip against real Postgres: drafts don't
// overlay until published, upsert edits the same (type,id,locale,field) row, soft-delete removes from the
// overlay, restore brings it back. Requires Docker/podman (opt-in via `test:integration`). ADR 0034.
const MIGRATIONS = join(process.cwd(), 'drizzle');
const ENTITY_ID = '11111111-1111-1111-1111-111111111111';

describe('Drizzle entity-translation adapters (Testcontainers Postgres)', () => {
  let container: StartedPostgreSqlContainer;
  let client: ReturnType<typeof postgres>;
  let db: Database;
  let authoring: DrizzleEntityTranslationAuthoring;
  let reader: DrizzleContentTranslations;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine').start();
    client = postgres(container.getConnectionUri(), { max: 1 });
    db = drizzle(client, { schema });
    await migrate(db, { migrationsFolder: MIGRATIONS });
    authoring = new DrizzleEntityTranslationAuthoring(db);
    reader = new DrizzleContentTranslations(db);
  });

  afterAll(async () => {
    await client?.end();
    await container?.stop();
  });

  const upsert = (field: string, value: string) =>
    authoring.upsertDraft({
      entityType: 'content',
      entityId: ENTITY_ID,
      locale: 'zh-Hans',
      field,
      value,
    });

  it('keeps drafts out of the overlay until published', async () => {
    const row = await upsert('title', '致爱丽丝');
    expect(row.status).toBe('draft');
    expect(await reader.overlay('content', ENTITY_ID, 'zh-Hans')).toEqual({});

    const published = await authoring.publish('content', ENTITY_ID);
    expect(published).toBe(1);
    expect(await reader.overlay('content', ENTITY_ID, 'zh-Hans')).toEqual({ title: '致爱丽丝' });
  });

  it('upsert edits the same row (unique on type/id/locale/field)', async () => {
    await upsert('title', '给爱丽丝');
    // draft edited but not published → overlay still shows the last published value
    expect((await reader.overlay('content', ENTITY_ID, 'zh-Hans')).title).toBe('致爱丽丝');
    await authoring.publish('content', ENTITY_ID);
    expect((await reader.overlay('content', ENTITY_ID, 'zh-Hans')).title).toBe('给爱丽丝');
  });

  it('overlayMany batches by entityId and excludes other locales/entities', async () => {
    const OTHER_ID = '22222222-2222-2222-2222-222222222222';
    const map = await reader.overlayMany('content', [ENTITY_ID, OTHER_ID], 'zh-Hans');
    expect(map.get(ENTITY_ID)).toEqual({ title: '给爱丽丝' });
    expect(map.has(OTHER_ID)).toBe(false);
    // A different locale sees nothing.
    expect(await reader.overlay('content', ENTITY_ID, 'fr')).toEqual({});
  });

  it('publish scoped to a locale only publishes that locale', async () => {
    const ID = '33333333-3333-3333-3333-333333333333';
    await authoring.upsertDraft({
      entityType: 'content',
      entityId: ID,
      locale: 'zh-Hans',
      field: 'title',
      value: '标题',
    });
    await authoring.upsertDraft({
      entityType: 'content',
      entityId: ID,
      locale: 'fr',
      field: 'title',
      value: 'Titre',
    });

    const published = await authoring.publish('content', ID, 'fr');
    expect(published).toBe(1);
    expect(await reader.overlay('content', ID, 'fr')).toEqual({ title: 'Titre' });
    // The other locale's draft stays unpublished.
    expect(await reader.overlay('content', ID, 'zh-Hans')).toEqual({});
  });

  it('soft-delete removes from the overlay; restore brings it back', async () => {
    const rows = await authoring.list({ entityType: 'content', entityId: ENTITY_ID });
    const target = rows[0];
    if (!target) throw new Error('expected a translation row');

    await authoring.softDelete(target.id);
    expect(await reader.overlay('content', ENTITY_ID, 'zh-Hans')).toEqual({});

    await authoring.restore(target.id);
    expect((await reader.overlay('content', ENTITY_ID, 'zh-Hans')).title).toBe('给爱丽丝');

    const history = (await authoring.listRevisions(target.id)).map((r) => r.action);
    expect(history).toContain('delete');
    expect(history).toContain('restore');
  });
});
