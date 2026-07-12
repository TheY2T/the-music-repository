import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import LanguageSwitcher from './LanguageSwitcher';

// Representative island test: an island takes `locale` as a plain prop (i18n-by-prop) and renders
// design-system UI. We render the island root (not sub-parts) per the one-island-root rule.
describe('LanguageSwitcher island', () => {
  it('renders both locale options labelled in their own script', () => {
    render(<LanguageSwitcher locale="en" />);
    expect(screen.getByText('EN')).toBeInTheDocument();
    expect(screen.getByText('中文')).toBeInTheDocument();
  });
});
