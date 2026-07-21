import { render, screen } from '@testing-library/react';
import GridLayout from 'react-grid-layout';
import { describe, expect, it } from 'vitest';

// Guards the ADR 0046 React-19 gate: react-grid-layout depends on react-draggable, whose legacy
// findDOMNode path was removed in React 19. If an *interactive* grid ever regresses to findDOMNode it
// throws on mount — this renders a draggable + resizable grid and asserts it mounts cleanly.
const layout = [{ i: 'w1', x: 0, y: 0, w: 2, h: 2 }];

describe('react-grid-layout under React 19', () => {
  it('renders an interactive (draggable + resizable) grid without throwing', () => {
    render(
      <GridLayout
        className="layout"
        layout={layout}
        cols={12}
        rowHeight={30}
        width={1200}
        isDraggable
        isResizable
      >
        <div key="w1">widget</div>
      </GridLayout>,
    );
    expect(screen.getByText('widget')).toBeInTheDocument();
  });
});
