import { join } from 'node:path';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../infrastructure/database/database.module';
import * as schema from '../../infrastructure/database/schema';
import { kofiDonations } from '../../infrastructure/database/schema';
import type { KofiDonation } from '../domain/kofi-donation';
import { DrizzleDonationLedger } from './drizzle-donation-ledger.repository';

// Vitest runs with cwd = apps/api, so the migrations live at `<cwd>/drizzle`.
const MIGRATIONS = join(process.cwd(), 'drizzle');

function donation(over: Partial<KofiDonation> = {}): KofiDonation {
  return {
    messageId: 'msg-1',
    kofiTransactionId: 'txn-1',
    type: 'Donation',
    fromName: 'Jo Example',
    email: 'jo@example.com',
    amount: '3.00',
    currency: 'AUD',
    message: 'Keep it up!',
    isPublic: true,
    isSubscriptionPayment: false,
    tierName: null,
    timestamp: '2026-07-19T13:04:30Z',
    raw: { message_id: 'msg-1', type: 'Donation' },
    ...over,
  };
}

describe('DrizzleDonationLedger (Testcontainers Postgres)', () => {
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

  it('records a donation and reports it as recorded', async () => {
    const ledger = new DrizzleDonationLedger(db);
    await ledger.record(donation());

    expect(await ledger.wasRecorded('msg-1')).toBe(true);
    expect(await ledger.wasRecorded('missing')).toBe(false);

    const [row] = await db.select().from(kofiDonations);
    expect(row).toMatchObject({ messageId: 'msg-1', type: 'Donation', amount: '3.00' });
  });

  it('is idempotent — re-recording the same messageId keeps a single row', async () => {
    const ledger = new DrizzleDonationLedger(db);
    await ledger.record(donation({ messageId: 'msg-dupe' }));
    await ledger.record(donation({ messageId: 'msg-dupe', fromName: 'Someone Else' }));

    const rows = await db.select().from(kofiDonations);
    expect(rows.filter((r) => r.messageId === 'msg-dupe')).toHaveLength(1);
  });
});
