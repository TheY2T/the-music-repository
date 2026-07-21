import { Injectable } from '@nestjs/common';
import { EMPTY_DASHBOARD_SPACES, type StoredDashboardSpaces } from '../../domain/dashboard-space';
import { DashboardSpaces } from '../ports/dashboard-spaces.port';

@Injectable()
export class GetDashboardSpacesUseCase {
  constructor(private readonly spaces: DashboardSpaces) {}

  /** The user's saved spaces, falling back to an empty collection when none exist. */
  async execute(userId: string): Promise<StoredDashboardSpaces> {
    const stored = await this.spaces.get(userId);
    return stored ?? { ...EMPTY_DASHBOARD_SPACES, updatedAt: new Date(0) };
  }
}
