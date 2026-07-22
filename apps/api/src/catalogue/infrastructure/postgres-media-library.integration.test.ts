import { join } from 'node:path';
import { ConfigService } from '@nestjs/config';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../infrastructure/database/database.module';
import * as schema from '../../infrastructure/database/schema';
import { PostgresMediaLibrary } from './postgres-media-library.adapter';

// Exercises the media_objects migration + adapter against a real Postgres (bytea round-trip).
// Opt-in via `test:integration`; needs a Docker/podman socket. See docs/features/testing.md.
const MIGRATIONS = join(process.cwd(), 'drizzle');

function config(values: Record<string, string> = {}): ConfigService {
  return { get: (key: string) => values[key] } as unknown as ConfigService;
}

describe('PostgresMediaLibrary (Testcontainers Postgres)', () => {
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

  it('stores and reads back object bytes with their mime', async () => {
    const media = new PostgresMediaLibrary(db, config());
    const bytes = new TextEncoder().encode('\\title "Demo" . 3.4 4.4 |');
    await media.putObject('scores/demo.alphatex', bytes, 'text/plain; charset=utf-8');

    const object = await media.getObject('scores/demo.alphatex');
    expect(object?.mime).toBe('text/plain; charset=utf-8');
    expect(new TextDecoder().decode(object?.data)).toBe('\\title "Demo" . 3.4 4.4 |');
    // Validators used to build the response ETag / Last-Modified.
    expect(object?.bytes).toBe(bytes.byteLength);
    expect(object?.updatedAt).toBeInstanceOf(Date);
  });

  it('overwrites the bytes on a repeated key (idempotent seed)', async () => {
    const media = new PostgresMediaLibrary(db, config());
    await media.putObject('k', new TextEncoder().encode('first'), 'text/plain');
    await media.putObject('k', new TextEncoder().encode('second'), 'text/plain');
    const object = await media.getObject('k');
    expect(new TextDecoder().decode(object?.data)).toBe('second');
  });

  it('returns null for an unknown key', async () => {
    const media = new PostgresMediaLibrary(db, config());
    expect(await media.getObject('missing')).toBeNull();
  });

  it('presigns a browser-usable media URL against the public base', async () => {
    const media = new PostgresMediaLibrary(
      db,
      config({ MEDIA_PUBLIC_URL: 'https://api.example.com' }),
    );
    const url = await media.presignGetUrl('content/a/b c.png');
    expect(url).toBe('https://api.example.com/media?key=content%2Fa%2Fb%20c.png');
  });
});
