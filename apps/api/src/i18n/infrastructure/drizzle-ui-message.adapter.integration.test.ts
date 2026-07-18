import { join } from 'node:path';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../infrastructure/database/database.module';
import * as schema from '../../infrastructure/database/schema';
import { DrizzleUiMessageAuthoring } from './drizzle-ui-message-authoring.adapter';
import { DrizzleUiMessageCatalogue } from './drizzle-ui-message-catalogue.adapter';

// Proves the localization write→publish→read round-trip against real Postgres: drafts stay out of the
// served catalogue until published, the version bumps on publish (cache-bust), and soft-delete/restore
// behave. Requires a Docker/podman socket (opt-in via `test:integration`). See ADR 0020/0034.
const MIGRATIONS = join(process.cwd(), 'drizzle');

/** Assert an array had a first element (list() returns a possibly-empty array). */
function first<T>(rows: T[]): T {
  const row = rows[0];
  if (row === undefined) {
    throw new Error('expected at least one row');
  }
  return row;
}

describe('Drizzle UI-message adapters (Testcontainers Postgres)', () => {
  let container: StartedPostgreSqlContainer;
  let client: ReturnType<typeof postgres>;
  let db: Database;
  let authoring: DrizzleUiMessageAuthoring;
  let catalogue: DrizzleUiMessageCatalogue;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine').start();
    client = postgres(container.getConnectionUri(), { max: 1 });
    db = drizzle(client, { schema });
    await migrate(db, { migrationsFolder: MIGRATIONS });
    authoring = new DrizzleUiMessageAuthoring(db);
    catalogue = new DrizzleUiMessageCatalogue(db);
  });

  afterAll(async () => {
    await client?.end();
    await container?.stop();
  });

  it('keeps a new draft out of the published catalogue until publish', async () => {
    const created = await authoring.create({ locale: 'en', key: 'greeting', value: 'Hello' });
    expect(created.status).toBe('draft');
    expect(created.seeded).toBe(false);

    const before = await catalogue.snapshot('en');
    expect(before.messages.greeting).toBeUndefined();

    const versions = await authoring.publish('en');
    expect(versions.en).toBeDefined();

    const after = await catalogue.snapshot('en');
    expect(after.messages.greeting).toBe('Hello');
    expect(after.version).toBe(versions.en);
  });

  it('rejects a duplicate (locale,key) via existsKey', async () => {
    expect(await authoring.existsKey('en', 'greeting')).toBe(true);
    expect(await authoring.existsKey('en', 'unheard-of')).toBe(false);
  });

  it('edits are drafts until re-published, then bump the version', async () => {
    const row = first(await authoring.list({ locale: 'en', search: 'greeting' }));
    await authoring.updateDraft(row.id, 'Howdy');

    const stillOld = await catalogue.snapshot('en');
    expect(stillOld.messages.greeting).toBe('Hello'); // draft not yet live

    const versions = await authoring.publish('en');
    const fresh = await catalogue.snapshot('en');
    expect(fresh.messages.greeting).toBe('Howdy');
    expect(fresh.version).toBe(versions.en);
  });

  it('soft-deletes then restores, toggling catalogue membership on publish', async () => {
    const row = first(await authoring.list({ locale: 'en', search: 'greeting' }));
    await authoring.softDelete(row.id);
    await authoring.publish('en');
    expect((await catalogue.snapshot('en')).messages.greeting).toBeUndefined();

    const deleted = first(
      await authoring.list({
        locale: 'en',
        search: 'greeting',
        includeDeleted: true,
      }),
    );
    expect(deleted.deleted).toBe(true);
    await authoring.restore(deleted.id);
    await authoring.publish('en');
    expect((await catalogue.snapshot('en')).messages.greeting).toBe('Howdy');
  });

  it('records a revision history for every change', async () => {
    const row = first(await authoring.list({ locale: 'en', search: 'greeting' }));
    const history = await authoring.listRevisions(row.id);
    const actions = history.map((r) => r.action);
    expect(actions).toContain('create');
    expect(actions).toContain('update');
    expect(actions).toContain('delete');
    expect(actions).toContain('restore');
  });
});
