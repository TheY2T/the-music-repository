import { join } from 'node:path';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../infrastructure/database/database.module';
import * as schema from '../../infrastructure/database/schema';
import { contentItems } from '../../infrastructure/database/schema';
import type { ContentWriteData } from '../application/ports/content-authoring.port';
import { DrizzleContentAuthoring } from './drizzle-content-authoring.adapter';

// Proves the write path persists the fields the CMS previously dropped — `details` (facts + related +
// embeds), `tier`, and the canonical `bodyDoc` — and that a partial update preserves them rather than
// clearing them. Requires a Docker/podman socket (opt-in via `test:integration`). See ADR 0020.
const MIGRATIONS = join(process.cwd(), 'drizzle');

const base: ContentWriteData = {
  slug: 'write-path-item',
  title: 'Write path item',
  type: 'lesson',
  genres: [],
  instruments: [],
  topics: [],
  tags: [],
};

describe('DrizzleContentAuthoring (Testcontainers Postgres)', () => {
  let container: StartedPostgreSqlContainer;
  let client: ReturnType<typeof postgres>;
  let db: Database;
  let adapter: DrizzleContentAuthoring;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine').start();
    client = postgres(container.getConnectionUri(), { max: 1 });
    db = drizzle(client, { schema });
    await migrate(db, { migrationsFolder: MIGRATIONS });
    adapter = new DrizzleContentAuthoring(db);
  });

  afterAll(async () => {
    await client?.end();
    await container?.stop();
  });

  async function rowFor(slug: string) {
    const [row] = await db.select().from(contentItems).where(eq(contentItems.slug, slug));
    if (!row) {
      throw new Error(`content row not found: ${slug}`);
    }
    return row;
  }

  it('persists details (facts + related + embeds), tier, and bodyDoc on create', async () => {
    await adapter.create({
      ...base,
      visibility: 'premium',
      tier: 'pro',
      details: { key: 'A minor', era: 'Baroque' },
      related: ['other-item'],
      embeds: [{ tool: 'chord-diagrams', chords: ['C', 'G'] }],
      bodyDoc: { type: 'doc', content: [{ type: 'paragraph' }] },
    });

    const row = await rowFor('write-path-item');
    expect(row.tier).toBe('pro');
    expect(row.details).toEqual({
      key: 'A minor',
      era: 'Baroque',
      related: ['other-item'],
      embeds: [{ tool: 'chord-diagrams', chords: ['C', 'G'] }],
    });
    expect(row.bodyDoc).toEqual({ type: 'doc', content: [{ type: 'paragraph' }] });
  });

  it('preserves details/tier/bodyDoc on a partial update that omits them', async () => {
    await adapter.update('write-path-item', { ...base, title: 'Renamed' });

    const row = await rowFor('write-path-item');
    expect(row.title).toBe('Renamed');
    // Untouched because the payload carried no details/tier/bodyDoc.
    expect(row.tier).toBe('pro');
    expect(row.details).toEqual({
      key: 'A minor',
      era: 'Baroque',
      related: ['other-item'],
      embeds: [{ tool: 'chord-diagrams', chords: ['C', 'G'] }],
    });
    expect(row.bodyDoc).toEqual({ type: 'doc', content: [{ type: 'paragraph' }] });
  });

  it('overlays only the provided details parts on update, preserving the rest', async () => {
    await adapter.update('write-path-item', {
      ...base,
      title: 'Renamed',
      details: { key: 'C major' },
      embeds: [{ tool: 'keyboard', root: 'C' }],
    });

    const row = await rowFor('write-path-item');
    // `key` overridden + embeds re-set; `era` and `related` preserved because the update omitted them
    // (the block editor edits embeds but has no facts/related UI, so it must not clobber them).
    expect(row.details).toEqual({
      key: 'C major',
      era: 'Baroque',
      related: ['other-item'],
      embeds: [{ tool: 'keyboard', root: 'C' }],
    });
  });

  it('clears embeds when an update sends an empty embeds array', async () => {
    await adapter.update('write-path-item', { ...base, title: 'Renamed', embeds: [] });

    const row = await rowFor('write-path-item');
    expect(row.details?.embeds).toBeUndefined();
    // Facts + related still preserved.
    expect(row.details?.era).toBe('Baroque');
  });
});
