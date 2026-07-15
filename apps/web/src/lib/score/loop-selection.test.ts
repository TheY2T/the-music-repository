import { describe, expect, it } from 'vitest';
import { orderTicks } from './loop-selection';

describe('orderTicks', () => {
  it('orders a forward drag', () => {
    expect(orderTicks(960, 3840)).toEqual({ startTick: 960, endTick: 3840 });
  });
  it('orders a backward drag (drag right-to-left)', () => {
    expect(orderTicks(3840, 960)).toEqual({ startTick: 960, endTick: 3840 });
  });
  it('supports a single-beat selection', () => {
    expect(orderTicks(1920, 1920)).toEqual({ startTick: 1920, endTick: 1920 });
  });
});
