import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LocalizableField } from './LocalizableField';

describe('LocalizableField', () => {
  it('hides the English reference in the base locale', () => {
    render(
      <LocalizableField
        locale="en"
        kind="plain"
        isBase
        label="Title"
        value="Für Elise"
        baseValue="Für Elise"
        onChange={() => {}}
        baseLabel="English (base)"
      />,
    );
    expect(screen.queryByText('English (base)')).not.toBeInTheDocument();
  });

  it('shows the English reference and edits the value in a target locale', () => {
    const onChange = vi.fn();
    render(
      <LocalizableField
        locale="en"
        kind="plain"
        isBase={false}
        label="Title"
        htmlFor="f"
        value="致爱丽丝"
        baseValue="Für Elise"
        onChange={onChange}
        baseLabel="English (base)"
      />,
    );
    expect(screen.getByText('English (base)')).toBeInTheDocument();
    expect(screen.getByText('Für Elise')).toBeInTheDocument();

    fireEvent.change(screen.getByDisplayValue('致爱丽丝'), { target: { value: '给爱丽丝' } });
    expect(onChange).toHaveBeenCalledWith('给爱丽丝');
  });
});
