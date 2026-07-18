import { DEFAULT_LOCALE, LOCALE_LABELS, LOCALES, type Locale, t } from '@TheY2T/tmr-i18n';
import {
  Badge,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Icon,
  Input,
  Label,
  Pagination,
  SearchField,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
} from '@TheY2T/tmr-ui';
import {
  type LocaleInfo,
  listLocales,
  localeAdminApi,
  type UiMessageRow,
} from '@TheY2T/tmr-web-data/i18n-api';
import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';

const PAGE_SIZES = [10, 25, 50, 100, 200] as const;

/** One key's locale rows folded into a single table row. */
interface KeyGroup {
  key: string;
  rows: UiMessageRow[]; // all locale rows for this key (incl. soft-deleted)
  value: string | undefined; // representative value (base locale, else first live)
  status: 'draft' | 'published';
  origin: 'baseline' | 'runtime';
  locales: string[]; // live (non-deleted) locales
  hasDeleted: boolean;
  fullyDeleted: boolean;
}

function rowValue(row: UiMessageRow): string | undefined {
  return row.publishedValue ?? row.draftValue ?? undefined;
}

function buildGroup(key: string, rows: UiMessageRow[]): KeyGroup {
  const live = rows.filter((r) => !r.deleted);
  const rep = live.find((r) => r.locale === DEFAULT_LOCALE) ?? live[0] ?? rows[0];
  return {
    key,
    rows,
    value: rep ? rowValue(rep) : undefined,
    status: live.some((r) => r.status === 'draft') ? 'draft' : 'published',
    origin: live.some((r) => !r.seeded) ? 'runtime' : 'baseline',
    locales: live.map((r) => r.locale),
    hasDeleted: rows.some((r) => r.deleted),
    fullyDeleted: live.length === 0,
  };
}

/** True when the key or any of its locale values contains the (lowercased) needle. */
function groupMatches(group: KeyGroup, needle: string): boolean {
  if (!needle) {
    return true;
  }
  if (group.key.toLowerCase().includes(needle)) {
    return true;
  }
  return group.rows.some(
    (r) =>
      (r.draftValue?.toLowerCase().includes(needle) ?? false) ||
      (r.publishedValue?.toLowerCase().includes(needle) ?? false),
  );
}

/**
 * Admin CMS for DB-backed UI strings (ADR 0034). One row per key; editing a key opens a modal that
 * manages all its locale translations (add / update / remove). "Publish" promotes drafts + cache-busts
 * the live site. i18n-by-prop (`locale`). "Show deleted" filters to keys with a removed locale.
 */
