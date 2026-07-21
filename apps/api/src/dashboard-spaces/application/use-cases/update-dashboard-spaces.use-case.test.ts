import { describe, expect, it } from 'vitest';
import type { DashboardSpacesData } from '../../domain/dashboard-space';
import type { DashboardSpaces } from '../ports/dashboard-spaces.port';
import { UpdateDashboardSpacesUseCase } from './update-dashboard-spaces.use-case';

describe('UpdateDashboardSpacesUseCase', () => {
  it('delegates the upsert to the port and returns the stored record', async () => {
    const data: DashboardSpacesData = {
      spaces: [
        {
          id: 's1',
          name: 'My space',
          widgets: [{ id: 'w1', type: 'metronome', x: 0, y: 0, w: 4, h: 3, config: {} }],
        },
      ],
      activeSpaceId: 's1',
    };
    const calls: { userId: string; data: DashboardSpacesData }[] = [];
    const port: DashboardSpaces = {
      get: async () => null,
      put: async (userId, d) => {
        calls.push({ userId, data: d });
        return { ...d, updatedAt: new Date('2026-02-02T00:00:00.000Z') };
      },
    };

    const result = await new UpdateDashboardSpacesUseCase(port).execute('user-9', data);

    expect(calls).toEqual([{ userId: 'user-9', data }]);
    expect(result.updatedAt).toEqual(new Date('2026-02-02T00:00:00.000Z'));
    expect(result.spaces[0]?.widgets[0]?.type).toBe('metronome');
  });
});
