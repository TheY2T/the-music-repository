import { join } from 'node:path';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../infrastructure/database/database.module';
import * as schema from '../../infrastructure/database/schema';
import { DrizzleDatastoreHealthCheck } from './drizzle-datastore-health-check.adapter';

// Integration exemplar: a real Postgres via Testcontainers, the app's Drizzle migrations applied,
// and the adapter exercised against it. Proves the migration + adapter harness works end-to-end.
// Requires a Docker/podman socket (skipped implicitly if unavailable — the suite is opt-in via
// `test:integration`). See ADR 0020 · docs/features/testing.md.
// Vitest runs with cwd = apps/api, so the migrations live at `<cwd>/drizzle`.
const MIGRATIONS = join(process.cwd(), 'drizzle');

describe('DrizzleDatastoreHealthCheck (Testcontainers Postgres)', () => {
  let container: StartedPostgreSqlContainer;
  let client: ReturnType<typeof postgres>;
  let db: Database;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine').start();
    client = postgres(container.getConnectionUri(), { max: 1 });
    db = drizzle(client, { schema });
    await migrate(db, { migrationsFolder: MIGRATIONS });
  });

  afterAll(async () => {
    await client?.end();
    await container?.stop();
  });

  it('pings a healthy datastore successfully', async () => {
    const health = new DrizzleDatastoreHealthCheck(db);
    expect(await health.ping()).toBe(true);
  });

  it('reports unhealthy once the connection is closed', async () => {
    const throwaway = postgres(container.getConnectionUri(), { max: 1 });
    const health = new DrizzleDatastoreHealthCheck(drizzle(throwaway, { schema }));
    await throwaway.end();
    expect(await health.ping()).toBe(false);
  });
});
