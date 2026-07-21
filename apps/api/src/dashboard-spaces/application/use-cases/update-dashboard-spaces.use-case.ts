import { Injectable } from '@nestjs/common';
import type { DashboardSpacesData, StoredDashboardSpaces } from '../../domain/dashboard-space';
import { DashboardSpaces } from '../ports/dashboard-spaces.port';

@Injectable()
export class UpdateDashboardSpacesUseCase {
  constructor(private readonly spaces: DashboardSpaces) {}

  execute(userId: string, data: DashboardSpacesData): Promise<StoredDashboardSpaces> {
    return this.spaces.put(userId, data);
  }
}
