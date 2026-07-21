import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import SettingsMenu from './SettingsMenu';

// Representative island test: the gear opens a single popover that gathers the language and appearance
// preferences. We render the island root (not sub-parts) per the one-island-root rule; i18n-by-prop.
describe('SettingsMenu island', () => {
  it('opens the settings popover with language and appearance controls', async () => {
    const user = userEvent.setup();
    render(<SettingsMenu locale="en" i18nEnabled />);

    await user.click(screen.getByRole('button', { name: 'Settings' }));

    const panel = screen.getByRole('dialog', { name: 'Settings' });
    expect(panel).toBeInTheDocument();
    // Language options (i18n enabled) alongside the appearance aesthetics.
    expect(screen.getByText('EN')).toBeInTheDocument();
    expect(screen.getByText('中文')).toBeInTheDocument();
    expect(screen.getByText('Hybrid')).toBeInTheDocument();
    expect(screen.getByText('Dark')).toBeInTheDocument();
  });

  it('hides the language control when i18n is disabled', async () => {
    const user = userEvent.setup();
    render(<SettingsMenu locale="en" i18nEnabled={false} />);

    await user.click(screen.getByRole('button', { name: 'Settings' }));

    expect(screen.queryByText('中文')).not.toBeInTheDocument();
    expect(screen.getByText('Hybrid')).toBeInTheDocument();
  });
});
