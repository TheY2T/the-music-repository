import { join } from 'node:path';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../infrastructure/database/database.module';
import * as schema from '../../infrastructure/database/schema';
import { DrizzleLearnerAchievements } from './drizzle-learner-achievements.repository';

// Exercises the achievements adapter against a real Postgres with the app's migrations applied.
// Requires a Docker/podman socket (opt-in via `test:integration`). See ADR 0020 · ADR 0045.
const MIGRATIONS = join(process.cwd(), 'drizzle');
const USER_ID = 'user-ach-1';

describe('DrizzleLearnerAchievements (Testcontainers Postgres)', () => {
  let container: StartedPostgreSqlContainer;
  let client: ReturnType<typeof postgres>;
  let db: Database;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine').start();
    client = postgres(container.getConnectionUri(), { max: 1 });
    db = drizzle(client, { schema });
    await migrate(db, { migrationsFolder: MIGRATIONS });
    await db.insert(schema.user).values({
      id: USER_ID,
      name: 'Achievements Tester',
      email: 'ach@local.dev',
      emailVerified: true,
    });
  });

  afterAll(async () => {
    await client?.end();
    await container?.stop();
  });

  it('returns null before any achievements are saved', async () => {
    const repo = new DrizzleLearnerAchievements(db);
    expect(await repo.get(USER_ID)).toBeNull();
  });

  it('upserts and reads back the stored achievements', async () => {
    const repo = new DrizzleLearnerAchievements(db);
    const saved = await repo.put(USER_ID, { xp: 350, badges: ['first-steps'] });
    expect(saved.xp).toBe(350);

    const read = await repo.get(USER_ID);
    expect(read).toMatchObject({ xp: 350, badges: ['first-steps'] });
    expect(read?.updatedAt).toBeInstanceOf(Date);
  });

  it('replaces achievements on a second upsert (idempotent by user)', async () => {
    const repo = new DrizzleLearnerAchievements(db);
    await repo.put(USER_ID, { xp: 900, badges: ['first-steps', 'week-streak'] });
    const read = await repo.get(USER_ID);
    expect(read?.xp).toBe(900);
    expect(read?.badges).toEqual(['first-steps', 'week-streak']);
  });
});
