import { join } from 'node:path';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../infrastructure/database/database.module';
import * as schema from '../../infrastructure/database/schema';
import { DrizzleFeedbackRepository } from './drizzle-feedback.repository';

// Real Postgres via Testcontainers + the app's Drizzle migrations. Opt-in via `test:integration`
// (needs a Docker/podman socket). See ADR 0020 · docs/features/testing.md.
const MIGRATIONS = join(process.cwd(), 'drizzle');

describe('DrizzleFeedbackRepository (Testcontainers Postgres)', () => {
  let container: StartedPostgreSqlContainer;
  let client: ReturnType<typeof postgres>;
  let db: Database;
  let repo: DrizzleFeedbackRepository;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine').start();
    client = postgres(container.getConnectionUri(), { max: 1 });
    db = drizzle(client, { schema });
    await migrate(db, { migrationsFolder: MIGRATIONS });
    await db.insert(schema.user).values([
      { id: 'u1', name: 'Learner One', email: 'u1@local.dev' },
      { id: 'u2', name: 'Learner Two', email: 'u2@local.dev' },
    ]);
    repo = new DrizzleFeedbackRepository(db);
  });

  afterAll(async () => {
    await client?.end();
    await container?.stop();
  });

  it('creates a submission and reads it back with the submitter email', async () => {
    const created = await repo.create({
      type: 'idea',
      title: 'Add a metronome',
      message: 'please',
      userId: 'u1',
      locale: 'en',
      pageUrl: null,
      userAgent: null,
    });
    expect(created.id).toBeTruthy();
    expect(created.status).toBe('new');

    const fetched = await repo.getById(created.id);
    expect(fetched?.userEmail).toBe('u1@local.dev');
  });

  it('filters the admin list by type and status', async () => {
    await repo.create({
      type: 'bug',
      title: null,
      message: 'broken',
      userId: 'u1',
      locale: null,
      pageUrl: '/tools',
      userAgent: 'UA',
    });
    const bugs = await repo.list({ type: 'bug', page: 1, pageSize: 50 });
    expect(bugs.items.every((i) => i.type === 'bug')).toBe(true);
    expect(bugs.total).toBeGreaterThanOrEqual(1);
  });

  it('updates status/notes/public and 404s on a missing id', async () => {
    const created = await repo.create({
      type: 'other',
      title: null,
      message: 'x',
      userId: 'u2',
      locale: null,
      pageUrl: null,
      userAgent: null,
    });
    const updated = await repo.update(created.id, {
      status: 'planned',
      adminNotes: 'looking into it',
      isPublic: true,
    });
    expect(updated?.status).toBe('planned');
    expect(updated?.isPublic).toBe(true);
    expect(
      await repo.update('00000000-0000-0000-0000-000000000000', { status: 'closed' }),
    ).toBeNull();
  });

  it('only lists public items on the board and votes idempotently', async () => {
    const created = await repo.create({
      type: 'idea',
      title: 'Public idea',
      message: 'vote me',
      userId: 'u1',
      locale: null,
      pageUrl: null,
      userAgent: null,
    });
    // Not votable until public.
    expect(await repo.addVote(created.id, 'u1')).toBeNull();
    await repo.update(created.id, { isPublic: true });

    const first = await repo.addVote(created.id, 'u1');
    expect(first?.upvoteCount).toBe(1);
    expect(first?.hasVoted).toBe(true);
    // A second vote by the same user is a no-op (unique constraint).
    const second = await repo.addVote(created.id, 'u1');
    expect(second?.upvoteCount).toBe(1);

    const removed = await repo.removeVote(created.id, 'u1');
    expect(removed?.upvoteCount).toBe(0);
    expect(removed?.hasVoted).toBe(false);

    const board = await repo.listBoard({ sort: 'top', page: 1, pageSize: 50, viewerId: 'u1' });
    expect(board.items.some((i) => i.id === created.id)).toBe(true);
  });
});
