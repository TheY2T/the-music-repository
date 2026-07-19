import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const listFlagsMock = vi.fn();
const listEnvironmentsMock = vi.fn();
const upsertSettingMock = vi.fn();
const createFlagMock = vi.fn();

vi.mock('@TheY2T/tmr-web-data/feature-flags-api', () => ({
  featureFlagAdminApi: {
    listFlags: (...args: unknown[]) => listFlagsMock(...args),
    listEnvironments: (...args: unknown[]) => listEnvironmentsMock(...args),
    upsertSetting: (...args: unknown[]) => upsertSettingMock(...args),
    createFlag: (...args: unknown[]) => createFlagMock(...args),
    deleteFlag: vi.fn(),
    restoreFlag: vi.fn(),
    updateFlag: vi.fn(),
    listRevisions: vi.fn(() => Promise.resolve([])),
    importFlags: vi.fn(),
    createEnvironment: vi.fn(),
    updateEnvironment: vi.fn(),
    deleteEnvironment: vi.fn(),
  },
}));

import AdminFlagManager from './AdminFlagManager';

const ENVS = [
  {
    id: 'e-dev',
    key: 'dev',
    label: 'Development',
    rank: 0,
    isDefault: true,
    archived: false,
    deleted: false,
    updatedAt: '',
  },
  {
    id: 'e-uat',
    key: 'uat',
    label: 'UAT',
    rank: 1,
    isDefault: false,
    archived: false,
    deleted: false,
    updatedAt: '',
  },
];

function flag(over: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'f1',
    key: 'tools.metronome',
    description: 'The metronome tool',
    domain: 'tools',
    flagType: 'boolean',
    defaultValue: true,
    source: 'code',
    seeded: true,
    deleted: false,
    updatedAt: '2026-07-19T00:00:00.000Z',
    settings: [
      {
        environmentId: 'e-dev',
        environmentKey: 'dev',
        enabled: true,
        defaultVariant: 'on',
        variants: { on: true, off: false },
        targeting: null,
      },
      {
        environmentId: 'e-uat',
        environmentKey: 'uat',
        enabled: false,
        defaultVariant: 'off',
        variants: { on: true, off: false },
        targeting: null,
      },
    ],
    ...over,
  };
}

describe('AdminFlagManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listEnvironmentsMock.mockResolvedValue(ENVS);
    listFlagsMock.mockResolvedValue([flag()]);
    upsertSettingMock.mockResolvedValue(flag());
    createFlagMock.mockResolvedValue(flag());
  });

  it('lists flags with their per-environment enabled state', async () => {
    render(<AdminFlagManager locale="en" />);
    expect(await screen.findByText('tools.metronome')).toBeTruthy();
    // The enabled checkbox reflects the default env (dev → enabled)
    const checkbox = screen.getByLabelText('Enabled') as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });

  it('toggles a flag for the selected environment', async () => {
    render(<AdminFlagManager locale="en" />);
    const checkbox = (await screen.findByLabelText('Enabled')) as HTMLInputElement;
    fireEvent.click(checkbox);
    await waitFor(() =>
      expect(upsertSettingMock).toHaveBeenCalledWith('f1', 'e-dev', {
        enabled: false,
        defaultVariant: 'off',
      }),
    );
  });

  it('opens the create-flag dialog', async () => {
    render(<AdminFlagManager locale="en" />);
    await screen.findByText('tools.metronome');
    fireEvent.click(screen.getByRole('button', { name: /New flag/i }));
    expect(await screen.findByText('New feature flag')).toBeTruthy();
  });
});
