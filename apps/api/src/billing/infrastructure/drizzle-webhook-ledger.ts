import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DATABASE, type Database } from '../../infrastructure/database/database.module';
import { processedWebhooks } from '../../infrastructure/database/schema';
import { WebhookLedger } from '../application/ports/webhook-ledger.port';

@Injectable()
export class DrizzleWebhookLedger extends WebhookLedger {
  constructor(@Inject(DATABASE) private readonly db: Database) {
    super();
  }

  async wasProcessed(eventId: string): Promise<boolean> {
    const [row] = await this.db
      .select({ eventId: processedWebhooks.eventId })
      .from(processedWebhooks)
      .where(eq(processedWebhooks.eventId, eventId))
      .limit(1);
    return !!row;
  }

  async markProcessed(eventId: string): Promise<void> {
    await this.db.insert(processedWebhooks).values({ eventId }).onConflictDoNothing();
  }
}
