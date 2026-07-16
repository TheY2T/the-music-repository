import { Button, Chip, Icon } from '@TheY2T/tmr-ui';

/**
 * A compact "Recently viewed" row of chip links, shown above a list to jump back to items the user
 * opened recently. Presentational + i18n-by-prop: the caller resolves the label/clear strings and
 * builds each item's href (so it stays locale-correct). Used by the catalogue, collections, and tools
 * browsers. Renders nothing when there are no items.
 */
export interface RecentlyViewedItem {
  slug: string;
  title: string;
  href: string;
}

export interface RecentlyViewedStripProps {
  title: string;
  clearLabel: string;
  items: RecentlyViewedItem[];
  onClear: () => void;
  /** Called when a chip is opened, so the destination is remembered for its own scroll-on-return. */
  onSelect?: (slug: string) => void;
}

export default function RecentlyViewedStrip({
  title,
  clearLabel,
  items,
  onClear,
  onSelect,
}: RecentlyViewedStripProps) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
          <Icon name="clock" className="size-4 text-muted-foreground" />
          {title}
        </p>
        <Button variant="ghost" size="sm" className="h-auto px-2 py-1 text-xs" onClick={onClear}>
          {clearLabel}
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <a
            key={item.slug}
            href={item.href}
            onClick={() => onSelect?.(item.slug)}
            className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Chip variant="muted" interactive>
              {item.title}
            </Chip>
          </a>
        ))}
      </div>
    </div>
  );
}
