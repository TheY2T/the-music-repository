import { describe, expect, it } from 'vitest';
import type { StoredDashboardSpaces } from '../../domain/dashboard-space';
import type { DashboardSpaces } from '../ports/dashboard-spaces.port';
import { GetDashboardSpacesUseCase } from './get-dashboard-spaces.use-case';

const unusedPut: DashboardSpaces['put'] = () => {
  throw new Error('put should not be called');
};

describe('GetDashboardSpacesUseCase', () => {
  it('returns an empty collection when the user has never saved', async () => {
    const port: DashboardSpaces = { get: async () => null, put: unusedPut };
    const result = await new GetDashboardSpacesUseCase(port).execute('user-1');

    expect(result.spaces).toEqual([]);
    expect(result.activeSpaceId).toBeUndefined();
    expect(result.updatedAt).toEqual(new Date(0));
  });

  it('returns the stored spaces when present', async () => {
    const stored: StoredDashboardSpaces = {
      spaces: [{ id: 's1', name: 'Warm-up', widgets: [] }],
      activeSpaceId: 's1',
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    };
    const port: DashboardSpaces = { get: async () => stored, put: unusedPut };

    expect(await new GetDashboardSpacesUseCase(port).execute('user-1')).toBe(stored);
  });
});
