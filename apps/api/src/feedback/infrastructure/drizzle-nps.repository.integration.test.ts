import { join } from 'node:path';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../infrastructure/database/database.module';
import * as schema from '../../infrastructure/database/schema';
import { DrizzleNpsRepository } from './drizzle-nps.repository';

const MIGRATIONS = join(process.cwd(), 'drizzle');

describe('DrizzleNpsRepository (Testcontainers Postgres)', () => {
  let container: StartedPostgreSqlContainer;
  let client: ReturnType<typeof postgres>;
  let db: Database;
  let repo: DrizzleNpsRepository;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine').start();
    client = postgres(container.getConnectionUri(), { max: 1 });
    db = drizzle(client, { schema });
    await migrate(db, { migrationsFolder: MIGRATIONS });
    await db
      .insert(schema.user)
      .values({ id: 'nps-u1', name: 'Learner', email: 'nps-u1@local.dev' });
    repo = new DrizzleNpsRepository(db);
  });

  afterAll(async () => {
    await client?.end();
    await container?.stop();
  });

  it('reads the account creation date', async () => {
    const createdAt = await repo.getAccountCreatedAt('nps-u1');
    expect(createdAt).toBeInstanceOf(Date);
    expect(await repo.getAccountCreatedAt('missing')).toBeNull();
  });

  it('records a response and stamps prompt state', async () => {
    await repo.recordResponse('nps-u1', 9, '  great  ', 'dashboard');
    const state = await repo.getPromptState('nps-u1');
    expect(state?.lastRespondedAt).toBeInstanceOf(Date);

    const page = await repo.listResponses(1, 25);
    const mine = page.items.find((r) => r.userId === 'nps-u1');
    expect(mine?.score).toBe(9);
    expect(mine?.bucket).toBe('promoter');
    expect(mine?.userEmail).toBe('nps-u1@local.dev');
  });

  it('marks shown and dismissed independently', async () => {
    await repo.markShown('nps-u1');
    await repo.markDismissed('nps-u1');
    const state = await repo.getPromptState('nps-u1');
    expect(state?.lastShownAt).toBeInstanceOf(Date);
    expect(state?.lastDismissedAt).toBeInstanceOf(Date);
  });

  it('returns score points in a date range', async () => {
    const points = await repo.scorePointsInRange(null, null);
    expect(points.length).toBeGreaterThanOrEqual(1);
    expect(typeof points[0]?.score).toBe('number');
    expect(typeof points[0]?.createdAt).toBe('string');
  });
});
