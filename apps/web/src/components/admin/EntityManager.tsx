import type { Locale } from '@TheY2T/tmr-i18n';
import { t } from '@TheY2T/tmr-i18n';
import {
  Button,
  buttonVariants,
  Card,
  Checkbox,
  cn,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  EmptyState,
  type FacetGroup,
  FacetPanel,
  FeaturedShelf,
  Icon,
  Input,
  Pagination,
  SearchField,
  SegmentedToggle,
  Select,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@TheY2T/tmr-ui';
import {
  type DragEvent,
  type FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  buildColumns,
  countBuckets,
  groupIntoShelves,
  orderBuckets,
  type ShelfOrder,
} from '@/lib/admin-manager';

export type ViewMode = 'hub' | 'table' | 'board';

export interface EntityAxis<Row> {
  key: string;
  label: string;
  getValues: (row: Row) => string[];
  order: ShelfOrder<Row>;
  /** Localized shelf title for a value. */
  valueLabel: (value: string) => string;
  /** When true, this axis's values are creatable types → each shelf shows a "+ Add {type}" action
   * that opens quick-create prefilled (requires `quickCreate` with matching type values). */
  createType?: boolean;
}

export interface EntityQuickCreate {
  /** Type options shown as a select in the create dialog; omit for a title-only create. */
  typeOptions?: { value: string; label: string }[];
  /** Create a draft from the entered values; resolves to the new item's key (slug) to open in the editor. */
  create: (values: { title: string; type?: string }) => Promise<string>;
}

export interface EntityFacet<Row> {
  key: string;
  label: string;
  getValues: (row: Row) => string[];
  valueLabel: (value: string) => string;
  /** Optional fixed value order (status/level); omit for count-ordered. */
  order?: readonly string[];
}

export interface EntitySort<Row> {
  key: string;
  label: string;
  compare: (a: Row, b: Row) => number;
}

export interface EntityBoard<Row> {
  columns: { status: string; label: string }[];
  getStatus: (row: Row) => string;
  /** Statuses offered in a row's ⋯ menu (typically all but the current). */
  moveTargets: (row: Row) => { status: string; label: string }[];
  /** Perform the status change server-side. The manager applies `applyStatus` optimistically first. */
  setStatus: (keys: string[], status: string) => Promise<void>;
  applyStatus: (row: Row, status: string) => Row;
  /** Bulk status buttons shown when table rows are selected. */
  bulkActions: { status: string; label: string }[];
}

export interface EntityManagerConfig<Row> {
  /** Storage-key namespace + a stable identity for the entity. */
  entity: string;
  locale: Locale;
  load: () => Promise<Row[]>;
  getKey: (row: Row) => string;
  getTitle: (row: Row) => string;
  getSubtitle?: (row: Row) => string | undefined;
  /** Editor URL for an item, by its key (slug). */
  editHref: (key: string) => string;
  /** Optional section title rendered on the header row (left of the primary "+ New" action). Omit
   * when the page shell already provides the heading (e.g. the standalone collections/help pages). */
  title?: string;
  newHref: string;
  newLabel: string;
  /** When present, "+ New" opens a quick-create dialog (title + optional type) instead of navigating. */
  quickCreate?: EntityQuickCreate;
  /** When present, a row's ⋯ menu offers "Duplicate"; resolves to the new item's key to open. */
  duplicate?: (row: Row) => Promise<string>;
  searchPlaceholder: string;
  emptyLabel: string;
  loadError: (error: string) => string;
  matchesQuery: (row: Row, q: string) => boolean;
  /** Sort applied within shelves, board columns, and the unsorted table (newest-first, usually). */
  defaultRowSort: (a: Row, b: Row) => number;
  /** Top-left of a card (e.g. a status/kind badge); omit for none. */
  cardBadge?: (row: Row) => ReactNode;
  /** Meta line + tags under a card's title. */
  cardMeta: (row: Row) => ReactNode;
  /** Table cells after the title column and before the actions column. */
  rowCells: (row: Row) => ReactNode;
  /** Table header cells matching `rowCells`. */
  headCells: ReactNode;
  views: ViewMode[];
  axes: EntityAxis<Row>[];
  defaultAxis: string;
  facets: EntityFacet<Row>[];
  sorts: EntitySort<Row>[];
  defaultSort: string;
  board?: EntityBoard<Row>;
}

/** The ⋯ menu on a card/row: Edit, Duplicate, plus move-to-status when the entity has a lifecycle. */
function ActionsMenu<Row>({
  row,
  config,
  onMove,
  onDuplicate,
}: {
  row: Row;
  config: EntityManagerConfig<Row>;
  onMove: (status: string) => void;
  onDuplicate?: () => void;
}) {
  const targets = config.board?.moveTargets(row) ?? [];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t(config.locale, 'acm.actions')}
        className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <Icon name="more-horizontal" className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem
          onSelect={() => window.location.assign(config.editHref(config.getKey(row)))}
        >
          <Icon name="pencil" className="size-4" />
          {t(config.locale, 'acm.edit')}
        </DropdownMenuItem>
        {onDuplicate ? (
          <DropdownMenuItem onSelect={onDuplicate}>
            <Icon name="copy" className="size-4" />
            {t(config.locale, 'acm.duplicate')}
          </DropdownMenuItem>
        ) : null}
        {targets.length ? (
          <DropdownMenuLabel>{t(config.locale, 'acm.moveTo')}</DropdownMenuLabel>
        ) : null}
        {targets.map((target) => (
          <DropdownMenuItem key={target.status} onSelect={() => onMove(target.status)}>
            {target.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function EntityCard<Row>({
  row,
  config,
  onMove,
  onDuplicate,
  busy,
  draggable = false,
  onDragStart,
}: {
  row: Row;
  config: EntityManagerConfig<Row>;
  onMove: (status: string) => void;
  onDuplicate?: () => void;
  busy: boolean;
  draggable?: boolean;
  onDragStart?: (e: DragEvent<HTMLDivElement>) => void;
}) {
  const subtitle = config.getSubtitle?.(row);
  return (
    <Card
      draggable={draggable}
      onDragStart={onDragStart}
      className={cn(
        'flex flex-col gap-2 p-4',
        // Equal-height across a Hub shelf row; on the board a card keeps its natural height so a
        // lone card doesn't stretch to fill the (tallest-column-matched) column.
        !draggable && 'h-full',
        busy && 'pointer-events-none opacity-60',
        draggable && 'cursor-grab active:cursor-grabbing',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        {config.cardBadge?.(row) ?? <span />}
        <ActionsMenu row={row} config={config} onMove={onMove} onDuplicate={onDuplicate} />
      </div>
      <a
        href={config.editHref(config.getKey(row))}
        className="font-medium text-foreground hover:underline"
      >
        {config.getTitle(row)}
      </a>
      {subtitle ? <p className="truncate text-xs text-muted-foreground">{subtitle}</p> : null}
      {config.cardMeta(row)}
    </Card>
  );
}

type MoveFn = (keys: string[], status: string) => void;
type DuplicateFn<Row> = (row: Row) => void;

function HubView<Row>({
  rows,
  axis,
  config,
  onMove,
  onDuplicate,
  onCreate,
  busy,
  query,
}: {
  rows: Row[];
  axis: EntityAxis<Row>;
  config: EntityManagerConfig<Row>;
  onMove: MoveFn;
  onDuplicate?: DuplicateFn<Row>;
  onCreate?: (type: string) => void;
  busy: Set<string>;
  /** Text filter from the control bar — applied before grouping into shelves. */
  query: string;
}) {
  const filtered = useMemo(
    () => (query ? rows.filter((r) => config.matchesQuery(r, query)) : rows),
    [rows, query, config],
  );
  const shelves = groupIntoShelves(filtered, axis.getValues, axis.order, config.defaultRowSort);
  const canCreateType = Boolean(axis.createType && onCreate);
  return (
    <div className="space-y-6">
      {shelves.length === 0 ? (
        <EmptyState icon={<Icon name="book-open" className="size-6" />} title={config.emptyLabel} />
      ) : (
        <div className="space-y-8">
          {shelves.map((shelf) => (
            <FeaturedShelf
              key={shelf.key}
              title={`${axis.valueLabel(shelf.value)} · ${shelf.count}`}
              action={
                canCreateType ? (
                  <Button variant="ghost" size="sm" onClick={() => onCreate?.(shelf.value)}>
                    <Icon name="plus" className="size-4" />
                    {t(config.locale, 'acm.addType', { type: axis.valueLabel(shelf.value) })}
                  </Button>
                ) : undefined
              }
            >
              {shelf.rows.map((row) => (
                <EntityCard
                  key={config.getKey(row)}
                  row={row}
                  config={config}
                  busy={busy.has(config.getKey(row))}
                  onMove={(status) => onMove([config.getKey(row)], status)}
                  onDuplicate={onDuplicate ? () => onDuplicate(row) : undefined}
                />
              ))}
            </FeaturedShelf>
          ))}
        </div>
      )}
    </div>
  );
}

const BOARD_PAGE = 10;

function BoardView<Row>({
  rows,
  board,
  config,
  onMove,
  onDuplicate,
  busy,
  query,
}: {
  rows: Row[];
  board: EntityBoard<Row>;
  config: EntityManagerConfig<Row>;
  onMove: MoveFn;
  onDuplicate?: DuplicateFn<Row>;
  busy: Set<string>;
  /** Text filter from the control bar — applied across all columns. */
  query: string;
}) {
  const [over, setOver] = useState<string | null>(null);
  const [shown, setShown] = useState<Record<string, number>>({});
  const filtered = useMemo(
    () => (query ? rows.filter((r) => config.matchesQuery(r, query)) : rows),
    [rows, query, config],
  );
  const columns = buildColumns(
    filtered,
    board.columns.map((c) => c.status),
    board.getStatus,
    config.defaultRowSort,
  );
  const label = (status: string) => board.columns.find((c) => c.status === status)?.label ?? status;
  return (
    <div
      className="grid gap-4"
      style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
    >
      {columns.map((col) => {
        const limit = shown[col.status] ?? BOARD_PAGE;
        const visible = col.rows.slice(0, limit);
        return (
          // biome-ignore lint/a11y/noStaticElementInteractions: drag-and-drop is a pointer-only enhancement; each card's ⋯ menu is the keyboard-accessible way to change status.
          <div
            key={col.status}
            onDragOver={(e) => {
              e.preventDefault();
              if (over !== col.status) setOver(col.status);
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setOver((s) => (s === col.status ? null : s));
              }
            }}
            onDrop={(e) => {
              e.preventDefault();
              const key = e.dataTransfer.getData('text/plain');
              setOver(null);
              if (key) onMove([key], col.status);
            }}
            className={cn(
              'flex flex-col gap-3 rounded-lg border border-border bg-muted/20 p-3',
              over === col.status && 'ring-2 ring-ring',
            )}
          >
            <h3 className="flex items-center justify-between font-display text-sm font-semibold text-foreground">
              <span>{label(col.status)}</span>
              <span className="tabular-nums text-muted-foreground">{col.count}</span>
            </h3>
            {visible.map((row) => (
              <EntityCard
                key={config.getKey(row)}
                row={row}
                config={config}
                busy={busy.has(config.getKey(row))}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', config.getKey(row));
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onMove={(status) => onMove([config.getKey(row)], status)}
                onDuplicate={onDuplicate ? () => onDuplicate(row) : undefined}
              />
            ))}
            {col.rows.length > limit ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShown((prev) => ({ ...prev, [col.status]: limit + BOARD_PAGE }))}
              >
                {t(config.locale, 'acm.showMore', { count: col.rows.length - limit })}
              </Button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

const TABLE_PAGE = 25;

function TableView<Row>({
  rows,
  config,
  onMove,
  onDuplicate,
  busy,
  query,
  sortKey,
}: {
  rows: Row[];
  config: EntityManagerConfig<Row>;
  onMove: MoveFn;
  onDuplicate?: DuplicateFn<Row>;
  busy: Set<string>;
  /** Text filter + sort key, both owned by the control bar. */
  query: string;
  sortKey: string;
}) {
  const [selectedFacets, setSelectedFacets] = useState<Record<string, string[]>>({});
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Control-bar search/sort reset paging.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setPage(1), [query, sortKey]);

  const matches = (row: Row) => {
    if (query && !config.matchesQuery(row, query)) return false;
    return config.facets.every((facet) => {
      const chosen = selectedFacets[facet.key];
      if (!chosen || chosen.length === 0) return true;
      return facet.getValues(row).some((v) => chosen.includes(v));
    });
  };
  const sort = config.sorts.find((s) => s.key === sortKey) ?? config.sorts[0];
  const filtered = useMemo(() => {
    const list = rows.filter(matches);
    return sort ? [...list].sort(sort.compare) : list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, query, selectedFacets, sortKey]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / TABLE_PAGE));
  const clampedPage = Math.min(page, pageCount);
  const paged = filtered.slice((clampedPage - 1) * TABLE_PAGE, clampedPage * TABLE_PAGE);

  const groups: FacetGroup[] = config.facets
    .map((facet) => {
      let buckets = countBuckets(rows.flatMap((r) => facet.getValues(r)));
      if (facet.order) buckets = orderBuckets(buckets, facet.order);
      const chosen = selectedFacets[facet.key] ?? [];
      return {
        key: facet.key,
        label: facet.label,
        options: buckets.map((b) => ({
          value: b.value,
          label: facet.valueLabel(b.value),
          count: b.count,
          selected: chosen.includes(b.value),
        })),
      };
    })
    .filter((g) => g.options.length > 0);

  function toggleFacet(facetKey: string, value: string) {
    setPage(1);
    setSelectedFacets((prev) => {
      const cur = prev[facetKey] ?? [];
      const next = cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value];
      return { ...prev, [facetKey]: next };
    });
  }

  const allPagedSelected = paged.length > 0 && paged.every((r) => selected.has(config.getKey(r)));
  function toggleAllPaged() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allPagedSelected) for (const r of paged) next.delete(config.getKey(r));
      else for (const r of paged) next.add(config.getKey(r));
      return next;
    });
  }
  function toggleRow(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }
  function bulk(status: string) {
    const keys = [...selected];
    setSelected(new Set());
    onMove(keys, status);
  }

  const bulkActions = config.board?.bulkActions ?? [];

  return (
    <div className="grid gap-8 md:grid-cols-[240px_1fr]">
      <aside className="space-y-6">
        <FacetPanel groups={groups} onToggle={toggleFacet} />
      </aside>

      <section className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {t(config.locale, 'acm.results', { count: filtered.length })}
        </p>

        {selected.size > 0 && bulkActions.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-muted/30 p-2 text-sm">
            <span className="font-medium text-foreground">
              {t(config.locale, 'acm.selectedCount', { count: selected.size })}
            </span>
            {bulkActions.map((action) => (
              <Button
                key={action.status}
                size="sm"
                variant="outline"
                onClick={() => bulk(action.status)}
              >
                {action.label}
              </Button>
            ))}
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
              {t(config.locale, 'acm.clearSelection')}
            </Button>
          </div>
        ) : null}

        {filtered.length === 0 ? (
          <EmptyState
            icon={<Icon name="book-open" className="size-6" />}
            title={config.emptyLabel}
          />
        ) : (
          <Card className="overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow className="hover:bg-transparent">
                  {bulkActions.length > 0 ? (
                    <TableHead className="w-10">
                      <Checkbox
                        checked={allPagedSelected}
                        onChange={toggleAllPaged}
                        aria-label={t(config.locale, 'acm.selectedCount', { count: selected.size })}
                      />
                    </TableHead>
                  ) : null}
                  <TableHead>{t(config.locale, 'acl.colTitle')}</TableHead>
                  {config.headCells}
                  <TableHead className="text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((row) => {
                  const key = config.getKey(row);
                  const subtitle = config.getSubtitle?.(row);
                  return (
                    <TableRow key={key} className={cn(busy.has(key) && 'opacity-60')}>
                      {bulkActions.length > 0 ? (
                        <TableCell>
                          <Checkbox
                            checked={selected.has(key)}
                            onChange={() => toggleRow(key)}
                            aria-label={t(config.locale, 'acm.selectRow', {
                              title: config.getTitle(row),
                            })}
                          />
                        </TableCell>
                      ) : null}
                      <TableCell>
                        <a
                          href={config.editHref(key)}
                          className="font-medium text-foreground hover:underline"
                        >
                          {config.getTitle(row)}
                        </a>
                        {subtitle ? (
                          <div className="text-xs text-muted-foreground">{subtitle}</div>
                        ) : null}
                      </TableCell>
                      {config.rowCells(row)}
                      <TableCell className="text-right">
                        <ActionsMenu
                          row={row}
                          config={config}
                          onMove={(status) => onMove([key], status)}
                          onDuplicate={onDuplicate ? () => onDuplicate(row) : undefined}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        )}

        {pageCount > 1 ? (
          <Pagination
            page={clampedPage}
            pageCount={pageCount}
            onPageChange={setPage}
            prevLabel={t(config.locale, 'common.prev')}
            nextLabel={t(config.locale, 'common.next')}
          />
        ) : null}
      </section>
    </div>
  );
}

function readStored<T extends string>(key: string, allowed: readonly string[], fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const value = sessionStorage.getItem(key);
    return value && allowed.includes(value) ? (value as T) : fallback;
  } catch {
    return fallback;
  }
}

/** Quick-create dialog: title (+ optional type) → creates a draft → opens the editor. */
function QuickCreateDialog<Row>({
  config,
  open,
  initialType,
  onOpenChange,
  onCreated,
}: {
  config: EntityManagerConfig<Row>;
  open: boolean;
  initialType?: string;
  onOpenChange: (open: boolean) => void;
  onCreated: (key: string) => void;
}) {
  const quick = config.quickCreate;
  const [title, setTitle] = useState('');
  const [type, setType] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTitle('');
      setType(initialType ?? quick?.typeOptions?.[0]?.value ?? '');
      setError(null);
      setBusy(false);
    }
  }, [open, initialType, quick]);

  if (!quick) return null;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!quick || !title.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const key = await quick.create({ title: title.trim(), type: type || undefined });
      onCreated(key);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeLabel={t(config.locale, 'common.close')}>
        <DialogHeader>
          <DialogTitle>{config.newLabel}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-foreground">{t(config.locale, 'acl.colTitle')}</span>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
          </label>
          {quick.typeOptions ? (
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-foreground">{t(config.locale, 'acl.colType')}</span>
              <Select value={type} onChange={(e) => setType(e.target.value)}>
                {quick.typeOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </label>
          ) : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button type="submit" disabled={!title.trim() || busy}>
              {busy ? t(config.locale, 'acm.creating') : t(config.locale, 'acm.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Generic three-view admin manager (hub / table / board), driven by a per-entity config. */
export function EntityManager<Row>({ config }: { config: EntityManagerConfig<Row> }) {
  const { locale, entity } = config;
  const axisStore = `tmr.admin-${entity}.axis`;
  const viewStore = `tmr.admin-${entity}.view`;
  const axisKeys = config.axes.map((a) => a.key);

  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>(config.views[0]);
  const [axisKey, setAxisKey] = useState(config.defaultAxis);
  const [busy, setBusy] = useState<Set<string>>(new Set());
  const [createOpen, setCreateOpen] = useState(false);
  const [createType, setCreateType] = useState<string | undefined>(undefined);
  // Search + sort live in the control bar and drive the board/table views.
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState(config.defaultSort);

  useEffect(() => {
    setView(readStored(viewStore, config.views, config.views[0]));
    setAxisKey(readStored(axisStore, axisKeys, config.defaultAxis));
    // Run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    config
      .load()
      .then(setRows)
      .catch((e: Error) => setError(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function changeView(next: ViewMode) {
    setView(next);
    try {
      sessionStorage.setItem(viewStore, next);
    } catch {
      /* best-effort */
    }
  }
  function changeAxis(next: string) {
    setAxisKey(next);
    try {
      sessionStorage.setItem(axisStore, next);
    } catch {
      /* best-effort */
    }
  }

  async function moveStatus(keys: string[], status: string) {
    const board = config.board;
    if (!board || keys.length === 0) return;
    setBusy((prev) => new Set([...prev, ...keys]));
    setRows(
      (prev) =>
        prev?.map((r) => (keys.includes(config.getKey(r)) ? board.applyStatus(r, status) : r)) ??
        prev,
    );
    try {
      await board.setStatus(keys, status);
    } catch (e) {
      setError((e as Error).message);
      const fresh = await config.load().catch(() => null);
      if (fresh) setRows(fresh);
    } finally {
      setBusy((prev) => {
        const next = new Set(prev);
        for (const k of keys) next.delete(k);
        return next;
      });
    }
  }

  function openCreate(type?: string) {
    setCreateType(type);
    setCreateOpen(true);
  }
  async function duplicateItem(row: Row) {
    if (!config.duplicate) return;
    const key = config.getKey(row);
    setBusy((prev) => new Set([...prev, key]));
    try {
      const newKey = await config.duplicate(row);
      window.location.assign(config.editHref(newKey));
    } catch (e) {
      setError((e as Error).message);
      setBusy((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  }
  const duplicate = config.duplicate ? duplicateItem : undefined;

  // Primary action lives on the header row (not the toolbar) — a create CTA, not a filter.
  const newAction = config.quickCreate ? (
    <Button size="sm" onClick={() => openCreate()}>
      <Icon name="plus" className="size-4" />
      {config.newLabel}
    </Button>
  ) : (
    <a href={config.newHref} className={cn(buttonVariants({ size: 'sm' }))}>
      <Icon name="plus" className="size-4" />
      {config.newLabel}
    </a>
  );
  const header = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      {config.title ? (
        <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">
          {config.title}
        </h2>
      ) : (
        <span />
      )}
      {newAction}
    </div>
  );

  if (error) {
    return (
      <div className="space-y-6">
        {header}
        <p className="text-sm text-destructive">{config.loadError(error)}</p>
      </div>
    );
  }
  if (!rows) {
    return (
      <div className="space-y-6">
        {header}
        {['s1', 's2', 's3'].map((k) => (
          <Skeleton key={k} className="h-40 w-full" />
        ))}
      </div>
    );
  }

  const axis = config.axes.find((a) => a.key === axisKey) ?? config.axes[0];
  const showAxisSwitcher = view === 'hub' && config.axes.length > 1;

  return (
    <div className="space-y-6">
      {header}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="w-full sm:max-w-sm">
          <SearchField
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onClear={() => setQuery('')}
            placeholder={config.searchPlaceholder}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {showAxisSwitcher ? (
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              {t(locale, 'acm.organiseBy')}
              <Select
                value={axis.key}
                onChange={(e) => changeAxis(e.target.value)}
                className="w-auto"
              >
                {config.axes.map((a) => (
                  <option key={a.key} value={a.key}>
                    {a.label}
                  </option>
                ))}
              </Select>
            </label>
          ) : null}
          {view === 'table' ? (
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              {t(locale, 'acm.sortLabel')}
              <Select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value)}
                className="w-auto"
              >
                {config.sorts.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </label>
          ) : null}
          {config.views.length > 1 ? (
            <SegmentedToggle<ViewMode>
              aria-label={t(locale, 'acm.viewHub')}
              value={view}
              onValueChange={changeView}
              options={config.views.map((v) => ({
                value: v,
                label: t(locale, VIEW_LABEL[v]),
              }))}
            />
          ) : null}
        </div>
      </div>

      {view === 'hub' ? (
        <HubView
          rows={rows}
          axis={axis}
          config={config}
          onMove={moveStatus}
          onDuplicate={duplicate}
          onCreate={config.quickCreate ? openCreate : undefined}
          busy={busy}
          query={query}
        />
      ) : view === 'board' && config.board ? (
        <BoardView
          rows={rows}
          board={config.board}
          config={config}
          onMove={moveStatus}
          onDuplicate={duplicate}
          busy={busy}
          query={query}
        />
      ) : (
        <TableView
          rows={rows}
          config={config}
          onMove={moveStatus}
          onDuplicate={duplicate}
          busy={busy}
          query={query}
          sortKey={sortKey}
        />
      )}

      <QuickCreateDialog
        config={config}
        open={createOpen}
        initialType={createType}
        onOpenChange={setCreateOpen}
        onCreated={(key) => window.location.assign(config.editHref(key))}
      />
    </div>
  );
}

const VIEW_LABEL: Record<ViewMode, Parameters<typeof t>[1]> = {
  hub: 'acm.viewHub',
  table: 'acm.viewTable',
  board: 'acm.viewBoard',
};
