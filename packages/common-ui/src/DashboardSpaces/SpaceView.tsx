import { type Locale, t } from '@TheY2T/tmr-i18n';
import { Icon } from '@TheY2T/tmr-ui';
import { getDashboardSpaces } from '@TheY2T/tmr-web-acl/dashboard-spaces-api';
import type { DashboardSpace } from '@TheY2T/tmr-web-acl/dto';
import { Suspense, useEffect, useMemo, useState } from 'react';
import GridLayout, { type Layout, WidthProvider } from 'react-grid-layout';
import { defaultSpace } from './templates';
import { isWidgetType, WIDGET_REGISTRY } from './widget-registry';

const Grid = WidthProvider(GridLayout);
const COLS = 12;
const ROW_HEIGHT = 64;
const MARGIN: [number, number] = [16, 16];

/**
 * Read-only render of a learner's active practice space — a static grid of live widget cards. Fetches
 * the saved spaces on mount (falling back to a starter template when none are saved) and lays them out
 * with react-grid-layout in a non-interactive grid; arranging/editing arrives with the space editor.
 * One island root: the page mounts it inside `AppProviders` so widgets share the data + preference
 * context. i18n-by-prop (app island → may call `t()`).
 */
export default function SpaceView({ locale }: { locale: Locale }) {
  const [spaces, setSpaces] = useState<DashboardSpace[] | null>(null);
  const [activeId, setActiveId] = useState<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    getDashboardSpaces().then((view) => {
      if (cancelled) return;
      const loaded = view?.spaces ?? [];
      setSpaces(loaded);
      setActiveId(view?.activeSpaceId ?? loaded[0]?.id);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const active = useMemo<DashboardSpace | null>(() => {
    if (spaces === null) return null;
    if (spaces.length === 0) return defaultSpace(t(locale, 'spaces.defaultName'));
    return spaces.find((s) => s.id === activeId) ?? spaces[0] ?? null;
  }, [spaces, activeId, locale]);

  if (spaces === null) {
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">
        {t(locale, 'common.loading')}
      </p>
    );
  }
  if (!active) return null;

  const layout: Layout[] = active.widgets.map((w) => ({
    i: w.id,
    x: w.x,
    y: w.y,
    w: w.w,
    h: w.h,
    static: true,
  }));

  return (
    <Grid
      className="dashboard-spaces-grid"
      cols={COLS}
      rowHeight={ROW_HEIGHT}
      margin={MARGIN}
      layout={layout}
      isDraggable={false}
      isResizable={false}
      isDroppable={false}
    >
      {active.widgets.map((widget) => {
        const def = isWidgetType(widget.type) ? WIDGET_REGISTRY[widget.type] : null;
        return (
          <div
            key={widget.id}
            className="flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm"
          >
            <div className="flex items-center gap-2 border-b border-border px-3 py-2">
              <Icon name={def?.icon ?? 'square'} className="size-4 text-muted-foreground" />
              <span className="truncate text-sm font-medium text-foreground">
                {def ? t(locale, def.titleKey) : widget.type}
              </span>
            </div>
            <div className="min-h-0 flex-1 overflow-auto p-3">
              {def ? (
                <Suspense
                  fallback={
                    <p className="text-sm text-muted-foreground">{t(locale, 'common.loading')}</p>
                  }
                >
                  {def.render(widget.config as Record<string, unknown>, { locale })}
                </Suspense>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t(locale, 'spaces.widget.unknown')}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </Grid>
  );
}
