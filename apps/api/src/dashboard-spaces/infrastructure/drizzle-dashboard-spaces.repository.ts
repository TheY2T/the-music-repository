import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DATABASE, type Database } from '../../infrastructure/database/database.module';
import { dashboardSpaces } from '../../infrastructure/database/schema';
import { DashboardSpaces } from '../application/ports/dashboard-spaces.port';
import type { DashboardSpacesData, StoredDashboardSpaces } from '../domain/dashboard-space';

@Injectable()
export class DrizzleDashboardSpaces extends DashboardSpaces {
  constructor(@Inject(DATABASE) private readonly db: Database) {
    super();
  }

  async get(userId: string): Promise<StoredDashboardSpaces | null> {
    const [row] = await this.db
      .select()
      .from(dashboardSpaces)
      .where(eq(dashboardSpaces.userId, userId));
    if (!row) return null;
    return {
      spaces: row.spaces,
      activeSpaceId: row.activeSpaceId ?? undefined,
      updatedAt: row.updatedAt,
    };
  }

  async put(userId: string, data: DashboardSpacesData): Promise<StoredDashboardSpaces> {
    const updatedAt = new Date();
    const activeSpaceId = data.activeSpaceId ?? null;
    await this.db
      .insert(dashboardSpaces)
      .values({ userId, spaces: data.spaces, activeSpaceId, updatedAt })
      .onConflictDoUpdate({
        target: dashboardSpaces.userId,
        set: { spaces: data.spaces, activeSpaceId, updatedAt },
      });
    return { spaces: data.spaces, activeSpaceId: data.activeSpaceId, updatedAt };
  }
}
