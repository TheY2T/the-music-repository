import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const listFlagsMock = vi.fn();
const listEnvironmentsMock = vi.fn();
const upsertSettingMock = vi.fn();
const createFlagMock = vi.fn();
const deleteEnvironmentMock = vi.fn();
const deleteFlagMock = vi.fn();
const importFlagsMock = vi.fn();

vi.mock('@TheY2T/tmr-web-data/feature-flags-api', () => ({
  featureFlagAdminApi: {
    listFlags: (...args: unknown[]) => listFlagsMock(...args),
    listEnvironments: (...args: unknown[]) => listEnvironmentsMock(...args),
    upsertSetting: (...args: unknown[]) => upsertSettingMock(...args),
    createFlag: (...args: unknown[]) => createFlagMock(...args),
    deleteEnvironment: (...args: unknown[]) => deleteEnvironmentMock(...args),
    deleteFlag: (...args: unknown[]) => deleteFlagMock(...args),
    importFlags: (...args: unknown[]) => importFlagsMock(...args),
    restoreFlag: vi.fn(),
    updateFlag: vi.fn(),
    listRevisions: vi.fn(() => Promise.resolve([])),
    createEnvironment: vi.fn(),
    updateEnvironment: vi.fn(),
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

  it('requires typing the environment key before deleting an environment', async () => {
    deleteEnvironmentMock.mockResolvedValue({});
    render(<AdminFlagManager locale="en" />);
    await screen.findByText('tools.metronome');
    // open the environments dialog
    fireEvent.click(screen.getByRole('button', { name: /Environments/i }));
    // delete the non-default environment (uat)
    const uatRow = (await screen.findByText('uat')).closest('div') as HTMLElement;
    fireEvent.click(within(uatRow).getByRole('button', { name: 'Delete' }));

    // confirmation dialog: delete stays disabled until the exact key is typed
    expect(await screen.findByText('Delete environment')).toBeTruthy();
    const confirmInput = screen.getByLabelText('Environment key') as HTMLInputElement;
    const confirmButtons = screen.getAllByRole('button', { name: 'Delete' });
    const confirmDelete = confirmButtons[confirmButtons.length - 1] as HTMLButtonElement;
    expect(confirmDelete.disabled).toBe(true);

    fireEvent.change(confirmInput, { target: { value: 'wrong' } });
    expect(confirmDelete.disabled).toBe(true);
    expect(deleteEnvironmentMock).not.toHaveBeenCalled();

    fireEvent.change(confirmInput, { target: { value: 'uat' } });
    expect(confirmDelete.disabled).toBe(false);
    fireEvent.click(confirmDelete);
    await waitFor(() => expect(deleteEnvironmentMock).toHaveBeenCalledWith('e-uat'));
  });

  it('requires typing the flag key before deleting a flag', async () => {
    deleteFlagMock.mockResolvedValue({});
    render(<AdminFlagManager locale="en" />);
    const flagRow = (await screen.findByText('tools.metronome')).closest('tr') as HTMLElement;
    fireEvent.click(within(flagRow).getByRole('button', { name: 'Delete' }));

    expect(await screen.findByText('Delete flag')).toBeTruthy();
    const input = screen.getByLabelText('Flag key') as HTMLInputElement;
    const confirmDelete = screen
      .getAllByRole('button', { name: 'Delete' })
      .at(-1) as HTMLButtonElement;
    expect(confirmDelete.disabled).toBe(true);

    fireEvent.change(input, { target: { value: 'tools.metronome' } });
    expect(confirmDelete.disabled).toBe(false);
    fireEvent.click(confirmDelete);
    await waitFor(() => expect(deleteFlagMock).toHaveBeenCalledWith('f1'));
  });

  it('exports the selected environment flags as a JSON download', async () => {
    const createObjectURL = vi.fn(() => 'blob:x');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL });
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);

    render(<AdminFlagManager locale="en" />);
    await screen.findByText('tools.metronome');
    fireEvent.click(screen.getByRole('button', { name: /Export/i }));

    expect(createObjectURL).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    clickSpy.mockRestore();
    vi.unstubAllGlobals();
  });

  it('imports flags from a chosen JSON file', async () => {
    importFlagsMock.mockResolvedValue(1);
    render(<AdminFlagManager locale="en" />);
    await screen.findByText('tools.metronome');
    fireEvent.click(screen.getByRole('button', { name: /Import/i }));

    await screen.findByText('Import flags');
    const input = document.querySelector('input[type=file]') as HTMLInputElement;
    const file = new File(['{"flags":{"tools.new":{"defaultVariant":"on"}}}'], 'flags.json', {
      type: 'application/json',
    });
    fireEvent.change(input, { target: { files: [file] } });
    // the dialog's confirm button is the last "Import" (the toolbar one opened the dialog)
    fireEvent.click(screen.getAllByRole('button', { name: 'Import' }).at(-1) as HTMLButtonElement);

    await waitFor(() =>
      expect(importFlagsMock).toHaveBeenCalledWith({ 'tools.new': { defaultVariant: 'on' } }),
    );
  });
});
