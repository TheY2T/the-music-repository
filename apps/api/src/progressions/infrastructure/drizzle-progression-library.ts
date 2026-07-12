import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import { DATABASE, type Database } from '../../infrastructure/database/database.module';
import { savedProgressions } from '../../infrastructure/database/schema';
import { ProgressionLibrary } from '../application/ports/progression-library.port';
import type { ProgressionChord, SavedProgression } from '../domain/saved-progression';

@Injectable()
export class DrizzleProgressionLibrary extends ProgressionLibrary {
  constructor(@Inject(DATABASE) private readonly db: Database) {
    super();
  }

  async list(userId: string): Promise<SavedProgression[]> {
    const rows = await this.db
      .select()
      .from(savedProgressions)
      .where(eq(savedProgressions.userId, userId))
      .orderBy(desc(savedProgressions.updatedAt));
    return rows.map((r) => ({
      name: r.name,
      keyRoot: r.keyRoot,
      chords: r.chords,
      updatedAt: r.updatedAt,
    }));
  }

  async save(
    userId: string,
    name: string,
    keyRoot: number,
    chords: ProgressionChord[],
  ): Promise<void> {
    await this.db
      .insert(savedProgressions)
      .values({ userId, name, keyRoot, chords, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: [savedProgressions.userId, savedProgressions.name],
        set: { keyRoot, chords, updatedAt: new Date() },
      });
  }

  async remove(userId: string, name: string): Promise<void> {
    await this.db
      .delete(savedProgressions)
      .where(and(eq(savedProgressions.userId, userId), eq(savedProgressions.name, name)));
  }
}
