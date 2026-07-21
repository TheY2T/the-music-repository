import { type Locale, t } from '@TheY2T/tmr-i18n';
import { cn, Icon, Textarea } from '@TheY2T/tmr-ui';
import type { DashboardSpace } from '@TheY2T/tmr-web-acl/dto';
import { Suspense } from 'react';
import GridLayout, { type Layout, WidthProvider } from 'react-grid-layout';
import NoteWidget from './NoteWidget';
import type { LayoutPatch } from './use-spaces';
import { isWidgetType, WIDGET_REGISTRY } from './widget-registry';

const Grid = WidthProvider(GridLayout);
const COLS = 12;
const ROW_HEIGHT = 64;
const MARGIN: [number, number] = [16, 16];
const DRAG_HANDLE = 'widget-drag-handle';

export interface SpaceGridProps {
  space: DashboardSpace;
  editMode: boolean;
  locale: Locale;
  onLayoutChange?: (patches: LayoutPatch[]) => void;
  onRemoveWidget?: (widgetId: string) => void;
  onNoteChange?: (widgetId: string, text: string) => void;
  onToggleHScroll?: (widgetId: string, next: boolean) => void;
  onExpandWidth?: (widgetId: string) => void;
  onExpandHeight?: (widgetId: string) => void;
}

function toPatches(layout: Layout[]): LayoutPatch[] {
  return layout.map((l) => ({ i: l.i, x: l.x, y: l.y, w: l.w, h: l.h }));
}

/**
 * Presentational render of one space's widget grid. In view mode the grid is static; in edit mode it is
 * draggable (by the whole card header) and resizable (bottom-right corner), and each card gains a remove
 * button, with the Note widget switching to an editable textarea. All state changes are reported to the
 * parent island via the callbacks — this component holds none. i18n-by-prop.
 */
export default function SpaceGrid({
  space,
  editMode,
  locale,
  onLayoutChange,
  onRemoveWidget,
  onNoteChange,
  onToggleHScroll,
  onExpandWidth,
  onExpandHeight,
}: SpaceGridProps) {
  if (space.widgets.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
        {t(locale, 'spaces.emptySpace')}
      </p>
    );
  }

  const layout: Layout[] = space.widgets.map((w) => ({
    i: w.id,
    x: w.x,
    y: w.y,
    w: w.w,
    h: w.h,
    minW: isWidgetType(w.type) ? WIDGET_REGISTRY[w.type].minSize.w : 2,
    minH: isWidgetType(w.type) ? WIDGET_REGISTRY[w.type].minSize.h : 2,
    static: !editMode,
  }));

  const report = (l: Layout[]) => onLayoutChange?.(toPatches(l));

  return (
    <Grid
      className="dashboard-spaces-grid"
      cols={COLS}
      rowHeight={ROW_HEIGHT}
      margin={MARGIN}
      layout={layout}
      isDraggable={editMode}
      isResizable={editMode}
      isDroppable={false}
      draggableHandle={`.${DRAG_HANDLE}`}
      draggableCancel=".widget-no-drag"
      onDragStop={report}
      onResizeStop={report}
    >
      {space.widgets.map((widget) => {
        const def = isWidgetType(widget.type) ? WIDGET_REGISTRY[widget.type] : null;
        const isNote = widget.type === 'note';
        const hScroll = widget.config.hScroll === true;
        return (
          <div
            key={widget.id}
            className="flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm"
          >
            {/* The whole header bar is the drag handle in edit mode; the remove button opts out
                (`widget-no-drag` → the grid's draggableCancel) so clicking it never starts a drag. */}
            <div
              title={editMode ? t(locale, 'spaces.dragHandle') : undefined}
              className={cn(
                'flex items-center gap-2 border-b border-border px-3 py-2',
                editMode && `${DRAG_HANDLE} cursor-grab select-none active:cursor-grabbing`,
              )}
            >
              {editMode && (
                <Icon name="grip-vertical" className="size-4 shrink-0 text-muted-foreground" />
              )}
              <Icon
                name={def?.icon ?? 'square'}
                className="size-4 shrink-0 text-muted-foreground"
              />
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                {def ? t(locale, def.titleKey) : widget.type}
              </span>
              <button
                type="button"
                aria-label={t(locale, 'spaces.toggleHScroll')}
                title={t(locale, 'spaces.toggleHScroll')}
                aria-pressed={hScroll}
                onClick={() => onToggleHScroll?.(widget.id, !hScroll)}
                className={cn(
                  'widget-no-drag transition-colors hover:text-foreground',
                  hScroll ? 'text-accent' : 'text-muted-foreground',
                )}
              >
                <Icon name="ruler-dimension-line" className="size-4" />
              </button>
              {editMode && (
                <>
                  <button
                    type="button"
                    aria-label={t(locale, 'spaces.expandWidth')}
                    title={t(locale, 'spaces.expandWidth')}
                    onClick={() => onExpandWidth?.(widget.id)}
                    className="widget-no-drag text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Icon name="move-horizontal" className="size-4" />
                  </button>
                  <button
                    type="button"
                    aria-label={t(locale, 'spaces.expandHeight')}
                    title={t(locale, 'spaces.expandHeight')}
                    onClick={() => onExpandHeight?.(widget.id)}
                    className="widget-no-drag text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Icon name="move-vertical" className="size-4" />
                  </button>
                  <button
                    type="button"
                    aria-label={t(locale, 'spaces.removeWidget')}
                    title={t(locale, 'spaces.removeWidget')}
                    onClick={() => onRemoveWidget?.(widget.id)}
                    className="widget-no-drag text-muted-foreground transition-colors hover:text-destructive"
                  >
                    <Icon name="x" className="size-4" />
                  </button>
                </>
              )}
            </div>
            <div
              className={cn(
                'min-h-0 flex-1 overflow-y-auto p-3',
                hScroll ? 'overflow-x-auto' : 'overflow-x-hidden',
              )}
            >
              {isNote ? (
                editMode ? (
                  <Textarea
                    className="h-full min-h-24 resize-none"
                    value={typeof widget.config.text === 'string' ? widget.config.text : ''}
                    placeholder={t(locale, 'spaces.note.placeholder')}
                    onChange={(e) => onNoteChange?.(widget.id, e.currentTarget.value)}
                  />
                ) : (
                  <NoteWidget
                    text={typeof widget.config.text === 'string' ? widget.config.text : undefined}
                    locale={locale}
                  />
                )
              ) : def ? (
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
