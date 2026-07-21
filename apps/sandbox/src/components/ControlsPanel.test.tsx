import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ControlSpec } from '@/registry/types';
import ControlsPanel from './ControlsPanel';

const controls: ControlSpec[] = [
  { name: 'label', type: 'text', default: 'Play' },
  { name: 'disabled', type: 'boolean', default: false },
  {
    name: 'variant',
    type: 'enum',
    default: 'default',
    options: [{ value: 'default' }, { value: 'outline' }],
  },
  { name: 'size', type: 'number', default: 4, min: 0, max: 10, step: 1 },
];

function setup(overrides: Partial<React.ComponentProps<typeof ControlsPanel>> = {}) {
  const onChange = vi.fn();
  const onLocaleChange = vi.fn();
  render(
    <ControlsPanel
      controls={controls}
      values={{ label: 'Play', disabled: false, variant: 'default', size: 4 }}
      onChange={onChange}
      locale="en"
      onLocaleChange={onLocaleChange}
      {...overrides}
    />,
  );
  return { onChange, onLocaleChange };
}

describe('ControlsPanel', () => {
  it('always renders a locale toggle', () => {
    setup();
    expect(screen.getByText('EN')).toBeInTheDocument();
    expect(screen.getByText('中文')).toBeInTheDocument();
  });

  it('renders a control per spec', () => {
    setup();
    expect(screen.getByLabelText('label')).toBeInTheDocument();
    expect(screen.getByLabelText('disabled')).toBeInTheDocument();
    expect(screen.getByLabelText('variant')).toBeInTheDocument();
    expect(screen.getByLabelText('size')).toBeInTheDocument();
  });

  it('reports text edits through onChange', async () => {
    const { onChange } = setup();
    await userEvent.type(screen.getByLabelText('label'), '!');
    expect(onChange).toHaveBeenCalledWith('label', 'Play!');
  });

  it('reports enum changes through onChange', async () => {
    const { onChange } = setup();
    await userEvent.selectOptions(screen.getByLabelText('variant'), 'outline');
    expect(onChange).toHaveBeenCalledWith('variant', 'outline');
  });

  it('reports locale changes', async () => {
    const { onLocaleChange } = setup();
    await userEvent.click(screen.getByText('中文'));
    expect(onLocaleChange).toHaveBeenCalledWith('zh-Hans');
  });
});
