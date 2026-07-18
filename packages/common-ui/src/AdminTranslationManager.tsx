import { type Locale, type MessageKey, t } from '@TheY2T/tmr-i18n';
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Icon,
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
  contentTranslationApi,
  getTranslationTarget,
  listTranslationTargets,
  TRANSLATABLE_FIELDS,
  type TranslatableEntityType,
  type TranslationTarget,
  type TranslationTargetSummary,
} from '@TheY2T/tmr-web-data/content-translations-api';
import { type LocaleInfo, listLocales } from '@TheY2T/tmr-web-data/i18n-api';
import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';

const ENTITY_TYPES: { value: TranslatableEntityType; labelKey: MessageKey }[] = [
  { value: 'content', labelKey: 'transadmin.typeContent' },
  { value: 'collection', labelKey: 'transadmin.typeCollection' },
  { value: 'help', labelKey: 'transadmin.typeHelp' },
];

/** field name → its localized label key (`title` → `transadmin.fieldTitle`). */
function fieldLabelKey(field: string): MessageKey {
  return `transadmin.field${field.charAt(0).toUpperCase()}${field.slice(1)}` as MessageKey;
}

/**
 * Admin CMS for per-locale CONTENT translations (ADR 0034, Phase 2). Pick a catalogue item, collection,
 * or help topic, then translate its text fields into each locale (base English shown for reference).
 * Saving upserts + publishes the entity's translations so they overlay live reads. i18n-by-prop.
 */
