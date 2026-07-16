import { join } from 'node:path';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../infrastructure/database/database.module';
import * as schema from '../../infrastructure/database/schema';
import { contentItems } from '../../infrastructure/database/schema';
import type { ContentWriteData } from '../application/ports/content-authoring.port';
import { RevisionNotFoundError } from '../domain/errors/revision-not-found.error';
import { DrizzleContentAuthoring } from './drizzle-content-authoring.adapter';
import { DrizzleContentRevisions } from './drizzle-content-revisions.adapter';

// Proves the version-history capability (ADR 0030): snapshot captures the current content, list returns
// newest-first, and restore lifts a snapshot's fields back onto the item. Opt-in via `test:integration`.
const MIGRATIONS = join(process.cwd(), 'drizzle');

const base: ContentWriteData = {
  slug: 'rev-item',
  title: 'Version one',
  type: 'lesson',
  bodyMdx: 'First body.',
  genres: [],
  instruments: [],
  topics: [],
  tags: [],
};

describe('DrizzleContentRevisions (Testcontainers Postgres)', () => {
  let container: StartedPostgreSqlContainer;
  let client: ReturnType<typeof postgres>;
  let db: Database;
  let authoring: DrizzleContentAuthoring;
  let revisions: DrizzleContentRevisions;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine').start();
    client = postgres(container.getConnectionUri(), { max: 1 });
    db = drizzle(client, { schema });
    await migrate(db, { migrationsFolder: MIGRATIONS });
    authoring = new DrizzleContentAuthoring(db);
    revisions = new DrizzleContentRevisions(db);
    await authoring.create(base);
  });

  afterAll(async () => {
    await client?.end();
    await container?.stop();
  });

  it('snapshots, lists newest-first, and restores a prior version', async () => {
    await revisions.snapshot('rev-item', 'author-1');

    await authoring.update('rev-item', { ...base, title: 'Version two', bodyMdx: 'Second body.' });
    await revisions.snapshot('rev-item', 'author-2');

    const list = await revisions.list('rev-item');
    expect(list).toHaveLength(2);
    expect(list[0]?.authorId).toBe('author-2'); // newest first
    expect(list[1]?.authorId).toBe('author-1');

    // Restore the oldest snapshot (Version one) — the content reverts.
    const oldest = list[1];
    if (!oldest) {
      throw new Error('expected a revision');
    }
    await revisions.restore('rev-item', oldest.id);

    const [row] = await db.select().from(contentItems).where(eq(contentItems.slug, 'rev-item'));
    expect(row?.title).toBe('Version one');
    expect(row?.bodyMdx).toBe('First body.');
  });

  it('throws RevisionNotFoundError for an unknown revision id', async () => {
    await expect(
      revisions.restore('rev-item', '00000000-0000-0000-0000-000000000000'),
    ).rejects.toBeInstanceOf(RevisionNotFoundError);
  });
});
