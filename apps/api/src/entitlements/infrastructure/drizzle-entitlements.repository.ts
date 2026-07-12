import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, gt, isNull, or } from 'drizzle-orm';
import { DATABASE, type Database } from '../../infrastructure/database/database.module';
import { entitlementEvents, entitlements } from '../../infrastructure/database/schema';
import {
  type EntitlementEvent,
  type EntitlementGrant,
  Entitlements,
} from '../application/ports/entitlements.port';

const PREMIUM = 'premium';

@Injectable()
export class DrizzleEntitlements extends Entitlements {
  constructor(@Inject(DATABASE) private readonly db: Database) {
    super();
  }

  async getPremium(userId: string): Promise<EntitlementGrant | null> {
    const [row] = await this.db
      .select()
      .from(entitlements)
      .where(
        and(
          eq(entitlements.userId, userId),
          eq(entitlements.key, PREMIUM),
          // Active = no expiry, or not yet expired.
          or(isNull(entitlements.expiresAt), gt(entitlements.expiresAt, new Date())),
        ),
      )
      .limit(1);
    if (!row) {
      return null;
    }
    return { source: row.source, grantedAt: row.grantedAt, expiresAt: row.expiresAt };
  }

  async activeKeys(userId: string): Promise<string[]> {
    const rows = await this.db
      .select({ key: entitlements.key })
      .from(entitlements)
      .where(
        and(
          eq(entitlements.userId, userId),
          or(isNull(entitlements.expiresAt), gt(entitlements.expiresAt, new Date())),
        ),
      );
    return rows.map((r) => r.key);
  }

  async grant(
    userId: string,
    key: string,
    source: string,
    expiresAt: Date | null = null,
  ): Promise<void> {
    await this.db
      .insert(entitlements)
      .values({ userId, key, source, expiresAt })
      .onConflictDoUpdate({
        target: [entitlements.userId, entitlements.key],
        set: { source, grantedAt: new Date(), expiresAt },
      });
    await this.db.insert(entitlementEvents).values({ userId, key, action: 'grant', source });
  }

  grantPremium(userId: string, source: string, expiresAt: Date | null = null): Promise<void> {
    return this.grant(userId, PREMIUM, source, expiresAt);
  }

  async revokePremium(userId: string): Promise<void> {
    const [deleted] = await this.db
      .delete(entitlements)
      .where(and(eq(entitlements.userId, userId), eq(entitlements.key, PREMIUM)))
      .returning({ source: entitlements.source });
    if (deleted) {
      await this.db
        .insert(entitlementEvents)
        .values({ userId, key: PREMIUM, action: 'revoke', source: deleted.source });
    }
  }

  async history(userId: string): Promise<EntitlementEvent[]> {
    const rows = await this.db
      .select()
      .from(entitlementEvents)
      .where(eq(entitlementEvents.userId, userId))
      .orderBy(desc(entitlementEvents.createdAt));
    return rows.map((r) => ({
      key: r.key,
      action: r.action as 'grant' | 'revoke',
      source: r.source,
      at: r.createdAt,
    }));
  }
}
