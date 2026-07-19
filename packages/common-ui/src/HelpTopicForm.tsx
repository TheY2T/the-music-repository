import type { HelpTopicWriteInput } from '@TheY2T/tmr-api-client';
import { type Locale, localizedPath, t } from '@TheY2T/tmr-i18n';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
  Field,
  Icon,
  Input,
} from '@TheY2T/tmr-ui';
import { LOCALIZABLE_FIELDS } from '@TheY2T/tmr-web-data/content-translations-api';
import { getHelpTopic, helpAdminApi } from '@TheY2T/tmr-web-data/help-api';
import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { BlockEditor } from './admin/block-editor/BlockEditor';
import { PreviewPane } from './admin/block-editor/PreviewPane';
import { LocaleBar } from './localization/LocaleBar';
import { LocalizableField } from './localization/LocalizableField';
import { useLocaleContent } from './localization/useLocaleContent';

const emptyForm = { slug: '', term: '', body: '', linkSlug: '' };

export default function HelpTopicForm({
  slug,
  locale,
  blockEditor = false,
  preview = false,
  localeStrings = false,
}: {
  slug?: string;
  locale: Locale;
  /** Use the minimal block editor for the body (ADR 0030) instead of the Markdown textarea. */
  blockEditor?: boolean;
  /** When true (+ blockEditor), show the opt-in Info-View live preview. */
  preview?: boolean;
  /** When true, enable the per-locale content localization switcher (ADR 0034). */
  localeStrings?: boolean;
}) {
  const isEdit = Boolean(slug);
  const [showPreview, setShowPreview] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [entityId, setEntityId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(!isEdit);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!slug) {
      return;
    }
    getHelpTopic(slug).then((topic) => {
      if (topic) {
        setEntityId(topic.id);
        setForm({
          slug: topic.slug,
          term: topic.term,
          body: topic.body,
          linkSlug: topic.linkSlug ?? '',
        });
      }
      setLoaded(true);
    });
  }, [slug]);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const baseValues = useMemo(() => ({ term: form.term, body: form.body }), [form.term, form.body]);
  const onBaseChange = useCallback((field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const loc = useLocaleContent({
    entityType: 'help',
    entityId,
    specs: LOCALIZABLE_FIELDS.help,
    baseValues,
    onBaseChange,
    enabled: localeStrings,
    locale,
  });
  const isBase = loc.isBase;
  const lock = !isBase;
  const baseLabel = t(locale, 'transadmin.baseLabel');
  const lockAttrs = lock ? { title: t(locale, 'loc.lockedFieldHint') } : {};

  function payload(): HelpTopicWriteInput {
    return {
      slug: form.slug.trim(),
      term: form.term.trim(),
      body: form.body,
      linkSlug: form.linkSlug.trim() || undefined,
    };
  }

  async function onSave(event: FormEvent) {
    event.preventDefault();
    if (!isBase) {
      await loc.saveActive();
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (isEdit && slug) {
        await helpAdminApi.update(slug, payload());
        setNotice(t(locale, 'hform.saved'));
      } else {
        const created = await helpAdminApi.create(payload());
        try {
          await loc.flushBuffered(created.id);
        } catch {
          // The base topic is saved; translations can be re-entered on the edit page.
        }
        window.location.href = localizedPath(
          locale,
          `/admin/help/${encodeURIComponent(created.slug)}/edit`,
        );
        return;
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const showLocaleBar =
    localeStrings && (loc.availableLocales.length > 1 || loc.addableLocales.length > 0);
  const bannerError = error ?? loc.error;
  const bannerNotice = notice ?? loc.notice;

  return (
    <div className="space-y-6">
      {bannerError ? (
        <p
          role="alert"
          className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          <Icon name="alert-triangle" className="size-4" />
          {bannerError}
        </p>
      ) : null}
      {bannerNotice ? (
        <p className="flex items-center gap-2 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
          <Icon name="circle-check" className="size-4" />
          {bannerNotice}
        </p>
      ) : null}

      {showLocaleBar ? (
        <LocaleBar
          locale={locale}
          available={loc.availableLocales}
          active={loc.activeLocale}
          onChange={loc.setActiveLocale}
          addable={loc.addableLocales}
          onAdd={loc.addLanguage}
          baseLocale={loc.baseLocale}
          statusOf={loc.status}
          completenessOf={loc.completeness}
        />
      ) : null}

      <form onSubmit={onSave} className="space-y-6">
        {/* The term reads as the document head (Notion-style), consistent with content/collections. */}
        <div className="space-y-1">
          <LocalizableField
            locale={locale}
            kind="plain"
            variant="head"
            isBase={isBase}
            value={loc.valueFor('term')}
            baseValue={loc.baseValueFor('term')}
            onChange={(v) => loc.setValueFor('term', v)}
            baseLabel={baseLabel}
            placeholder={t(locale, 'hform.termPlaceholder')}
            inputClassName="h-auto border-0 bg-transparent px-0 py-1 font-display text-3xl font-semibold tracking-tight shadow-none focus-visible:ring-0"
          />
        </div>

        {/* Metadata as a collapsible properties strip. */}
        <Accordion
          type="multiple"
          defaultValue={['properties']}
          className="rounded-lg border border-border"
        >
          <AccordionItem value="properties" className="border-b-0 px-4">
            <AccordionTrigger>{t(locale, 'hform.properties')}</AccordionTrigger>
            <AccordionContent className="text-foreground">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t(locale, 'hform.slugLabel')} htmlFor="hform-slug">
                  <Input
                    id="hform-slug"
                    value={form.slug}
                    readOnly={isEdit || lock}
                    onChange={(e) => set('slug', e.target.value)}
                    placeholder="cadence"
                    {...lockAttrs}
                  />
                </Field>
                <Field label={t(locale, 'hform.linkSlugLabel')} htmlFor="hform-linkSlug">
                  <Input
                    id="hform-linkSlug"
                    value={form.linkSlug}
                    readOnly={lock}
                    onChange={(e) => set('linkSlug', e.target.value)}
                    placeholder="omt-diatonic-chords"
                    {...lockAttrs}
                  />
                </Field>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Body (full-width). One editor, keyed by locale; the base body stays in `form.body`. */}
        {blockEditor ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">{t(locale, 'hform.bodyLabel')}</span>
              {preview && isBase ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-pressed={showPreview}
                  onClick={() => setShowPreview((v) => !v)}
                >
                  <Icon name={showPreview ? 'eye-off' : 'eye'} className="size-4" />
                  {showPreview ? t(locale, 'cform.hidePreview') : t(locale, 'cform.showPreview')}
                </Button>
              ) : null}
            </div>
            {loaded ? (
              <div className="space-y-2">
                {!isBase ? (
                  <div className="rounded-md border border-border bg-muted/40 p-2 text-sm">
                    <span className="mb-1 block text-xs font-medium text-muted-foreground">
                      {baseLabel}
                    </span>
                    <span className="block max-h-40 overflow-y-auto whitespace-pre-wrap break-words">
                      {loc.baseValueFor('body') || <span className="text-muted-foreground">—</span>}
                    </span>
                  </div>
                ) : null}
                <div className={showPreview && isBase ? 'grid gap-4 lg:grid-cols-2' : ''}>
                  <BlockEditor
                    key={`help-${loc.activeLocale}`}
                    profile="minimal"
                    locale={locale}
                    initialDoc={null}
                    initialBodyMdx={isBase ? form.body : loc.valueFor('body')}
                    initialEmbeds={[]}
                    onChange={(c) =>
                      isBase ? set('body', c.bodyMdx) : loc.setValueFor('body', c.bodyMdx)
                    }
                  />
                  {preview && showPreview && isBase ? (
                    <PreviewPane
                      slug={slug ?? 'new'}
                      locale={locale}
                      route="/admin/preview/help"
                      payload={{ term: form.term, body: form.body }}
                    />
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <LocalizableField
            locale={locale}
            kind="rich"
            isBase={isBase}
            blockEditor={false}
            label={t(locale, 'hform.bodyLabel')}
            remountKey={`help-${loc.activeLocale}`}
            value={isBase ? form.body : loc.valueFor('body')}
            baseValue={loc.baseValueFor('body')}
            onChange={(v) => (isBase ? set('body', v) : loc.setValueFor('body', v))}
            baseLabel={baseLabel}
          />
        )}

        <div className="flex flex-wrap gap-3 border-t border-border pt-4">
          {isBase ? (
            <>
              <Button type="submit" disabled={busy}>
                <Icon name="check" className="size-4" />
                {isEdit ? t(locale, 'hform.saveChanges') : t(locale, 'hform.create')}
              </Button>
              {isEdit && slug ? (
                <Button
                  type="button"
                  variant="destructive"
                  disabled={busy}
                  onClick={() => {
                    if (confirm(t(locale, 'hform.deleteConfirm'))) {
                      setBusy(true);
                      helpAdminApi
                        .remove(slug)
                        .then(() => {
                          window.location.href = localizedPath(locale, '/admin/help');
                        })
                        .catch((e: Error) => {
                          setError(e.message);
                          setBusy(false);
                        });
                    }
                  }}
                >
                  <Icon name="trash" className="size-4" />
                  {t(locale, 'hform.delete')}
                </Button>
              ) : null}
            </>
          ) : (
            <>
              <Button type="submit" disabled={loc.saving || !entityId}>
                <Icon name="check" className="size-4" />
                {t(locale, 'loc.saveTranslation')}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={loc.saving || !entityId}
                onClick={() => void loc.publishActive()}
              >
                {t(locale, 'loc.publishTranslation')}
              </Button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}
