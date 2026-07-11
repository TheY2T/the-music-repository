import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DATABASE, type Database } from '../../infrastructure/database/database.module';
import { DatabaseHealthPort } from '../application/ports/database-health.port';

/** Infrastructure adapter: implements the health port using the Drizzle client. */
@Injectable()
export class DrizzleDatabaseHealthAdapter extends DatabaseHealthPort {
  constructor(@Inject(DATABASE) private readonly db: Database) {
    super();
  }

  async ping(): Promise<boolean> {
    try {
      await this.db.execute(sql`select 1`);
      return true;
    } catch {
      return false;
    }
  }
}
