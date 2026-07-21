import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// `vi.hoisted` so the hoisted mock factory can reference the spies.
const { save, get } = vi.hoisted(() => ({
  save: vi.fn(async (_input: unknown): Promise<null> => null),
  get: vi.fn<() => Promise<unknown>>(),
}));

vi.mock('@TheY2T/tmr-web-acl/dashboard-spaces-api', () => ({
  getDashboardSpaces: () => get(),
  saveDashboardSpaces: (input: unknown) => save(input),
}));

import { useSpaces } from './use-spaces';

const oneSpace = (widgets: unknown[] = []) => ({
  activeSpaceId: 's1',
  updatedAt: '',
  spaces: [{ id: 's1', name: 'First', widgets }],
});

async function mounted(view: unknown) {
  get.mockResolvedValue(view);
  const hook = renderHook(() => useSpaces('en'));
  await waitFor(() => expect(hook.result.current.ready).toBe(true));
  return hook;
}

describe('useSpaces', () => {
  beforeEach(() => {
    save.mockClear();
    get.mockReset();
  });

  it('seeds a starter space when the user has saved none', async () => {
    const { result } = await mounted(null);
    expect(result.current.spaces).toHaveLength(1);
    expect(result.current.active?.widgets.length).toBeGreaterThan(0);
  });

  it('adds and removes a widget, and autosaves', async () => {
    const { result } = await mounted(oneSpace());
    act(() => result.current.addWidget('note'));
    expect(result.current.active?.widgets).toHaveLength(1);
    await waitFor(() => expect(save).toHaveBeenCalled(), { timeout: 2000 });

    const id = result.current.active?.widgets[0]?.id as string;
    act(() => result.current.removeWidget(id));
    expect(result.current.active?.widgets).toHaveLength(0);
  });

  it('applies a layout change (move + resize) to the active widgets', async () => {
    const { result } = await mounted(
      oneSpace([{ id: 'w1', type: 'note', x: 0, y: 0, w: 3, h: 3, config: {} }]),
    );
    act(() => result.current.applyLayout([{ i: 'w1', x: 4, y: 2, w: 6, h: 5 }]));

    const w = result.current.active?.widgets[0];
    expect([w?.x, w?.y, w?.w, w?.h]).toEqual([4, 2, 6, 5]);
    await waitFor(() => expect(save).toHaveBeenCalled(), { timeout: 2000 });
  });

  it('expandWidth grows to the next right neighbour, or the grid edge when none', async () => {
    const { result } = await mounted(
      oneSpace([
        { id: 'a', type: 'note', x: 0, y: 0, w: 3, h: 3, config: {} },
        { id: 'b', type: 'note', x: 6, y: 0, w: 3, h: 3, config: {} },
      ]),
    );
    const widthOf = (id: string) => result.current.active?.widgets.find((w) => w.id === id)?.w;

    act(() => result.current.expandWidth('a')); // fills columns 0–6 (up to b)
    expect(widthOf('a')).toBe(6);
    act(() => result.current.expandWidth('b')); // nothing to the right → fills to col 12
    expect(widthOf('b')).toBe(6);
  });

  it('expandHeight grows to the next widget below, or the space bottom when none', async () => {
    const { result } = await mounted(
      oneSpace([
        { id: 'a', type: 'note', x: 0, y: 0, w: 6, h: 3, config: {} },
        { id: 'b', type: 'note', x: 0, y: 6, w: 6, h: 2, config: {} },
      ]),
    );
    const heightOf = (id: string) => result.current.active?.widgets.find((w) => w.id === id)?.h;

    act(() => result.current.expandHeight('a')); // fills rows 0–6 (down to b)
    expect(heightOf('a')).toBe(6);
    act(() => result.current.expandHeight('b')); // nothing below → already at the space bottom
    expect(heightOf('b')).toBe(2);
  });

  it('updates a widget config (note text)', async () => {
    const { result } = await mounted(
      oneSpace([{ id: 'w1', type: 'note', x: 0, y: 0, w: 3, h: 3, config: { text: 'a' } }]),
    );
    act(() => result.current.updateWidgetConfig('w1', { text: 'b' }));
    expect(result.current.active?.widgets[0]?.config.text).toBe('b');
  });

  it('creates, renames, switches, and deletes spaces', async () => {
    const { result } = await mounted(oneSpace());

    act(() => result.current.createSpace());
    expect(result.current.spaces).toHaveLength(2);
    const newId = result.current.activeId as string; // createSpace switches to the new space
    expect(newId).not.toBe('s1');

    act(() => result.current.renameSpace(newId, 'Renamed'));
    expect(result.current.spaces.find((s) => s.id === newId)?.name).toBe('Renamed');

    act(() => result.current.setActive('s1'));
    expect(result.current.activeId).toBe('s1');

    act(() => result.current.deleteSpace(newId));
    expect(result.current.spaces).toHaveLength(1);
    expect(result.current.activeId).toBe('s1');
  });

  it('reassigns the active space when the active one is deleted', async () => {
    const { result } = await mounted(oneSpace());
    act(() => result.current.createSpace());
    const newId = result.current.activeId as string;

    act(() => result.current.deleteSpace(newId)); // deleting the active space
    expect(result.current.activeId).toBe('s1');
    expect(result.current.spaces).toHaveLength(1);
  });
});
