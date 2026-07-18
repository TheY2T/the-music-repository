import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SessionSummary from './SessionSummary';

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

describe('SessionSummary (Tier-3)', () => {
  it('awards 3 stars for a flawless session', () => {
    mockReducedMotion(true);
    render(<SessionSummary reviewed={10} correctCount={10} personalBest={false} locale="en" />);
    expect(screen.getByLabelText('3 of 3 stars')).toBeInTheDocument();
    expect(screen.getByText(/100% correct/)).toBeInTheDocument();
  });

  it('awards fewer stars on lower accuracy', () => {
    mockReducedMotion(true);
    render(<SessionSummary reviewed={10} correctCount={7} personalBest={false} locale="en" />);
    expect(screen.getByLabelText('1 of 3 stars')).toBeInTheDocument();
  });

  it('shows the personal-best callout only when set', () => {
    mockReducedMotion(true);
    const { rerender } = render(
      <SessionSummary reviewed={5} correctCount={5} personalBest={false} locale="en" />,
    );
    expect(screen.queryByText('New personal best!')).not.toBeInTheDocument();
    rerender(<SessionSummary reviewed={5} correctCount={5} personalBest locale="en" />);
    expect(screen.getByText('New personal best!')).toBeInTheDocument();
  });

  it('shows a level-up fanfare when a deck advanced a tier', () => {
    mockReducedMotion(true);
    render(
      <SessionSummary
        reviewed={10}
        correctCount={10}
        personalBest={false}
        leveledUpTo="advanced"
        locale="en"
      />,
    );
    expect(screen.getByText(/Level up: Advanced/)).toBeInTheDocument();
  });

  it('renders final stats immediately under reduced motion (count-up disabled)', () => {
    mockReducedMotion(true);
    render(<SessionSummary reviewed={8} correctCount={6} personalBest={false} locale="en" />);
    expect(screen.getByText(/8 answered/)).toBeInTheDocument();
    expect(screen.getByText(/75% correct/)).toBeInTheDocument();
  });
});
