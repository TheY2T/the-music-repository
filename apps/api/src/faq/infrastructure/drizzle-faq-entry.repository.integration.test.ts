import { join } from 'node:path';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../infrastructure/database/database.module';
import * as schema from '../../infrastructure/database/schema';
import type { FaqEntryWriteData } from '../domain/faq-entry';
import { DrizzleFaqEntryRepository } from './drizzle-faq-entry.repository';

// Real Postgres via Testcontainers + the app's Drizzle migrations. Opt-in via `test:integration`
// (needs a Docker/podman socket). See ADR 0020 · docs/features/testing.md.
const MIGRATIONS = join(process.cwd(), 'drizzle');

function data(overrides: Partial<FaqEntryWriteData> = {}): FaqEntryWriteData {
  return {
    slug: 'is-it-free',
    question: 'Is it free?',
    answer: 'Yes.',
    category: 'Content & licensing',
    sortOrder: 0,
    ...overrides,
  };
}

describe('DrizzleFaqEntryRepository (Testcontainers Postgres)', () => {
  let container: StartedPostgreSqlContainer;
  let client: ReturnType<typeof postgres>;
  let db: Database;
  let repo: DrizzleFaqEntryRepository;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine').start();
    client = postgres(container.getConnectionUri(), { max: 1 });
    db = drizzle(client, { schema });
    await migrate(db, { migrationsFolder: MIGRATIONS });
    repo = new DrizzleFaqEntryRepository(db);
  });

  afterAll(async () => {
    await client?.end();
    await container?.stop();
  });

  it('creates, reads, updates and deletes an entry', async () => {
    const created = await repo.create(data({ slug: 'crud' }));
    expect(created.id).toBeTruthy();
    expect(await repo.exists('crud')).toBe(true);
    expect((await repo.getBySlug('crud'))?.question).toBe('Is it free?');

    const updated = await repo.update('crud', data({ slug: 'crud', answer: 'Yes, entirely.' }));
    expect(updated.answer).toBe('Yes, entirely.');

    await repo.delete('crud');
    expect(await repo.exists('crud')).toBe(false);
    expect(await repo.getBySlug('crud')).toBeNull();
  });

  it('orders by category then sort order', async () => {
    await repo.create(data({ slug: 'g-1', category: 'Getting started', sortOrder: 1 }));
    await repo.create(data({ slug: 'g-0', category: 'Getting started', sortOrder: 0 }));
    await repo.create(data({ slug: 'a-0', category: 'A-first', sortOrder: 0 }));

    const all = await repo.findAll();
    const ours = all.filter((e) => ['g-1', 'g-0', 'a-0'].includes(e.slug)).map((e) => e.slug);
    expect(ours).toEqual(['a-0', 'g-0', 'g-1']);
  });
});