export default function AdminTranslationManager({ locale }: { locale: Locale }) {
  const [entityType, setEntityType] = useState<TranslatableEntityType>('content');
  const [targets, setTargets] = useState<TranslationTargetSummary[] | null>(null);
  const [search, setSearch] = useState('');
  const [locales, setLocales] = useState<LocaleInfo[]>([]);
  const [editing, setEditing] = useState<TranslationTargetSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    listLocales().then(setLocales);
  }, []);

  const reload = useCallback(async () => {
    setError(null);
    setTargets(null);
    try {
      setTargets(await listTranslationTargets(entityType));
    } catch (err) {
      setError(t(locale, 'transadmin.loadError', { error: (err as Error).message }));
      setTargets([]);
    }
  }, [entityType, locale]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const deferredSearch = useDeferredValue(search);
  const filtered = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    if (!q) {
      return targets ?? [];
    }
    return (targets ?? []).filter(
      (item) => item.title.toLowerCase().includes(q) || item.slug.toLowerCase().includes(q),
    );
  }, [targets, deferredSearch]);

  const targetLocales = locales.filter((l) => l.code !== 'en');

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={entityType}
          onChange={(e) => setEntityType(e.target.value as TranslatableEntityType)}
          aria-label={t(locale, 'transadmin.title')}
          className="w-auto"
        >
          {ENTITY_TYPES.map((et) => (
            <option key={et.value} value={et.value}>
              {t(locale, et.labelKey)}
            </option>
          ))}
        </Select>
        <SearchField
          className="w-full sm:w-72"
          placeholder={t(locale, 'transadmin.search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch('')}
        />
        <span className="ml-auto text-sm text-muted-foreground">
          {t(locale, 'localeadmin.count', { count: filtered.length })}
        </span>
      </div>

      {notice ? (
        <p className="rounded-md bg-accent/10 px-3 py-2 text-sm text-accent-foreground">{notice}</p>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {targetLocales.length === 0 ? (
        <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
          {t(locale, 'transadmin.noLocales')}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t(locale, 'transadmin.colTitle')}</TableHead>
              <TableHead>{t(locale, 'transadmin.colSlug')}</TableHead>
              <TableHead className="w-px" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {targets === null ? (
              <TableRow>
                <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                  <Icon name="loader" className="mx-auto size-5 animate-spin" />
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                  {t(locale, 'transadmin.empty')}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((item) => (
                <TableRow key={item.slug}>
                  <TableCell className="max-w-[24rem] truncate text-sm" title={item.title}>
                    {item.title}
                  </TableCell>
                  <TableCell className="max-w-[16rem] truncate font-mono text-xs" title={item.slug}>
                    {item.slug}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        title={t(locale, 'transadmin.tipEdit')}
                        disabled={targetLocales.length === 0}
                        onClick={() => setEditing(item)}
                      >
                        <Icon name="globe" className="size-4" />
                        {t(locale, 'transadmin.edit')}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <TranslationEditorDialog
        locale={locale}
        entityType={entityType}
        target={editing}
        targetLocales={targetLocales}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          setNotice(t(locale, 'transadmin.saved'));
        }}
        onError={setError}
      />
    </div>
  );
}

/** Edit one entity's translations: base English per field + an editable field per target locale. */
function TranslationEditorDialog({
  locale,
  entityType,
  target,
  targetLocales,
  onClose,
  onSaved,
  onError,
}: {
  locale: Locale;
  entityType: TranslatableEntityType;
  target: TranslationTargetSummary | null;
  targetLocales: LocaleInfo[];
  onClose: () => void;
  onSaved: () => void;
  onError: (message: string) => void;
}) {
  const [loaded, setLoaded] = useState<TranslationTarget | null>(null);
  const [existing, setExisting] = useState<Record<string, Record<string, string>>>({});
  const [values, setValues] = useState<Record<string, Record<string, string>>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!target) {
      return;
    }
    let cancelled = false;
    setLoaded(null);
    (async () => {
      const detail = await getTranslationTarget(entityType, target.slug);
      if (cancelled || !detail) {
        return;
      }
      const rows = await contentTranslationApi.list(entityType, detail.entityId);
      const map: Record<string, Record<string, string>> = {};
      for (const row of rows) {
        if (row.deleted) {
          continue;
        }
        const byField = map[row.locale] ?? {};
        byField[row.field] = row.draftValue ?? row.publishedValue ?? '';
        map[row.locale] = byField;
      }
      if (!cancelled) {
        setLoaded(detail);
        setExisting(map);
        setValues(JSON.parse(JSON.stringify(map)));
      }
    })().catch((err) =>
      onError(t(locale, 'transadmin.loadError', { error: (err as Error).message })),
    );
    return () => {
      cancelled = true;
    };
  }, [target, entityType, locale, onError]);

  const fields = TRANSLATABLE_FIELDS[entityType];

  function setValue(loc: string, field: string, value: string) {
    setValues((prev) => ({ ...prev, [loc]: { ...(prev[loc] ?? {}), [field]: value } }));
  }

  async function save() {
    if (!loaded) {
      return;
    }
    setSaving(true);
    try {
      const ops: Promise<unknown>[] = [];
      for (const loc of targetLocales) {
        for (const field of fields) {
          const value = values[loc.code]?.[field] ?? '';
          const original = existing[loc.code]?.[field] ?? '';
          if (value !== original && value.trim()) {
            ops.push(
              contentTranslationApi.upsert({
                entityType,
                entityId: loaded.entityId,
                locale: loc.code,
                field,
                value,
              }),
            );
          }
        }
      }
      await Promise.all(ops);
      await contentTranslationApi.publish(entityType, loaded.entityId);
      onSaved();
    } catch (err) {
      onError(t(locale, 'transadmin.saveError', { error: (err as Error).message }));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={target !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent closeLabel={t(locale, 'localeadmin.cancel')}>
        <DialogHeader>
          <DialogTitle>
            {t(locale, 'transadmin.editTitle', { title: target?.title ?? '' })}
          </DialogTitle>
          <DialogDescription>{target?.slug}</DialogDescription>
        </DialogHeader>

        {loaded === null ? (
          <div className="py-8 text-center text-muted-foreground">
            <Icon name="loader" className="mx-auto size-5 animate-spin" />
          </div>
        ) : (
          <div className="max-h-[60vh] space-y-5 overflow-y-auto pr-1">
            {fields.map((field) => (
              <div key={field} className="space-y-2">
                <p className="font-display text-sm font-semibold text-foreground">
                  {t(locale, fieldLabelKey(field))}
                </p>
                <div className="rounded-md border border-border bg-muted/40 p-2 text-sm">
                  <span className="mb-1 block text-xs font-medium text-muted-foreground">
                    {t(locale, 'transadmin.baseLabel')}
                  </span>
                  <span className="whitespace-pre-wrap break-words">
                    {loaded.fields[field] || <span className="text-muted-foreground">—</span>}
                  </span>
                </div>
                {targetLocales.map((loc) => (
                  <label key={loc.code} className="block space-y-1 text-sm">
                    <span className="flex items-center gap-2 font-medium text-foreground">
                      {loc.label}
                      <Badge variant="outline" className="uppercase">
                        {loc.code}
                      </Badge>
                    </span>
                    <Textarea
                      rows={field === 'bodyMdx' || field === 'body' ? 4 : 2}
                      value={values[loc.code]?.[field] ?? ''}
                      onChange={(e) => setValue(loc.code, field, e.target.value)}
                    />
                  </label>
                ))}
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" title={t(locale, 'transadmin.tipCancel')} onClick={onClose}>
            {t(locale, 'localeadmin.cancel')}
          </Button>
          <Button
            title={t(locale, 'transadmin.tipSave')}
            disabled={saving || loaded === null}
            onClick={() => void save()}
          >
            <Icon name="check" className="size-4" />
            {t(locale, 'transadmin.savePublish')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
