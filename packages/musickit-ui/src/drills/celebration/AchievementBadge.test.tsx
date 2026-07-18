import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import AchievementBadge from './AchievementBadge';

describe('AchievementBadge', () => {
  it('shows the tier label', () => {
    render(<AchievementBadge level="expert" label="Expert" />);
    expect(screen.getByText('Expert')).toBeInTheDocument();
  });

  it('escalates colour toward gold at the top tier', () => {
    const { rerender, container } = render(<AchievementBadge level="beginner" label="Beginner" />);
    expect(container.firstChild).toHaveClass('text-muted-foreground');
    rerender(<AchievementBadge level="expert" label="Expert" />);
    expect(container.firstChild).toHaveClass('text-warning');
  });
});
