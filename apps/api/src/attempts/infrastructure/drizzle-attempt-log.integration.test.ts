import { join } from 'node:path';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { user } from '../../auth/auth-schema';
import type { Database } from '../../infrastructure/database/database.module';
import * as schema from '../../infrastructure/database/schema';
import { DrizzleAttemptLog } from './drizzle-attempt-log';

const MIGRATIONS = join(process.cwd(), 'drizzle');
const USER_ID = 'user-attempts-int';

describe('DrizzleAttemptLog (Testcontainers Postgres)', () => {
  let container: StartedPostgreSqlContainer;
  let client: ReturnType<typeof postgres>;
  let db: Database;
  let log: DrizzleAttemptLog;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine').start();
    client = postgres(container.getConnectionUri(), { max: 1 });
    db = drizzle(client, { schema });
    await migrate(db, { migrationsFolder: MIGRATIONS });
    await db.insert(user).values({ id: USER_ID, name: 'Int', email: 'int-attempts@local.dev' });
    log = new DrizzleAttemptLog(db);
  });

  afterAll(async () => {
    await client?.end();
    await container?.stop();
  });

  it('records attempts and reads them back per deck in chronological order', async () => {
    const now = new Date();
    await log.record(USER_ID, now, {
      deck: 'intervals',
      card: '7',
      modality: 'ear-identify',
      accuracy: 1,
      correct: true,
      responseMs: 900,
    });
    await log.record(USER_ID, new Date(now.getTime() + 1000), {
      deck: 'intervals',
      card: '3',
      modality: 'ear-identify',
      accuracy: 0,
      correct: false,
    });
    await log.record(USER_ID, now, {
      deck: 'staff-notes',
      card: 'C4',
      modality: 'multiple-choice',
      accuracy: 1,
      correct: true,
    });

    const intervals = await log.listDeck(USER_ID, 'intervals');
    expect(intervals.map((a) => a.correct)).toEqual([true, false]);

    const all = await log.listAll(USER_ID);
    expect(all).toHaveLength(3);
    expect(new Set(all.map((a) => a.deck))).toEqual(new Set(['intervals', 'staff-notes']));
  });

  it('derives activity date keys and today counts', async () => {
    const keys = await log.activityDateKeys(USER_ID);
    expect(keys.length).toBeGreaterThanOrEqual(1);
    expect(await log.attemptsToday(USER_ID, new Date())).toBe(3);
  });
});
