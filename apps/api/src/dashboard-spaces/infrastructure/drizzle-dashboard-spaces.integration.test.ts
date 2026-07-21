import { join } from 'node:path';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../infrastructure/database/database.module';
import * as schema from '../../infrastructure/database/schema';
import { DrizzleDashboardSpaces } from './drizzle-dashboard-spaces.repository';

// Exercises the dashboard-spaces adapter against a real Postgres with the app's migrations applied.
// Requires a Docker/podman socket (opt-in via `test:integration`). See ADR 0020 · ADR 0045.
const MIGRATIONS = join(process.cwd(), 'drizzle');
const USER_ID = 'user-spaces-1';

describe('DrizzleDashboardSpaces (Testcontainers Postgres)', () => {
  let container: StartedPostgreSqlContainer;
  let client: ReturnType<typeof postgres>;
  let db: Database;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine').start();
    client = postgres(container.getConnectionUri(), { max: 1 });
    db = drizzle(client, { schema });
    await migrate(db, { migrationsFolder: MIGRATIONS });
    // dashboard_spaces FK → user.id; seed a minimal user row so the upsert satisfies it.
    await db.insert(schema.user).values({
      id: USER_ID,
      name: 'Spaces Tester',
      email: 'spaces@local.dev',
      emailVerified: true,
    });
  });

  afterAll(async () => {
    await client?.end();
    await container?.stop();
  });

  it('returns null before any spaces are saved', async () => {
    const repo = new DrizzleDashboardSpaces(db);
    expect(await repo.get(USER_ID)).toBeNull();
  });

  it('upserts and reads back the stored spaces', async () => {
    const repo = new DrizzleDashboardSpaces(db);
    const saved = await repo.put(USER_ID, {
      activeSpaceId: 's1',
      spaces: [
        {
          id: 's1',
          name: 'Daily warm-up',
          icon: 'music',
          background: { style: 'waves', intensity: 55 },
          widgets: [{ id: 'w1', type: 'metronome', x: 0, y: 0, w: 4, h: 3, config: { tempo: 90 } }],
        },
      ],
    });
    expect(saved.activeSpaceId).toBe('s1');

    const read = await repo.get(USER_ID);
    expect(read?.activeSpaceId).toBe('s1');
    expect(read?.spaces).toHaveLength(1);
    expect(read?.spaces[0]?.widgets[0]).toMatchObject({ type: 'metronome', config: { tempo: 90 } });
    expect(read?.updatedAt).toBeInstanceOf(Date);
  });

  it('replaces spaces on a second upsert (idempotent by user)', async () => {
    const repo = new DrizzleDashboardSpaces(db);
    await repo.put(USER_ID, {
      activeSpaceId: undefined,
      spaces: [{ id: 's2', name: 'Sight-reading', widgets: [] }],
    });
    const read = await repo.get(USER_ID);
    expect(read?.spaces).toHaveLength(1);
    expect(read?.spaces[0]?.id).toBe('s2');
    expect(read?.activeSpaceId).toBeUndefined();
  });
});
