import { type Locale, t } from '@TheY2T/tmr-i18n';
import {
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Icon,
  SearchField,
  Tabs,
  TabsList,
  TabsTrigger,
} from '@TheY2T/tmr-ui';
import { useMemo, useState } from 'react';
import {
  WIDGET_CATEGORIES,
  WIDGET_REGISTRY,
  WIDGET_TYPES,
  type WidgetCategory,
  type WidgetType,
} from './widget-registry';

/**
 * The add-a-widget picker — a modal that groups every available widget by category, with a search
 * box that filters across titles and descriptions. Selecting a widget adds it to the active space
 * (the parent decides where) and closes the dialog. Presentational + i18n-by-prop.
 */
export default function WidgetPickerDialog({
  locale,
  open,
  onOpenChange,
  onAdd,
}: {
  locale: Locale;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (type: WidgetType) => void;
}) {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<'all' | WidgetCategory>('all');

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return WIDGET_TYPES.filter((type) => {
      const def = WIDGET_REGISTRY[type];
      if (tab !== 'all' && def.category !== tab) return false;
      if (!q) return true;
      const title = t(locale, def.titleKey).toLowerCase();
      const desc = t(locale, def.descKey).toLowerCase();
      return title.includes(q) || desc.includes(q);
    });
  }, [locale, query, tab]);

  function pick(type: WidgetType) {
    onAdd(type);
    onOpenChange(false);
  }

  const categoryLabel = (category: WidgetCategory) =>
    t(
      locale,
      WIDGET_CATEGORIES.find((c) => c.category === category)?.labelKey ?? 'spaces.category.tools',
    );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeLabel={t(locale, 'common.close')} className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t(locale, 'spaces.paletteTitle')}</DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-3">
          <SearchField
            aria-label={t(locale, 'spaces.picker.search')}
            placeholder={t(locale, 'spaces.picker.search')}
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
            onClear={() => setQuery('')}
          />

          <Tabs value={tab} onValueChange={(v) => setTab(v as 'all' | WidgetCategory)}>
            <TabsList>
              <TabsTrigger value="all">{t(locale, 'spaces.picker.all')}</TabsTrigger>
              {WIDGET_CATEGORIES.map((c) => (
                <TabsTrigger key={c.category} value={c.category}>
                  {t(locale, c.labelKey)}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {matches.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              {t(locale, 'spaces.picker.empty')}
            </p>
          ) : (
            <div className="grid max-h-[55vh] gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
              {matches.map((type) => {
                const def = WIDGET_REGISTRY[type];
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => pick(type)}
                    className="flex items-start gap-3 rounded-md border border-border p-3 text-left transition-colors hover:border-muted-foreground/40 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      <Icon name={def.icon} className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-foreground">
                          {t(locale, def.titleKey)}
                        </span>
                        {tab === 'all' && (
                          <Badge variant="secondary" className="shrink-0">
                            {categoryLabel(def.category)}
                          </Badge>
                        )}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {t(locale, def.descKey)}
                      </span>
                    </span>
                    <Icon name="plus" className="mt-1 size-4 shrink-0 text-muted-foreground" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
