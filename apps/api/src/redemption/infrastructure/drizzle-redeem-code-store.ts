import { Inject, Injectable } from '@nestjs/common';
import { and, eq, gt, sql } from 'drizzle-orm';
import { DATABASE, type Database } from '../../infrastructure/database/database.module';
import { redeemCodes } from '../../infrastructure/database/schema';
import {
  type RedeemCodeRecord,
  RedeemCodeStore,
} from '../application/ports/redeem-code-store.port';

@Injectable()
export class DrizzleRedeemCodeStore extends RedeemCodeStore {
  constructor(@Inject(DATABASE) private readonly db: Database) {
    super();
  }

  async create(rec: {
    code: string;
    key: string;
    source: string;
    durationDays: number | null;
    usesRemaining: number;
    createdBy: string;
  }): Promise<void> {
    await this.db.insert(redeemCodes).values(rec);
  }

  async consume(code: string): Promise<RedeemCodeRecord | null> {
    // Atomic: decrement only when uses remain, so concurrent redeems can't over-consume.
    const [row] = await this.db
      .update(redeemCodes)
      .set({ usesRemaining: sql`${redeemCodes.usesRemaining} - 1` })
      .where(and(eq(redeemCodes.code, code), gt(redeemCodes.usesRemaining, 0)))
      .returning();
    if (!row) {
      return null;
    }
    return {
      code: row.code,
      key: row.key,
      source: row.source,
      durationDays: row.durationDays,
      usesRemaining: row.usesRemaining,
    };
  }
}
