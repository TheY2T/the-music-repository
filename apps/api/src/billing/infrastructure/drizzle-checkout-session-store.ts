import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import { DATABASE, type Database } from '../../infrastructure/database/database.module';
import { checkoutSessions } from '../../infrastructure/database/schema';
import {
  type CheckoutSessionRecord,
  CheckoutSessionStore,
} from '../application/ports/checkout-session-store.port';

@Injectable()
export class DrizzleCheckoutSessionStore extends CheckoutSessionStore {
  constructor(@Inject(DATABASE) private readonly db: Database) {
    super();
  }

  async create(rec: { id: string; userId: string; provider: string }): Promise<void> {
    await this.db.insert(checkoutSessions).values(rec).onConflictDoNothing();
  }

  async findById(id: string): Promise<CheckoutSessionRecord | null> {
    const [row] = await this.db
      .select()
      .from(checkoutSessions)
      .where(eq(checkoutSessions.id, id))
      .limit(1);
    return row ?? null;
  }

  async findBySubscriptionId(subscriptionId: string): Promise<CheckoutSessionRecord | null> {
    const [row] = await this.db
      .select()
      .from(checkoutSessions)
      .where(eq(checkoutSessions.stripeSubscriptionId, subscriptionId))
      .limit(1);
    return row ?? null;
  }

  async findLatestCompletedByUser(userId: string): Promise<CheckoutSessionRecord | null> {
    const [row] = await this.db
      .select()
      .from(checkoutSessions)
      .where(and(eq(checkoutSessions.userId, userId), eq(checkoutSessions.status, 'completed')))
      .orderBy(desc(checkoutSessions.createdAt))
      .limit(1);
    return row ?? null;
  }

  async markCompleted(
    id: string,
    stripe: { customerId?: string; subscriptionId?: string },
  ): Promise<void> {
    await this.db
      .update(checkoutSessions)
      .set({
        status: 'completed',
        stripeCustomerId: stripe.customerId ?? null,
        stripeSubscriptionId: stripe.subscriptionId ?? null,
      })
      .where(eq(checkoutSessions.id, id));
  }

  async markCanceled(id: string): Promise<void> {
    await this.db
      .update(checkoutSessions)
      .set({ status: 'canceled' })
      .where(eq(checkoutSessions.id, id));
  }
}
