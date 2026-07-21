import { type Locale, t } from '@TheY2T/tmr-i18n';
import { getBackgroundPref } from '@TheY2T/tmr-web-acl/dashboard-background';
import { getDashboardSpaces, saveDashboardSpaces } from '@TheY2T/tmr-web-acl/dashboard-spaces-api';
import type { DashboardSpace, DashboardWidget } from '@TheY2T/tmr-web-acl/dto';
import { useCallback, useEffect, useRef, useState } from 'react';
import { defaultSpace, type SpaceTemplate } from './templates';
import { WIDGET_REGISTRY, type WidgetType } from './widget-registry';

export type SaveStatus = 'idle' | 'saving' | 'saved';

/** A grid position update from the editor (react-grid-layout item subset). */
export interface LayoutPatch {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

const SAVE_DEBOUNCE_MS = 700;
const GRID_COLS = 12;

function newId(): string {
  return crypto.randomUUID();
}

/** Next free row so a freshly-added widget lands below the existing ones. */
function bottomOf(widgets: DashboardWidget[]): number {
  return widgets.reduce((max, w) => Math.max(max, w.y + w.h), 0);
}

function makeWidget(type: WidgetType, widgets: DashboardWidget[]): DashboardWidget {
  const def = WIDGET_REGISTRY[type];
  return {
    id: newId(),
    type,
    x: 0,
    y: bottomOf(widgets),
    w: def.defaultSize.w,
    h: def.defaultSize.h,
    config: type === 'note' ? { text: '' } : {},
  };
}

/**
 * Owns a learner's dashboard spaces: loads them (seeding a starter space when none are saved), applies
 * the editor's mutations to local state, and persists the whole collection back with a debounced upsert
 * so rapid drags/edits collapse into one write. The initial load never triggers a save.
 */
export function useSpaces(locale: Locale) {
  const [spaces, setSpaces] = useState<DashboardSpace[] | null>(null);
  const [activeId, setActiveId] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<SaveStatus>('idle');
  const spacesRef = useRef<DashboardSpace[]>([]);
  const activeIdRef = useRef<string | undefined>(undefined);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setActiveBoth = useCallback((id: string | undefined) => {
    activeIdRef.current = id;
    setActiveId(id);
  }, []);

  useEffect(() => {
    let cancelled = false;
    getDashboardSpaces().then((view) => {
      if (cancelled) return;
      const loaded = view?.spaces ?? [];
      let seeded = loaded;
      if (loaded.length === 0) {
        // First run: seed a starter space and migrate the old (localStorage) background pref into it.
        const starter = defaultSpace(t(locale, 'spaces.defaultName'));
        const pref = getBackgroundPref();
        starter.background = { style: pref.style, intensity: pref.intensity };
        seeded = [starter];
      }
      spacesRef.current = seeded;
      setSpaces(seeded);
      setActiveBoth(loaded.length > 0 ? (view?.activeSpaceId ?? loaded[0]?.id) : seeded[0]?.id);
    });
    return () => {
      cancelled = true;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [locale, setActiveBoth]);

  const scheduleSave = useCallback((next: DashboardSpace[], active: string | undefined) => {
    setStatus('saving');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      saveDashboardSpaces({ spaces: next, activeSpaceId: active }).then(() => setStatus('saved'));
    }, SAVE_DEBOUNCE_MS);
  }, []);

  /** Apply a change to the spaces list and persist it (debounced). */
  const commit = useCallback(
    (updater: (prev: DashboardSpace[]) => DashboardSpace[], nextActive?: string) => {
      const next = updater(spacesRef.current);
      spacesRef.current = next;
      setSpaces(next);
      if (nextActive !== undefined) setActiveBoth(nextActive);
      scheduleSave(next, nextActive ?? activeIdRef.current);
    },
    [scheduleSave, setActiveBoth],
  );

  /** Map a mutation over the widgets of the active space only. */
  const mutateActive = useCallback(
    (fn: (widgets: DashboardWidget[]) => DashboardWidget[]) =>
      commit((prev) =>
        prev.map((s) => (s.id === activeIdRef.current ? { ...s, widgets: fn(s.widgets) } : s)),
      ),
    [commit],
  );

  const setActive = useCallback(
    (id: string) => {
      setActiveBoth(id);
      scheduleSave(spacesRef.current, id);
    },
    [scheduleSave, setActiveBoth],
  );

  const addWidget = useCallback(
    (type: WidgetType) => mutateActive((w) => [...w, makeWidget(type, w)]),
    [mutateActive],
  );

  const removeWidget = useCallback(
    (widgetId: string) => mutateActive((w) => w.filter((x) => x.id !== widgetId)),
    [mutateActive],
  );

  const updateWidgetConfig = useCallback(
    (widgetId: string, patch: Record<string, unknown>) =>
      mutateActive((w) =>
        w.map((x) => (x.id === widgetId ? { ...x, config: { ...x.config, ...patch } } : x)),
      ),
    [mutateActive],
  );

  /**
   * Grow a widget's width to fill the free horizontal space on its row — up to the nearest widget that
   * vertically overlaps it, or the grid's right edge when nothing is to its right.
   */
  const expandWidth = useCallback(
    (widgetId: string) =>
      mutateActive((widgets) => {
        const target = widgets.find((w) => w.id === widgetId);
        if (!target) return widgets;
        const overlapsRows = (o: DashboardWidget) =>
          o.id !== target.id && o.y < target.y + target.h && target.y < o.y + o.h;
        const rightEdges = widgets
          .filter(overlapsRows)
          .filter((o) => o.x >= target.x + target.w)
          .map((o) => o.x);
        const maxRight = rightEdges.length > 0 ? Math.min(...rightEdges) : GRID_COLS;
        const nextW = Math.max(target.w, maxRight - target.x);
        return widgets.map((w) => (w.id === widgetId ? { ...w, w: nextW } : w));
      }),
    [mutateActive],
  );

  /**
   * Grow a widget's height to fill the free vertical space in its column — down to the nearest widget
   * that horizontally overlaps it, or the space's current bottom when nothing is below (the grid has no
   * fixed bottom edge).
   */
  const expandHeight = useCallback(
    (widgetId: string) =>
      mutateActive((widgets) => {
        const target = widgets.find((w) => w.id === widgetId);
        if (!target) return widgets;
        const overlapsCols = (o: DashboardWidget) =>
          o.id !== target.id && o.x < target.x + target.w && target.x < o.x + o.w;
        const belowTops = widgets
          .filter(overlapsCols)
          .filter((o) => o.y >= target.y + target.h)
          .map((o) => o.y);
        const bottom =
          belowTops.length > 0
            ? Math.min(...belowTops)
            : widgets.reduce((max, o) => Math.max(max, o.y + o.h), target.y + target.h);
        const nextH = Math.max(target.h, bottom - target.y);
        return widgets.map((w) => (w.id === widgetId ? { ...w, h: nextH } : w));
      }),
    [mutateActive],
  );

  const applyLayout = useCallback(
    (patches: LayoutPatch[]) => {
      const byId = new Map(patches.map((p) => [p.i, p]));
      mutateActive((w) =>
        w.map((x) => {
          const p = byId.get(x.id);
          return p ? { ...x, x: p.x, y: p.y, w: p.w, h: p.h } : x;
        }),
      );
    },
    [mutateActive],
  );

  const setSpaceBackground = useCallback(
    (background: { style: string; intensity: number }) =>
      commit((prev) => prev.map((s) => (s.id === activeIdRef.current ? { ...s, background } : s))),
    [commit],
  );

  const createSpace = useCallback(
    (template?: SpaceTemplate) => {
      const widgets: DashboardWidget[] = (template?.widgets ?? []).map((w) => ({
        id: newId(),
        type: w.type,
        x: w.x,
        y: w.y,
        w: w.w,
        h: w.h,
        config: w.config ?? (w.type === 'note' ? { text: '' } : {}),
      }));
      const space: DashboardSpace = {
        id: newId(),
        name: template ? t(locale, template.nameKey) : t(locale, 'spaces.defaultName'),
        icon: template?.icon ?? 'music',
        widgets,
      };
      commit((prev) => [...prev, space], space.id);
    },
    [commit, locale],
  );

  const renameSpace = useCallback(
    (id: string, name: string) =>
      commit((prev) => prev.map((s) => (s.id === id ? { ...s, name } : s))),
    [commit],
  );

  const deleteSpace = useCallback(
    (id: string) => {
      const remaining = spacesRef.current.filter((s) => s.id !== id);
      const nextActive = activeIdRef.current === id ? remaining[0]?.id : activeIdRef.current;
      commit(() => remaining, nextActive);
    },
    [commit],
  );

  const active = spaces?.find((s) => s.id === activeId) ?? spaces?.[0] ?? null;

  return {
    ready: spaces !== null,
    spaces: spaces ?? [],
    active,
    activeId,
    status,
    setActive,
    addWidget,
    removeWidget,
    updateWidgetConfig,
    applyLayout,
    expandWidth,
    expandHeight,
    setSpaceBackground,
    createSpace,
    renameSpace,
    deleteSpace,
  };
}
