import { Card, cn, Icon, type IconName, SearchField } from '@TheY2T/tmr-ui';
import { useMemo, useState } from 'react';

/**
 * Interactive browser for the /tools page: a search box + category filter chips over collapsible
 * category sections (expanded by default; a category auto-opens while a search is active). i18n-by-
 * prop — the `.astro` page resolves every string, href, icon, and category, so this island stays
 * presentational. See tools/index.astro + src/lib/tools-taxonomy.ts.
 */
export interface ToolItem {
  slug: string;
  title: string;
  summary: string;
  iconName: string;
  href: string;
  category: string;
}
export interface ToolCategoryMeta {
  key: string;
  label: string;
}
export interface ToolsBrowserProps {
  tools: ToolItem[];
  categories: ToolCategoryMeta[];
  strings: { searchPlaceholder: string; all: string; noResults: string };
}

function CategoryChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1 text-sm font-medium transition-colors',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      {children}
    </button>
  );
}

function ToolCard({ tool }: { tool: ToolItem }) {
  return (
    <li>
      <a href={tool.href} className="group block h-full">
        <Card className="flex h-full items-start gap-3 p-4 transition group-hover:-translate-y-0.5 group-hover:border-accent group-hover:shadow-md">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent/15 text-accent">
            <Icon name={tool.iconName as IconName} className="size-5" />
          </span>
          <span className="flex min-w-0 flex-col gap-1">
            <span className="font-display font-semibold leading-tight">{tool.title}</span>
            <span className="text-sm text-muted-foreground">{tool.summary}</span>
          </span>
        </Card>
      </a>
    </li>
  );
}

export default function ToolsBrowser({ tools, categories, strings }: ToolsBrowserProps) {
  const [query, setQuery] = useState('');
  const [activeCat, setActiveCat] = useState('all');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const q = query.trim().toLowerCase();
  const searching = q.length > 0;

  const grouped = useMemo(() => {
    const visible = tools.filter((tool) => {
      if (activeCat !== 'all' && tool.category !== activeCat) {
        return false;
      }
      if (!q) {
        return true;
      }
      return `${tool.title} ${tool.summary}`.toLowerCase().includes(q);
    });
    return categories
      .map((c) => ({ ...c, items: visible.filter((t) => t.category === c.key) }))
      .filter((g) => g.items.length > 0);
  }, [tools, categories, activeCat, q]);

  function toggle(key: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <SearchField
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onClear={() => setQuery('')}
          placeholder={strings.searchPlaceholder}
          aria-label={strings.searchPlaceholder}
          className="max-w-md"
        />
        <div className="flex flex-wrap gap-2">
          <CategoryChip active={activeCat === 'all'} onClick={() => setActiveCat('all')}>
            {strings.all}
          </CategoryChip>
          {categories.map((c) => (
            <CategoryChip
              key={c.key}
              active={activeCat === c.key}
              onClick={() => setActiveCat(c.key)}
            >
              {c.label}
            </CategoryChip>
          ))}
        </div>
      </div>

      {grouped.length === 0 ? (
        <p className="text-sm text-muted-foreground">{strings.noResults}</p>
      ) : (
        <div className="space-y-8">
          {grouped.map((group) => {
            const open = searching || !collapsed.has(group.key);
            return (
              <section key={group.key}>
                <h2 className="border-b border-border">
                  <button
                    type="button"
                    onClick={() => toggle(group.key)}
                    aria-expanded={open}
                    className="flex w-full items-center gap-2 pb-2 text-left font-display text-lg font-semibold tracking-tight transition-colors hover:text-accent"
                  >
                    <Icon
                      name={open ? 'chevron-down' : 'chevron-right'}
                      className="size-4 shrink-0 text-muted-foreground"
                    />
                    <span>{group.label}</span>
                    <span className="text-sm font-normal text-muted-foreground">
                      {group.items.length}
                    </span>
                  </button>
                </h2>
                {open ? (
                  <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {group.items.map((tool) => (
                      <ToolCard key={tool.slug} tool={tool} />
                    ))}
                  </ul>
                ) : null}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
