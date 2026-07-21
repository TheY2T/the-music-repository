import { type Locale, t } from '@TheY2T/tmr-i18n';
import { Icon } from '@TheY2T/tmr-ui';
import { WIDGET_REGISTRY, WIDGET_TYPES, type WidgetType } from './widget-registry';

/**
 * The add-a-widget palette — one button per available widget type. Adding appends the widget to the
 * active space (the parent island decides where). Presentational + i18n-by-prop.
 */
export default function WidgetPalette({
  locale,
  onAdd,
}: {
  locale: Locale;
  onAdd: (type: WidgetType) => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="px-1 pb-2 font-display text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {t(locale, 'spaces.paletteTitle')}
      </p>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {WIDGET_TYPES.map((type) => {
          const def = WIDGET_REGISTRY[type];
          return (
            <button
              key={type}
              type="button"
              onClick={() => onAdd(type)}
              className="flex items-center gap-3 rounded-md border border-border px-3 py-2 text-left transition-colors hover:border-muted-foreground/40 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <Icon name={def.icon} className="size-4" />
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                {t(locale, def.titleKey)}
              </span>
              <Icon name="plus" className="size-4 shrink-0 text-muted-foreground" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
