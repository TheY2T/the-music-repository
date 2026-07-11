import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DATABASE, type Database } from '../../infrastructure/database/database.module';
import { DatastoreHealthCheck } from '../application/ports/datastore-health-check.port';

/** Infrastructure adapter: implements the datastore health check using the Drizzle client. */
@Injectable()
export class DrizzleDatastoreHealthCheck extends DatastoreHealthCheck {
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
