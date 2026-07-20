import { join } from 'node:path';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../infrastructure/database/database.module';
import * as schema from '../../infrastructure/database/schema';
import { DrizzleUserPreferences } from './drizzle-user-preferences.repository';

// Exercises the preferences adapter against a real Postgres with the app's migrations applied.
// Requires a Docker/podman socket (opt-in via `test:integration`). See ADR 0020 · ADR 0044.
const MIGRATIONS = join(process.cwd(), 'drizzle');
const USER_ID = 'user-prefs-1';

describe('DrizzleUserPreferences (Testcontainers Postgres)', () => {
  let container: StartedPostgreSqlContainer;
  let client: ReturnType<typeof postgres>;
  let db: Database;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine').start();
    client = postgres(container.getConnectionUri(), { max: 1 });
    db = drizzle(client, { schema });
    await migrate(db, { migrationsFolder: MIGRATIONS });
    // Preferences FK → user.id; seed a minimal user row so the upsert satisfies it.
    await db.insert(schema.user).values({
      id: USER_ID,
      name: 'Prefs Tester',
      email: 'prefs@local.dev',
      emailVerified: true,
    });
  });

  afterAll(async () => {
    await client?.end();
    await container?.stop();
  });

  it('returns null before any preferences are saved', async () => {
    const repo = new DrizzleUserPreferences(db);
    expect(await repo.get(USER_ID)).toBeNull();
  });

  it('upserts and reads back the stored preferences', async () => {
    const repo = new DrizzleUserPreferences(db);
    const saved = await repo.put(USER_ID, {
      handedness: 'left',
      keyboardSkin: 'classic',
      fretboardSkin: 'sunburst',
      fullscreen: true,
    });
    expect(saved.handedness).toBe('left');

    const read = await repo.get(USER_ID);
    expect(read).toMatchObject({
      handedness: 'left',
      keyboardSkin: 'classic',
      fretboardSkin: 'sunburst',
      fullscreen: true,
    });
    expect(read?.updatedAt).toBeInstanceOf(Date);
  });

  it('replaces preferences on a second upsert (idempotent by user)', async () => {
    const repo = new DrizzleUserPreferences(db);
    await repo.put(USER_ID, {
      handedness: 'right',
      keyboardSkin: 'theme',
      fretboardSkin: 'ebony',
      fullscreen: false,
    });
    const read = await repo.get(USER_ID);
    expect(read).toMatchObject({ handedness: 'right', fretboardSkin: 'ebony', fullscreen: false });
  });
});