export default function AdminLocaleManager({ locale }: { locale: Locale }) {
  const [rows, setRows] = useState<UiMessageRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deletedOnly, setDeletedOnly] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const [editing, setEditing] = useState<KeyGroup | null>(null);
  const [addStringOpen, setAddStringOpen] = useState(false);
  const [newLocaleOpen, setNewLocaleOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [availableLocales, setAvailableLocales] = useState<LocaleInfo[]>([]);

  // Always fetch every locale + deleted rows; grouping + filtering + paging happen client-side.
  const reload = useCallback(async () => {
    setError(null);
    try {
      const [items, locs] = await Promise.all([
        localeAdminApi.list({ includeDeleted: true }),
        listLocales(),
      ]);
      setRows(items);
      setAvailableLocales(locs);
    } catch (err) {
      setError(t(locale, 'localeadmin.loadError', { error: (err as Error).message }));
      setRows([]);
    }
  }, [locale]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const groups = useMemo(() => {
    const byKey = new Map<string, UiMessageRow[]>();
    for (const row of rows ?? []) {
      const arr = byKey.get(row.key) ?? [];
      arr.push(row);
      byKey.set(row.key, arr);
    }
    return [...byKey.entries()]
      .map(([key, keyRows]) => buildGroup(key, keyRows))
      .sort((a, b) => a.key.localeCompare(b.key));
  }, [rows]);

  const deferredSearch = useDeferredValue(search);
  const filtered = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    return groups.filter((g) => {
      if (deletedOnly) {
        return g.hasDeleted && groupMatches(g, q);
      }
      if (g.fullyDeleted) {
        return false; // hide keys whose every locale is deleted unless "show deleted" is on
      }
      if (statusFilter && g.status !== statusFilter) {
        return false;
      }
      return groupMatches(g, q);
    });
  }, [groups, deferredSearch, deletedOnly, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const clampedPage = Math.min(page, pageCount);
  const pageGroups = filtered.slice((clampedPage - 1) * pageSize, clampedPage * pageSize);

  useEffect(() => {
    setPage(1);
  }, [deferredSearch, statusFilter, deletedOnly, pageSize]);

  async function publish() {
    setPublishing(true);
    setNotice(null);
    try {
      await localeAdminApi.publish();
      setNotice(t(locale, 'localeadmin.publishDone'));
      await reload();
    } catch (err) {
      setError(t(locale, 'localeadmin.saveError', { error: (err as Error).message }));
    } finally {
      setPublishing(false);
    }
  }

  const total = filtered.length;
  const rangeFrom = total === 0 ? 0 : (clampedPage - 1) * pageSize + 1;
  const rangeTo = Math.min(clampedPage * pageSize, total);

  return (
    <div className="space-y-4">
      {/* Title + subtitle come from the page's PageShell header — no duplicate heading here. */}
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          variant="outline"
          title={t(locale, 'localeadmin.tipNewLocale')}
          onClick={() => setNewLocaleOpen(true)}
        >
          <Icon name="globe" className="size-4" />
          {t(locale, 'localeadmin.addLocale')}
        </Button>
        <Button
          variant="outline"
          title={t(locale, 'localeadmin.tipAddString')}
          onClick={() => setAddStringOpen(true)}
        >
          <Icon name="plus" className="size-4" />
          {t(locale, 'localeadmin.addString')}
        </Button>
        <Button
          variant="outline"
          title={t(locale, 'localeadmin.tipImport')}
          onClick={() => setImportOpen(true)}
        >
          <Icon name="upload" className="size-4" />
          {t(locale, 'localeadmin.import')}
        </Button>
        <Button
          variant="outline"
          title={t(locale, 'localeadmin.tipExport')}
          onClick={() => setExportOpen(true)}
        >
          <Icon name="download" className="size-4" />
          {t(locale, 'localeadmin.export')}
        </Button>
        <Button title={t(locale, 'localeadmin.tipPublish')} onClick={publish} disabled={publishing}>
          <Icon name="check" className="size-4" />
          {publishing ? t(locale, 'localeadmin.publishing') : t(locale, 'localeadmin.publish')}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SearchField
          className="w-full sm:w-72"
          placeholder={t(locale, 'localeadmin.search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch('')}
        />
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label={t(locale, 'localeadmin.colStatus')}
          className="w-auto"
          disabled={deletedOnly}
        >
          <option value="">{t(locale, 'localeadmin.allStatuses')}</option>
          <option value="draft">{t(locale, 'localeadmin.statusDraft')}</option>
          <option value="published">{t(locale, 'localeadmin.statusPublished')}</option>
        </Select>
        <Label className="flex items-center gap-2 text-sm">
          <Checkbox checked={deletedOnly} onChange={(e) => setDeletedOnly(e.target.checked)} />
          {t(locale, 'localeadmin.showDeleted')}
        </Label>
        <span className="ml-auto text-sm text-muted-foreground">
          {t(locale, 'localeadmin.count', { count: total })}
        </span>
      </div>

      {notice ? (
        <p className="rounded-md bg-accent/10 px-3 py-2 text-sm text-accent-foreground">{notice}</p>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t(locale, 'localeadmin.colKey')}</TableHead>
              <TableHead>{t(locale, 'localeadmin.colValue')}</TableHead>
              <TableHead className="w-24">{t(locale, 'localeadmin.colStatus')}</TableHead>
              <TableHead className="w-24">{t(locale, 'localeadmin.colOrigin')}</TableHead>
              <TableHead className="w-32">{t(locale, 'localeadmin.colLocales')}</TableHead>
              <TableHead className="w-px" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows === null ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  <Icon name="loader" className="mx-auto size-5 animate-spin" />
                </TableCell>
              </TableRow>
            ) : pageGroups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  {t(locale, deletedOnly ? 'localeadmin.noDeleted' : 'localeadmin.empty')}
                </TableCell>
              </TableRow>
            ) : (
              pageGroups.map((group) => (
                <TableRow key={group.key}>
                  <TableCell className="max-w-[16rem] truncate font-mono text-xs" title={group.key}>
                    {group.key}
                  </TableCell>
                  <TableCell className="max-w-[22rem] truncate text-sm" title={group.value}>
                    {group.value ?? <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    {group.fullyDeleted ? (
                      <Badge variant="destructive">{t(locale, 'localeadmin.badgeDeleted')}</Badge>
                    ) : group.status === 'published' ? (
                      <Badge variant="success">{t(locale, 'localeadmin.statusPublished')}</Badge>
                    ) : (
                      <Badge variant="warning">{t(locale, 'localeadmin.statusDraft')}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={group.origin === 'baseline' ? 'secondary' : 'outline'}>
                      {group.origin === 'baseline'
                        ? t(locale, 'localeadmin.originSeed')
                        : t(locale, 'localeadmin.originRuntime')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(group.locales.length ? group.locales : group.rows.map((r) => r.locale)).map(
                        (l) => (
                          <Badge key={l} variant="outline" className="uppercase">
                            {l}
                          </Badge>
                        ),
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label={t(locale, 'localeadmin.edit')}
                        title={t(locale, 'localeadmin.tipEdit')}
                        onClick={() => setEditing(group)}
                      >
                        <Icon name="pencil" className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Label className="flex items-center gap-2">
            {t(locale, 'localeadmin.perPage')}
            <Select
              value={String(pageSize)}
              onChange={(e) => setPageSize(Number(e.target.value))}
              aria-label={t(locale, 'localeadmin.perPage')}
              className="w-auto"
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </Select>
          </Label>
          <span>{t(locale, 'localeadmin.showing', { from: rangeFrom, to: rangeTo, total })}</span>
        </div>
        {pageCount > 1 ? (
          <Pagination
            page={clampedPage}
            pageCount={pageCount}
            onPageChange={setPage}
            prevLabel={t(locale, 'common.prev')}
            nextLabel={t(locale, 'common.next')}
          />
        ) : null}
      </div>

      <KeyEditorDialog
        locale={locale}
        group={editing}
        locales={availableLocales}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          setNotice(t(locale, 'localeadmin.publishDone'));
          void reload();
        }}
        onError={setError}
      />
      <AddStringDialog
        locale={locale}
        locales={availableLocales}
        open={addStringOpen}
        onClose={() => setAddStringOpen(false)}
        onCreated={() => {
          setAddStringOpen(false);
          void reload();
        }}
        onError={setError}
      />
      <NewLocaleDialog
        locale={locale}
        open={newLocaleOpen}
        onClose={() => setNewLocaleOpen(false)}
        onCreated={() => {
          setNewLocaleOpen(false);
          void reload();
        }}
        onError={setError}
      />
      <ImportDialog
        locale={locale}
        locales={availableLocales}
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={(count) => {
          setImportOpen(false);
          setNotice(t(locale, 'localeadmin.importDone', { count }));
          void reload();
        }}
        onError={setError}
      />
      <ExportDialog
        locale={locale}
        locales={availableLocales}
        rows={rows ?? []}
        open={exportOpen}
        onClose={() => setExportOpen(false)}
      />
    </div>
  );
}

interface LiveEntry {
  id: string;
  locale: string;
  original: string;
  value: string;
  remove: boolean;
}
interface DeletedEntry {
  id: string;
  locale: string;
  value: string;
  restore: boolean;
}
interface NewEntry {
  locale: string;
  value: string;
}

/** Per-key editor: manage every locale's translation for one key — edit, remove, restore, add. */
function KeyEditorDialog({
  locale,
  group,
  locales,
  onClose,
  onSaved,
  onError,
}: {
  locale: Locale;
  group: KeyGroup | null;
  locales: LocaleInfo[];
  onClose: () => void;
  onSaved: () => void;
  onError: (message: string) => void;
}) {
  const [live, setLive] = useState<LiveEntry[]>([]);
  const [deleted, setDeleted] = useState<DeletedEntry[]>([]);
  const [added, setAdded] = useState<NewEntry[]>([]);
  const [addLocale, setAddLocale] = useState('');
  const [addValue, setAddValue] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!group) {
      return;
    }
    setLive(
      group.rows
        .filter((r) => !r.deleted)
        .map((r) => {
          const value = r.draftValue ?? r.publishedValue ?? '';
          return { id: r.id, locale: r.locale, original: value, value, remove: false };
        }),
    );
    setDeleted(
      group.rows
        .filter((r) => r.deleted)
        .map((r) => ({
          id: r.id,
          locale: r.locale,
          value: r.draftValue ?? r.publishedValue ?? '',
          restore: false,
        })),
    );
    setAdded([]);
    setAddLocale('');
    setAddValue('');
  }, [group]);

  const present = new Set([
    ...live.map((e) => e.locale),
    ...deleted.map((e) => e.locale),
    ...added.map((e) => e.locale),
  ]);
  const missing = locales.filter((l) => !present.has(l.code));

  function stageNew() {
    if (!addLocale || !addValue.trim()) {
      return;
    }
    setAdded((a) => [...a, { locale: addLocale, value: addValue }]);
    setAddLocale('');
    setAddValue('');
  }

  async function save() {
    if (!group) {
      return;
    }
    setSaving(true);
    try {
      const ops: Promise<unknown>[] = [];
      for (const e of live) {
        if (e.remove) {
          ops.push(localeAdminApi.remove(e.id));
        } else if (e.value !== e.original) {
          ops.push(localeAdminApi.update(e.id, e.value));
        }
      }
      for (const e of deleted) {
        if (e.restore) {
          ops.push(localeAdminApi.restore(e.id));
        }
      }
      for (const e of added) {
        if (e.value.trim()) {
          ops.push(localeAdminApi.create({ locale: e.locale, key: group.key, value: e.value }));
        }
      }
      await Promise.all(ops);
      onSaved();
    } catch (err) {
      onError(t(locale, 'localeadmin.saveError', { error: (err as Error).message }));
    } finally {
      setSaving(false);
    }
  }

  const localeName = (id: string) =>
    locales.find((l) => l.code === id)?.label ?? LOCALE_LABELS[id as Locale] ?? id;

  return (
    <Dialog open={group !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent closeLabel={t(locale, 'localeadmin.cancel')}>
        <DialogHeader>
          <DialogTitle className="break-all font-mono text-base">
            {t(locale, 'localeadmin.editTitle', { key: group?.key ?? '' })}
          </DialogTitle>
          <DialogDescription>{t(locale, 'localeadmin.editSubtitle')}</DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
          {live.map((entry, index) => (
            <div key={entry.id} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">
                  {localeName(entry.locale)}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  title={t(locale, entry.remove ? 'localeadmin.tipKeep' : 'localeadmin.tipRemove')}
                  onClick={() =>
                    setLive((l) => l.map((x, j) => (j === index ? { ...x, remove: !x.remove } : x)))
                  }
                >
                  {entry.remove ? (
                    <>
                      <Icon name="undo" className="size-4" />
                      {t(locale, 'localeadmin.keep')}
                    </>
                  ) : (
                    <>
                      <Icon name="trash" className="size-4 text-destructive" />
                      {t(locale, 'localeadmin.remove')}
                    </>
                  )}
                </Button>
              </div>
              <Textarea
                rows={2}
                value={entry.value}
                disabled={entry.remove}
                className={entry.remove ? 'line-through opacity-60' : undefined}
                onChange={(e) =>
                  setLive((l) =>
                    l.map((x, j) => (j === index ? { ...x, value: e.target.value } : x)),
                  )
                }
              />
              {entry.remove ? (
                <p className="text-xs text-destructive">{t(locale, 'localeadmin.willRemove')}</p>
              ) : null}
            </div>
          ))}

          {added.map((entry, index) => (
            <div key={`new-${entry.locale}`} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                  {localeName(entry.locale)}
                  <Badge variant="outline">{t(locale, 'localeadmin.statusDraft')}</Badge>
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label={t(locale, 'localeadmin.remove')}
                  title={t(locale, 'localeadmin.tipRemove')}
                  onClick={() => setAdded((a) => a.filter((_, j) => j !== index))}
                >
                  <Icon name="trash" className="size-4 text-destructive" />
                </Button>
              </div>
              <Textarea
                rows={2}
                value={entry.value}
                onChange={(e) =>
                  setAdded((a) =>
                    a.map((x, j) => (j === index ? { ...x, value: e.target.value } : x)),
                  )
                }
              />
            </div>
          ))}

          {deleted.length ? (
            <div className="space-y-2 rounded-md border border-border p-2">
              <p className="text-xs font-medium text-muted-foreground">
                {t(locale, 'localeadmin.deletedHeading')}
              </p>
              {deleted.map((entry, index) => (
                <div key={entry.id} className="flex items-center justify-between gap-2">
                  <span className="min-w-0 text-sm">
                    <span className="font-medium">{localeName(entry.locale)}</span> —{' '}
                    <span
                      className={entry.restore ? undefined : 'text-muted-foreground line-through'}
                    >
                      {entry.value || '—'}
                    </span>
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    title={t(locale, 'localeadmin.tipRestore')}
                    onClick={() =>
                      setDeleted((d) =>
                        d.map((x, j) => (j === index ? { ...x, restore: !x.restore } : x)),
                      )
                    }
                  >
                    <Icon name="undo" className="size-4" />
                    {t(locale, 'localeadmin.restore')}
                  </Button>
                </div>
              ))}
            </div>
          ) : null}

          {missing.length ? (
            <div className="space-y-2 rounded-md border border-dashed border-border p-2">
              <p className="text-xs font-medium text-muted-foreground">
                {t(locale, 'localeadmin.addAnother')}
              </p>
              <div className="flex flex-wrap items-start gap-2">
                <Select
                  value={addLocale}
                  onChange={(e) => setAddLocale(e.target.value)}
                  aria-label={t(locale, 'localeadmin.fieldLocale')}
                  className="w-auto"
                >
                  <option value="">{t(locale, 'localeadmin.fieldLocale')}</option>
                  {missing.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.label}
                    </option>
                  ))}
                </Select>
                <Input
                  className="min-w-[10rem] flex-1"
                  value={addValue}
                  onChange={(e) => setAddValue(e.target.value)}
                  placeholder={t(locale, 'localeadmin.fieldValue')}
                />
                <Button
                  size="sm"
                  variant="outline"
                  title={t(locale, 'localeadmin.tipAddRow')}
                  disabled={!addLocale || !addValue.trim()}
                  onClick={stageNew}
                >
                  <Icon name="plus" className="size-4" />
                  {t(locale, 'localeadmin.add')}
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              {t(locale, 'localeadmin.allLocalesAdded')}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" title={t(locale, 'localeadmin.tipCancel')} onClick={onClose}>
            {t(locale, 'localeadmin.cancel')}
          </Button>
          <Button
            title={t(locale, 'localeadmin.tipSave')}
            disabled={saving}
            onClick={() => void save()}
          >
            {t(locale, 'localeadmin.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Create a brand-new key with a value for EVERY defined locale (one field per locale). */
function AddStringDialog({
  locale,
  locales,
  open,
  onClose,
  onCreated,
  onError,
}: {
  locale: Locale;
  locales: LocaleInfo[];
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  onError: (message: string) => void;
}) {
  const options = locales.length ? locales : LOCALES.map((code) => ({ code, label: code }));
  const [key, setKey] = useState('');
  const [values, setValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (open) {
      setKey('');
      setValues({});
    }
  }, [open]);

  // Every defined locale must have a value (a new key is created across all locales at once).
  const complete = key.trim().length > 0 && options.every((l) => (values[l.code] ?? '').trim());

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await Promise.all(
        options.map((l) =>
          localeAdminApi.create({ locale: l.code, key: key.trim(), value: values[l.code] ?? '' }),
        ),
      );
      onCreated();
    } catch (err) {
      onError(t(locale, 'localeadmin.saveError', { error: (err as Error).message }));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent closeLabel={t(locale, 'localeadmin.cancel')}>
        <DialogHeader>
          <DialogTitle>{t(locale, 'localeadmin.addString')}</DialogTitle>
          <DialogDescription>{t(locale, 'localeadmin.addStringBody')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-foreground">{t(locale, 'localeadmin.fieldKey')}</span>
            <Input
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="domain.thing"
              className="font-mono"
            />
          </label>
          <div className="max-h-[50vh] space-y-3 overflow-y-auto pr-1">
            {options.map((l) => (
              <label key={l.code} className="block space-y-1 text-sm">
                <span className="font-medium text-foreground">{l.label}</span>
                <Textarea
                  rows={2}
                  value={values[l.code] ?? ''}
                  onChange={(e) => setValues((v) => ({ ...v, [l.code]: e.target.value }))}
                />
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button
              type="submit"
              title={t(locale, 'localeadmin.tipAddString')}
              disabled={busy || !complete}
            >
              {t(locale, 'localeadmin.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Register a brand-new locale (code + label) so its strings can be authored/imported. */
function NewLocaleDialog({
  locale,
  open,
  onClose,
  onCreated,
  onError,
}: {
  locale: Locale;
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  onError: (message: string) => void;
}) {
  const [code, setCode] = useState('');
  const [label, setLabel] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (open) {
      setCode('');
      setLabel('');
    }
  }, [open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await localeAdminApi.createLocale({ code: code.trim(), label: label.trim() });
      onCreated();
    } catch (err) {
      onError(t(locale, 'localeadmin.saveError', { error: (err as Error).message }));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent closeLabel={t(locale, 'localeadmin.cancel')}>
        <DialogHeader>
          <DialogTitle>{t(locale, 'localeadmin.newLocaleTitle')}</DialogTitle>
          <DialogDescription>{t(locale, 'localeadmin.localeHint')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-foreground">
              {t(locale, 'localeadmin.fieldCode')}
            </span>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={t(locale, 'localeadmin.codePlaceholder')}
              className="font-mono"
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-foreground">
              {t(locale, 'localeadmin.fieldLabel')}
            </span>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Français"
            />
          </label>
          <DialogFooter>
            <Button
              type="submit"
              title={t(locale, 'localeadmin.tipNewLocale')}
              disabled={busy || !code.trim() || !label.trim()}
            >
              {t(locale, 'localeadmin.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Import a locale's strings from a flat key→value JSON file (upserted as drafts). */
function ImportDialog({
  locale,
  locales,
  open,
  onClose,
  onImported,
  onError,
}: {
  locale: Locale;
  locales: LocaleInfo[];
  open: boolean;
  onClose: () => void;
  onImported: (count: number) => void;
  onError: (message: string) => void;
}) {
  const [loc, setLoc] = useState<string>(locales[0]?.code ?? LOCALES[0]);
  const [entries, setEntries] = useState<Record<string, string> | null>(null);
  const [fileName, setFileName] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (open) {
      setLoc(locales[0]?.code ?? LOCALES[0]);
      setEntries(null);
      setFileName('');
    }
  }, [open, locales]);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    setFileName(file.name);
    try {
      const parsed = JSON.parse(await file.text()) as unknown;
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        throw new Error('not an object');
      }
      const map: Record<string, string> = {};
      for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
        map[key] = String(value);
      }
      setEntries(map);
    } catch {
      setEntries(null);
      onError(t(locale, 'localeadmin.badFile'));
    }
  }

  async function submit() {
    if (!entries) {
      return;
    }
    setBusy(true);
    try {
      const count = await localeAdminApi.importStrings({ locale: loc, entries });
      onImported(count);
    } catch (err) {
      onError(t(locale, 'localeadmin.saveError', { error: (err as Error).message }));
    } finally {
      setBusy(false);
    }
  }

  const options = locales.length ? locales : LOCALES.map((code) => ({ code, label: code }));
  const count = entries ? Object.keys(entries).length : 0;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent closeLabel={t(locale, 'localeadmin.cancel')}>
        <DialogHeader>
          <DialogTitle>{t(locale, 'localeadmin.importTitle')}</DialogTitle>
          <DialogDescription>{t(locale, 'localeadmin.importBody')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-foreground">
              {t(locale, 'localeadmin.fieldLocale')}
            </span>
            <Select value={loc} onChange={(e) => setLoc(e.target.value)}>
              {options.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </Select>
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-foreground">
              {t(locale, 'localeadmin.importFile')}
            </span>
            <Input type="file" accept="application/json,.json" onChange={onFile} />
          </label>
          {entries ? (
            <p className="text-sm text-muted-foreground">
              {fileName} · {t(locale, 'localeadmin.count', { count })}
            </p>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="ghost" title={t(locale, 'localeadmin.tipCancel')} onClick={onClose}>
            {t(locale, 'localeadmin.cancel')}
          </Button>
          <Button
            title={t(locale, 'localeadmin.tipImport')}
            disabled={busy || !entries}
            onClick={() => void submit()}
          >
            {t(locale, 'localeadmin.import')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Export a locale's strings as a key→value JSON download, optionally filtered by origin. */
function ExportDialog({
  locale,
  locales,
  rows,
  open,
  onClose,
}: {
  locale: Locale;
  locales: LocaleInfo[];
  rows: UiMessageRow[];
  open: boolean;
  onClose: () => void;
}) {
  const [loc, setLoc] = useState<string>(locales[0]?.code ?? LOCALES[0]);
  const [origin, setOrigin] = useState<'all' | 'baseline' | 'runtime'>('all');
  useEffect(() => {
    if (open) {
      setLoc(locales[0]?.code ?? LOCALES[0]);
      setOrigin('all');
    }
  }, [open, locales]);

  function exportJson() {
    const map: Record<string, string> = {};
    for (const r of rows) {
      if (r.locale !== loc || r.deleted) {
        continue;
      }
      if (origin === 'baseline' && !r.seeded) {
        continue;
      }
      if (origin === 'runtime' && r.seeded) {
        continue;
      }
      const value = r.publishedValue ?? r.draftValue;
      if (value != null) {
        map[r.key] = value;
      }
    }
    const blob = new Blob([JSON.stringify(map, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${loc}${origin === 'all' ? '' : `.${origin}`}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onClose();
  }

  const options = locales.length ? locales : LOCALES.map((code) => ({ code, label: code }));

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent closeLabel={t(locale, 'localeadmin.cancel')}>
        <DialogHeader>
          <DialogTitle>{t(locale, 'localeadmin.exportTitle')}</DialogTitle>
          <DialogDescription>{t(locale, 'localeadmin.exportBody')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-foreground">
              {t(locale, 'localeadmin.fieldLocale')}
            </span>
            <Select value={loc} onChange={(e) => setLoc(e.target.value)}>
              {options.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </Select>
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-foreground">{t(locale, 'localeadmin.origin')}</span>
            <Select
              value={origin}
              onChange={(e) => setOrigin(e.target.value as 'all' | 'baseline' | 'runtime')}
            >
              <option value="all">{t(locale, 'localeadmin.originAll')}</option>
              <option value="baseline">{t(locale, 'localeadmin.originSeed')}</option>
              <option value="runtime">{t(locale, 'localeadmin.originRuntime')}</option>
            </Select>
          </label>
        </div>
        <DialogFooter>
          <Button variant="ghost" title={t(locale, 'localeadmin.tipCancel')} onClick={onClose}>
            {t(locale, 'localeadmin.cancel')}
          </Button>
          <Button title={t(locale, 'localeadmin.tipExport')} onClick={exportJson}>
            <Icon name="download" className="size-4" />
            {t(locale, 'localeadmin.export')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
