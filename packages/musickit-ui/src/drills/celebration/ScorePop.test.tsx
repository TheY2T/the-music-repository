import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ScorePop from './ScorePop';

/** Force `prefers-reduced-motion` on/off for the duration of a test. */
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

const label = (points: number) => `+${points}`;

describe('ScorePop (Tier-1 micro reward)', () => {
  it('shows the points on a correct answer', () => {
    mockReducedMotion(false);
    render(<ScorePop points={10} trigger={1} label={label} />);
    expect(screen.getByText('+10')).toBeInTheDocument();
  });

  it('still communicates the outcome under reduced motion (static, no animation)', () => {
    mockReducedMotion(true);
    render(<ScorePop points={12} trigger={1} label={label} />);
    const el = screen.getByText('+12');
    expect(el).toBeInTheDocument();
    // Reduced motion drops the keyframe animation but keeps the visible result.
    expect((el as HTMLElement).style.animation).toBe('');
  });

  it('renders nothing before any answer is graded', () => {
    mockReducedMotion(false);
    render(<ScorePop points={null} trigger={0} label={label} />);
    expect(screen.queryByText(/\+/)).not.toBeInTheDocument();
  });
});
