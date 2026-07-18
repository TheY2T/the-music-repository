import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ComboCounter from './ComboCounter';

function mockReducedMotion(reduce: boolean) {
  vi.stubGlobal(
    'matchMedia',
    (query: string) =>
      ({
        matches: reduce && query.includes('reduce'),
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
      }) as unknown as MediaQueryList,
  );
}
afterEach(() => vi.unstubAllGlobals());

const label = (n: number) => `${n} in a row!`;

describe('ComboCounter (Tier-2)', () => {
  it('is hidden below a 2-combo', () => {
    mockReducedMotion(false);
    const { container } = render(<ComboCounter combo={1} label={label} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the running count from 2 up', () => {
    mockReducedMotion(false);
    render(<ComboCounter combo={3} label={label} />);
    expect(screen.getByText('3 in a row!')).toBeInTheDocument();
  });

  it('escalates colour by threshold (5 → success, 20 → warning)', () => {
    mockReducedMotion(false);
    const { rerender } = render(<ComboCounter combo={5} label={label} />);
    expect(screen.getByText('5 in a row!').className).toContain('text-success');
    rerender(<ComboCounter combo={20} label={label} />);
    expect(screen.getByText('20 in a row!').className).toContain('text-warning');
  });

  it('drops the pop animation under reduced motion but keeps the count', () => {
    mockReducedMotion(true);
    render(<ComboCounter combo={6} label={label} />);
    const el = screen.getByText('6 in a row!');
    expect(el).toBeInTheDocument();
    expect(el.className).not.toContain('tmr-combo-pop');
  });
});
