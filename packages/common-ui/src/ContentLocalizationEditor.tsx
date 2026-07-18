import { type Locale, type MessageKey, t } from '@TheY2T/tmr-i18n';
import {
  Badge,
  Button,
  Icon,
  Input,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from '@TheY2T/tmr-ui';
import {
  contentTranslationApi,
  getTranslationTarget,
  TRANSLATABLE_FIELDS,
  type TranslatableEntityType,
  type TranslationTarget,
} from '@TheY2T/tmr-web-data/content-translations-api';
import { type LocaleInfo, listLocales } from '@TheY2T/tmr-web-data/i18n-api';
import { useEffect, useState } from 'react';
import { BlockEditor } from './admin/block-editor/BlockEditor';

/** Body fields stored as rich markdown — edited with the WYSIWYG block editor (like content/collection). */
const RICH_FIELDS = new Set(['bodyMdx', 'body']);
/** Plain fields that read better as a multi-line box than a single input. */
const MULTILINE_PLAIN = new Set(['summary', 'curatorBio']);

/** The block-editor profile matching how each entity type authors its body (see ContentForm/CollectionForm). */
const EDITOR_PROFILE: Record<TranslatableEntityType, 'full' | 'minimal' | 'collection'> = {
  content: 'full',
  collection: 'collection',
  help: 'minimal',
};

/** field name → its localized label key (`title` → `transadmin.fieldTitle`). */
function fieldLabelKey(field: string): MessageKey {
  return `transadmin.field${field.charAt(0).toUpperCase()}${field.slice(1)}` as MessageKey;
}

/**
 * Full-page content-localization editor (ADR 0034, Phase 2) — the same shape as the content/collection
 * editors. Loads one entity's base (English) fields, then lets an admin translate them into each locale via
 * a locale tab strip: plain fields use inputs, body fields use the WYSIWYG block editor, and the English
 * original is shown for reference. "Save & publish" upserts the changed translations and publishes them so
 * they overlay live reads. i18n-by-prop.
 */
export default function ContentLocalizationEditor({
  locale,
  entityType,
  slug,
  blockEditor = false,
  interactive = false,
}: {
  locale: Locale;
  entityType: TranslatableEntityType;
  slug: string;
  /** Use the WYSIWYG block editor for body fields instead of a Markdown textarea (mirrors ContentForm). */
  blockEditor?: boolean;
  /** Whether embedded tools render interactively in the editor (mirrors learning.interactive-scores). */
  interactive?: boolean;
}) {
  const [loaded, setLoaded] = useState<TranslationTarget | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [locales, setLocales] = useState<LocaleInfo[]>([]);
  const [existing, setExisting] = useState<Record<string, Record<string, string>>>({});
  const [values, setValues] = useState<Record<string, Record<string, string>>>({});
  const [activeLocale, setActiveLocale] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const fields = TRANSLATABLE_FIELDS[entityType];
  const targetLocales = locales.filter((l) => l.code !== 'en');

  useEffect(() => {
    listLocales().then(setLocales);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoaded(null);
    setNotFound(false);
    (async () => {
      const detail = await getTranslationTarget(entityType, slug);
      if (cancelled) {
        return;
      }
      if (!detail) {
        setNotFound(true);
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
    })().catch((err) => {
      if (!cancelled) {
        setError(t(locale, 'transadmin.loadError', { error: (err as Error).message }));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [entityType, slug, locale]);

  // Default the active tab to the first target locale once locales load.
  useEffect(() => {
    if (!activeLocale && targetLocales.length > 0) {
      setActiveLocale(targetLocales[0].code);
    }
  }, [targetLocales, activeLocale]);

  function setValue(loc: string, field: string, value: string) {
    setValues((prev) => ({ ...prev, [loc]: { ...(prev[loc] ?? {}), [field]: value } }));
  }

  async function save() {
    if (!loaded) {
      return;
    }
    setSaving(true);
    setError(null);
    setNotice(null);
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
      setExisting(JSON.parse(JSON.stringify(values)));
      setNotice(t(locale, 'transadmin.saved'));
    } catch (err) {
      setError(t(locale, 'transadmin.saveError', { error: (err as Error).message }));
    } finally {
      setSaving(false);
    }
  }

  if (notFound) {
    return (
      <p className="rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
        {t(locale, 'loc.itemNotFound')}
      </p>
    );
  }
  if (loaded === null) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <Icon name="loader" className="mx-auto size-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error ? (
        <p
          role="alert"
          className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          <Icon name="alert-triangle" className="size-4" />
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className="flex items-center gap-2 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
          <Icon name="circle-check" className="size-4" />
          {notice}
        </p>
      ) : null}

      {/* Document head: the base item this localization targets. */}
      <div className="space-y-1">
        <h2 className="font-display text-2xl font-semibold tracking-tight">{loaded.title}</h2>
        <p className="font-mono text-xs text-muted-foreground">{loaded.slug}</p>
        <p className="text-sm text-muted-foreground">{t(locale, 'loc.editorSubtitle')}</p>
      </div>

      {targetLocales.length === 0 ? (
        <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
          {t(locale, 'transadmin.noLocales')}
        </p>
      ) : (
        <Tabs value={activeLocale} onValueChange={setActiveLocale} className="gap-4">
          <TabsList>
            {targetLocales.map((loc) => (
              <TabsTrigger key={loc.code} value={loc.code}>
                {loc.label}
                <Badge variant="outline" className="ml-2 uppercase">
                  {loc.code}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          {targetLocales.map((loc) => (
            <TabsContent key={loc.code} value={loc.code} className="space-y-5">
              {fields.map((field) => {
                const base = loaded.fields[field] ?? '';
                const current = values[loc.code]?.[field] ?? '';
                const rich = RICH_FIELDS.has(field);
                return (
                  <div key={field} className="space-y-2">
                    <p className="font-display text-sm font-semibold text-foreground">
                      {t(locale, fieldLabelKey(field))}
                    </p>
                    <div className="rounded-md border border-border bg-muted/40 p-2 text-sm">
                      <span className="mb-1 block text-xs font-medium text-muted-foreground">
                        {t(locale, 'transadmin.baseLabel')}
                      </span>
                      <span className="block max-h-40 overflow-y-auto whitespace-pre-wrap break-words">
                        {base || <span className="text-muted-foreground">—</span>}
                      </span>
                    </div>
                    {rich ? (
                      blockEditor ? (
                        <BlockEditor
                          key={`${loc.code}-${field}`}
                          locale={locale}
                          interactive={interactive}
                          profile={EDITOR_PROFILE[entityType]}
                          initialDoc={null}
                          initialBodyMdx={current}
                          initialEmbeds={[]}
                          onChange={(change) => setValue(loc.code, field, change.bodyMdx)}
                        />
                      ) : (
                        <Textarea
                          aria-label={t(locale, fieldLabelKey(field))}
                          className="h-48 font-mono text-sm"
                          value={current}
                          onChange={(e) => setValue(loc.code, field, e.target.value)}
                        />
                      )
                    ) : MULTILINE_PLAIN.has(field) ? (
                      <Textarea
                        aria-label={t(locale, fieldLabelKey(field))}
                        rows={2}
                        value={current}
                        onChange={(e) => setValue(loc.code, field, e.target.value)}
                      />
                    ) : (
                      <Input
                        aria-label={t(locale, fieldLabelKey(field))}
                        value={current}
                        onChange={(e) => setValue(loc.code, field, e.target.value)}
                      />
                    )}
                  </div>
                );
              })}
            </TabsContent>
          ))}
        </Tabs>
      )}

      <div className="flex flex-wrap gap-3 border-t border-border pt-4">
        <Button
          title={t(locale, 'transadmin.tipSave')}
          disabled={saving || targetLocales.length === 0}
          onClick={() => void save()}
        >
          <Icon name="check" className="size-4" />
          {t(locale, 'transadmin.savePublish')}
        </Button>
      </div>
    </div>
  );
}
