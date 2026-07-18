import { LOCALE_LABELS, LOCALES, type Locale, t } from '@TheY2T/tmr-i18n';
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
  localeAdminApi,
  type UiMessageRevision,
  type UiMessageRow,
} from '@TheY2T/tmr-web-data/i18n-api';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Admin CMS for DB-backed UI strings (ADR 0034). Search-first over the whole catalogue; each row can be
 * edited in place (saves a draft), soft-deleted behind a type-the-key confirmation, restored, and its
 * history viewed. "Publish" promotes drafts and cache-busts the live site. i18n-by-prop (`locale`).
 */
export default function AdminLocaleManager({ locale }: { locale: Locale }) {
  const [rows, setRows] = useState<UiMessageRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [localeFilter, setLocaleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [publishing, setPublishing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const [editing, setEditing] = useState<{ id: string; value: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UiMessageRow | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [history, setHistory] = useState<{ row: UiMessageRow; items: UiMessageRevision[] } | null>(
    null,
  );

  const reload = useCallback(async () => {
    setError(null);
    try {
      const items = await localeAdminApi.list({
        search: search.trim() || undefined,
        locale: localeFilter || undefined,
        status: statusFilter || undefined,
        includeDeleted,
      });
      setRows(items);
    } catch (err) {
      setError(t(locale, 'localeadmin.loadError', { error: (err as Error).message }));
      setRows([]);
    }
  }, [search, localeFilter, statusFilter, includeDeleted, locale]);

  // Refetch when filters change; debounce the search box so typing doesn't hammer the API.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      void reload();
      return;
    }
    const timer = setTimeout(() => void reload(), 250);
    return () => clearTimeout(timer);
  }, [reload]);

  const withBusy = useCallback(async (id: string, fn: () => Promise<void>) => {
    setBusyIds((prev) => new Set(prev).add(id));
    try {
      await fn();
    } finally {
      setBusyIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }, []);

  function patchRow(updated: UiMessageRow) {
    setRows((prev) => prev?.map((r) => (r.id === updated.id ? updated : r)) ?? null);
  }

  async function saveEdit() {
    if (!editing) return;
    const { id, value } = editing;
    setEditing(null);
    await withBusy(id, async () => {
      try {
        patchRow(await localeAdminApi.update(id, value));
      } catch (err) {
        setError(t(locale, 'localeadmin.saveError', { error: (err as Error).message }));
      }
    });
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    await withBusy(target.id, async () => {
      try {
        const updated = await localeAdminApi.remove(target.id);
        if (includeDeleted) patchRow(updated);
        else setRows((prev) => prev?.filter((r) => r.id !== target.id) ?? null);
      } catch (err) {
        setError(t(locale, 'localeadmin.saveError', { error: (err as Error).message }));
      }
    });
  }

  async function restore(row: UiMessageRow) {
    await withBusy(row.id, async () => {
      try {
        patchRow(await localeAdminApi.restore(row.id));
      } catch (err) {
        setError(t(locale, 'localeadmin.saveError', { error: (err as Error).message }));
      }
    });
  }

  async function openHistory(row: UiMessageRow) {
    setHistory({ row, items: [] });
    try {
      setHistory({ row, items: await localeAdminApi.revisions(row.id) });
    } catch {
      setHistory({ row, items: [] });
    }
  }

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

  const count = rows?.length ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold tracking-tight">
            {t(locale, 'localeadmin.title')}
          </h2>
          <p className="text-sm text-muted-foreground">{t(locale, 'localeadmin.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setNewOpen(true)}>
            <Icon name="plus" className="size-4" />
            {t(locale, 'localeadmin.new')}
          </Button>
          <Button onClick={publish} disabled={publishing}>
            <Icon name="upload" className="size-4" />
            {publishing ? t(locale, 'localeadmin.publishing') : t(locale, 'localeadmin.publish')}
          </Button>
        </div>
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
          value={localeFilter}
          onChange={(e) => setLocaleFilter(e.target.value)}
          aria-label={t(locale, 'localeadmin.colLocale')}
          className="w-auto"
        >
          <option value="">{t(locale, 'localeadmin.allLocales')}</option>
          {LOCALES.map((l) => (
            <option key={l} value={l}>
              {LOCALE_LABELS[l]}
            </option>
          ))}
        </Select>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label={t(locale, 'localeadmin.colStatus')}
          className="w-auto"
        >
          <option value="">{t(locale, 'localeadmin.allStatuses')}</option>
          <option value="draft">{t(locale, 'localeadmin.statusDraft')}</option>
          <option value="published">{t(locale, 'localeadmin.statusPublished')}</option>
        </Select>
        <Label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={includeDeleted}
            onChange={(e) => setIncludeDeleted(e.target.checked)}
          />
          {t(locale, 'localeadmin.showDeleted')}
        </Label>
        <span className="ml-auto text-sm text-muted-foreground">
          {t(locale, 'localeadmin.count', { count })}
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
              <TableHead className="w-16">{t(locale, 'localeadmin.colLocale')}</TableHead>
              <TableHead>{t(locale, 'localeadmin.colPublished')}</TableHead>
              <TableHead>{t(locale, 'localeadmin.colDraft')}</TableHead>
              <TableHead className="w-24">{t(locale, 'localeadmin.colStatus')}</TableHead>
              <TableHead className="w-24">{t(locale, 'localeadmin.colOrigin')}</TableHead>
              <TableHead className="w-px" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows === null ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  <Icon name="loader" className="mx-auto size-5 animate-spin" />
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  {t(locale, 'localeadmin.empty')}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const busy = busyIds.has(row.id);
                const isEditing = editing?.id === row.id;
                return (
                  <TableRow key={row.id} className={busy ? 'opacity-60' : undefined}>
                    <TableCell className="max-w-[16rem] truncate font-mono text-xs" title={row.key}>
                      {row.key}
                    </TableCell>
                    <TableCell className="text-xs uppercase text-muted-foreground">
                      {row.locale}
                    </TableCell>
                    <TableCell
                      className="max-w-[18rem] truncate text-sm"
                      title={row.publishedValue}
                    >
                      {row.publishedValue ?? <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-sm">
                      {isEditing ? (
                        <Input
                          // biome-ignore lint/a11y/noAutofocus: focus the inline editor on open
                          autoFocus
                          value={editing.value}
                          onChange={(e) => setEditing({ id: row.id, value: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') void saveEdit();
                            if (e.key === 'Escape') setEditing(null);
                          }}
                        />
                      ) : (
                        <span className="block max-w-[18rem] truncate" title={row.draftValue}>
                          {row.draftValue ?? <span className="text-muted-foreground">—</span>}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {row.deleted ? (
                        <Badge variant="destructive">{t(locale, 'localeadmin.badgeDeleted')}</Badge>
                      ) : row.status === 'published' ? (
                        <Badge variant="success">{t(locale, 'localeadmin.statusPublished')}</Badge>
                      ) : (
                        <Badge variant="warning">{t(locale, 'localeadmin.statusDraft')}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={row.seeded ? 'secondary' : 'outline'}>
                        {row.seeded
                          ? t(locale, 'localeadmin.originSeed')
                          : t(locale, 'localeadmin.originRuntime')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        {isEditing ? (
                          <>
                            <Button size="sm" onClick={() => void saveEdit()} disabled={busy}>
                              {t(locale, 'localeadmin.save')}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                              {t(locale, 'localeadmin.cancel')}
                            </Button>
                          </>
                        ) : row.deleted ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => void restore(row)}
                            disabled={busy}
                          >
                            <Icon name="undo" className="size-4" />
                            {t(locale, 'localeadmin.restore')}
                          </Button>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              aria-label={t(locale, 'localeadmin.edit')}
                              onClick={() =>
                                setEditing({ id: row.id, value: row.draftValue ?? '' })
                              }
                              disabled={busy}
                            >
                              <Icon name="pencil" className="size-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              aria-label={t(locale, 'localeadmin.history')}
                              onClick={() => void openHistory(row)}
                            >
                              <Icon name="clock" className="size-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              aria-label={t(locale, 'localeadmin.delete')}
                              onClick={() => setDeleteTarget(row)}
                              disabled={busy}
                            >
                              <Icon name="trash" className="size-4 text-destructive" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <DeleteDialog
        locale={locale}
        target={deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
      <NewStringDialog
        locale={locale}
        open={newOpen}
        onClose={() => setNewOpen(false)}
        onCreated={() => {
          setNewOpen(false);
          void reload();
        }}
        onError={setError}
      />
      <HistoryDialog locale={locale} history={history} onClose={() => setHistory(null)} />
    </div>
  );
}

function DeleteDialog({
  locale,
  target,
  onCancel,
  onConfirm,
}: {
  locale: Locale;
  target: UiMessageRow | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const [typed, setTyped] = useState('');
  useEffect(() => setTyped(''), [target]);
  const matches = target !== null && typed === target.key;
  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent closeLabel={t(locale, 'localeadmin.cancel')}>
        <DialogHeader>
          <DialogTitle>{t(locale, 'localeadmin.deleteTitle')}</DialogTitle>
          <DialogDescription>
            {t(locale, 'localeadmin.deleteBody', { key: target?.key ?? '' })}
          </DialogDescription>
        </DialogHeader>
        <label className="block space-y-1 text-sm">
          <span className="font-medium text-foreground">
            {t(locale, 'localeadmin.deleteConfirmLabel')}
          </span>
          <Input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={target?.key}
            className="font-mono"
          />
        </label>
        <DialogFooter>
          <Button variant="ghost" onClick={onCancel}>
            {t(locale, 'localeadmin.cancel')}
          </Button>
          <Button variant="destructive" disabled={!matches} onClick={onConfirm}>
            {t(locale, 'localeadmin.deleteConfirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NewStringDialog({
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
  const [loc, setLoc] = useState<string>(LOCALES[0]);
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (open) {
      setLoc(LOCALES[0]);
      setKey('');
      setValue('');
    }
  }, [open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await localeAdminApi.create({ locale: loc, key: key.trim(), value });
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
          <DialogTitle>{t(locale, 'localeadmin.newTitle')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-foreground">
              {t(locale, 'localeadmin.fieldLocale')}
            </span>
            <Select value={loc} onChange={(e) => setLoc(e.target.value)}>
              {LOCALES.map((l) => (
                <option key={l} value={l}>
                  {LOCALE_LABELS[l]}
                </option>
              ))}
            </Select>
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-foreground">{t(locale, 'localeadmin.fieldKey')}</span>
            <Input
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="domain.thing"
              className="font-mono"
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-foreground">
              {t(locale, 'localeadmin.fieldValue')}
            </span>
            <Textarea value={value} onChange={(e) => setValue(e.target.value)} rows={3} />
          </label>
          <DialogFooter>
            <Button type="submit" disabled={busy || !key.trim() || !value}>
              {t(locale, 'localeadmin.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function HistoryDialog({
  locale,
  history,
  onClose,
}: {
  locale: Locale;
  history: { row: UiMessageRow; items: UiMessageRevision[] } | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={history !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent closeLabel={t(locale, 'localeadmin.close')}>
        <DialogHeader>
          <DialogTitle>
            {t(locale, 'localeadmin.historyTitle', { key: history?.row.key ?? '' })}
          </DialogTitle>
        </DialogHeader>
        {history && history.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t(locale, 'localeadmin.noHistory')}</p>
        ) : (
          <ul className="max-h-80 space-y-2 overflow-y-auto text-sm">
            {history?.items.map((rev) => (
              <li key={rev.id} className="rounded-md border border-border p-2">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="secondary">{rev.action}</Badge>
                  <time className="text-xs text-muted-foreground">
                    {new Date(rev.editedAt).toLocaleString(locale)}
                  </time>
                </div>
                {rev.value ? <p className="mt-1 break-words">{rev.value}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
