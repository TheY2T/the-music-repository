import { Inject, Injectable } from '@nestjs/common';
import { and, eq, gt, isNull, or } from 'drizzle-orm';
import { DATABASE, type Database } from '../../infrastructure/database/database.module';
import { entitlements } from '../../infrastructure/database/schema';
import { type EntitlementGrant, Entitlements } from '../application/ports/entitlements.port';

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

  async grantPremium(userId: string, source: string, expiresAt: Date | null = null): Promise<void> {
    await this.db
      .insert(entitlements)
      .values({ userId, key: PREMIUM, source, expiresAt })
      .onConflictDoUpdate({
        target: [entitlements.userId, entitlements.key],
        set: { source, grantedAt: new Date(), expiresAt },
      });
  }

  async revokePremium(userId: string): Promise<void> {
    await this.db
      .delete(entitlements)
      .where(and(eq(entitlements.userId, userId), eq(entitlements.key, PREMIUM)));
  }
}
