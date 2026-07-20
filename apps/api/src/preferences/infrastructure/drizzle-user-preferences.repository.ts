import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DATABASE, type Database } from '../../infrastructure/database/database.module';
import { userPreferences } from '../../infrastructure/database/schema';
import { UserPreferences } from '../application/ports/user-preferences.port';
import type {
  InstrumentPreferences,
  StoredInstrumentPreferences,
} from '../domain/instrument-preferences';

@Injectable()
export class DrizzleUserPreferences extends UserPreferences {
  constructor(@Inject(DATABASE) private readonly db: Database) {
    super();
  }

  async get(userId: string): Promise<StoredInstrumentPreferences | null> {
    const [row] = await this.db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId));
    if (!row) return null;
    return { ...row.prefs, updatedAt: row.updatedAt };
  }

  async put(userId: string, prefs: InstrumentPreferences): Promise<StoredInstrumentPreferences> {
    const updatedAt = new Date();
    await this.db
      .insert(userPreferences)
      .values({ userId, prefs, updatedAt })
      .onConflictDoUpdate({ target: userPreferences.userId, set: { prefs, updatedAt } });
    return { ...prefs, updatedAt };
  }
}
