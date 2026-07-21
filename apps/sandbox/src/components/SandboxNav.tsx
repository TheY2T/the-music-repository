import { Icon, Input, SegmentedToggle } from '@TheY2T/tmr-ui';
import { useEffect, useMemo, useRef, useState } from 'react';
import { groupByDomain, groupByPackage, type SpecimenGroup } from '@/registry';

type Grouping = 'package' | 'domain';

const specimenIdFromPath = (pathname: string) => /^\/c\/(.+)$/.exec(pathname)?.[1];

/**
 * The sandbox sidebar: search across every specimen and switch between the two grouping axes — by source
 * package or by feature-area domain. Reads the registry directly (plain data). The aside is persisted
 * across view transitions, so it tracks the active specimen from the URL (not just the initial prop) and
 * keeps the current selection scrolled into view.
 */
export default function SandboxNav({ activeId }: { activeId?: string }) {
  const [grouping, setGrouping] = useState<Grouping>('package');
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(activeId);
  const listRef = useRef<HTMLDivElement>(null);

  // The island survives view-transition navigations (transition:persist), so follow the URL rather than
  // relying on the mount-time prop.
  useEffect(() => {
    const sync = () => setActive(specimenIdFromPath(window.location.pathname));
    sync();
    document.addEventListener('astro:page-load', sync);
    return () => document.removeEventListener('astro:page-load', sync);
  }, []);

  // Keep the selected item visible after each navigation (no-op when it is already on screen).
  useEffect(() => {
    listRef.current?.querySelector('[aria-current="page"]')?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const groups = useMemo<SpecimenGroup[]>(() => {
    const base = grouping === 'package' ? groupByPackage() : groupByDomain();
    const q = query.trim().toLowerCase();
    if (!q) return base;
    return base
      .map((g) => ({
        ...g,
        items: g.items.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.id.toLowerCase().includes(q) ||
            s.domains.some((d) => d.includes(q)),
        ),
      }))
      .filter((g) => g.items.length > 0);
  }, [grouping, query]);

  const total = useMemo(
    () => new Set(groups.flatMap((g) => g.items.map((s) => s.id))).size,
    [groups],
  );

  return (
    <nav aria-label="Component catalogue" className="flex h-full flex-col gap-4">
      <div className="space-y-2">
        <SegmentedToggle
          aria-label="Group by"
          className="w-full [&>button]:flex-1"
          value={grouping}
          onValueChange={(v) => setGrouping(v as Grouping)}
          options={[
            { value: 'package', label: 'Package' },
            { value: 'domain', label: 'Domain' },
          ]}
        />
        <div className="relative">
          <Icon
            name="search"
            className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            placeholder="Search…"
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
            aria-label="Search components"
            className="pl-8"
          />
        </div>
        <p className="px-1 text-xs text-muted-foreground">{total} components</p>
      </div>

      <div ref={listRef} className="-mr-2 min-h-0 flex-1 space-y-5 overflow-y-auto pr-2">
        {groups.map((group) => (
          <div key={group.key}>
            <p className="mb-1 flex items-center justify-between px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <span>{group.label}</span>
              <span className="font-normal tabular-nums">{group.items.length}</span>
            </p>
            <ul>
              {group.items.map((s) => {
                const isActive = s.id === active;
                return (
                  <li key={`${group.key}-${s.id}`}>
                    <a
                      href={`/c/${s.id}`}
                      aria-current={isActive ? 'page' : undefined}
                      className={`block rounded-md px-2 py-1 text-sm transition-colors ${
                        isActive
                          ? 'bg-accent font-medium text-accent-foreground'
                          : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                      }`}
                    >
                      {s.name}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        {groups.length === 0 && <p className="px-2 text-sm text-muted-foreground">No matches.</p>}
      </div>
    </nav>
  );
}
