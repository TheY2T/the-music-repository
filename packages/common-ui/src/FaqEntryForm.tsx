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
import { LOCALIZABLE_FIELDS } from '@TheY2T/tmr-web-acl/content-translations-api';
import type { FaqEntryWriteInput } from '@TheY2T/tmr-web-acl/dto';
import { faqAdminApi, getFaqEntry } from '@TheY2T/tmr-web-acl/faq-api';
import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { BlockEditor } from './admin/block-editor/BlockEditor';
import { LocaleBar } from './localization/LocaleBar';
import { LocalizableField } from './localization/LocalizableField';
import { useLocaleContent } from './localization/useLocaleContent';

const emptyForm = { slug: '', question: '', answer: '', category: '', sortOrder: 0 };

export default function FaqEntryForm({
  slug,
  locale,
  blockEditor = false,
  localeStrings = false,
}: {
  slug?: string;
  locale: Locale;
  /** Use the minimal block editor for the answer (ADR 0030) instead of the Markdown textarea. */
  blockEditor?: boolean;
  /** When true, enable the per-locale content localization switcher (ADR 0034). */
  localeStrings?: boolean;
}) {
  const isEdit = Boolean(slug);
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
    getFaqEntry(slug).then((entry) => {
      if (entry) {
        setEntityId(entry.id);
        setForm({
          slug: entry.slug,
          question: entry.question,
          answer: entry.answer,
          category: entry.category,
          sortOrder: entry.sortOrder,
        });
      }
      setLoaded(true);
    });
  }, [slug]);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const baseValues = useMemo(
    () => ({ question: form.question, answer: form.answer }),
    [form.question, form.answer],
  );
  const onBaseChange = useCallback((field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const loc = useLocaleContent({
    entityType: 'faq',
    entityId,
    specs: LOCALIZABLE_FIELDS.faq,
    baseValues,
    onBaseChange,
    enabled: localeStrings,
    locale,
  });
  const isBase = loc.isBase;
  const lock = !isBase;
  const baseLabel = t(locale, 'transadmin.baseLabel');
  const lockAttrs = lock ? { title: t(locale, 'loc.lockedFieldHint') } : {};

  function payload(): FaqEntryWriteInput {
    return {
      slug: form.slug.trim(),
      question: form.question.trim(),
      answer: form.answer,
      category: form.category.trim(),
      sortOrder: Number.isFinite(form.sortOrder) ? form.sortOrder : 0,
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
        await faqAdminApi.update(slug, payload());
        setNotice(t(locale, 'faqform.saved'));
      } else {
        const created = await faqAdminApi.create(payload());
        try {
          await loc.flushBuffered(created.id);
        } catch {
          // The base entry is saved; translations can be re-entered on the edit page.
        }
        window.location.href = localizedPath(
          locale,
          `/admin/faq/${encodeURIComponent(created.slug)}/edit`,
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
        {/* The question reads as the document head (Notion-style), consistent with the other editors. */}
        <div className="space-y-1">
          <LocalizableField
            locale={locale}
            kind="plain"
            variant="head"
            isBase={isBase}
            value={loc.valueFor('question')}
            baseValue={loc.baseValueFor('question')}
            onChange={(v) => loc.setValueFor('question', v)}
            baseLabel={baseLabel}
            placeholder={t(locale, 'faqform.questionPlaceholder')}
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
            <AccordionTrigger>{t(locale, 'faqform.properties')}</AccordionTrigger>
            <AccordionContent className="text-foreground">
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label={t(locale, 'faqform.slugLabel')} htmlFor="faqform-slug">
                  <Input
                    id="faqform-slug"
                    value={form.slug}
                    readOnly={isEdit || lock}
                    onChange={(e) => set('slug', e.target.value)}
                    placeholder="is-it-free"
                    {...lockAttrs}
                  />
                </Field>
                <Field label={t(locale, 'faqform.categoryLabel')} htmlFor="faqform-category">
                  <Input
                    id="faqform-category"
                    value={form.category}
                    readOnly={lock}
                    onChange={(e) => set('category', e.target.value)}
                    placeholder={t(locale, 'faqform.categoryPlaceholder')}
                    list="faqform-categories"
                    {...lockAttrs}
                  />
                  <datalist id="faqform-categories">
                    <option value="Getting started" />
                    <option value="Learning & practice" />
                    <option value="Interactive tools" />
                    <option value="Content & licensing" />
                  </datalist>
                </Field>
                <Field label={t(locale, 'faqform.orderLabel')} htmlFor="faqform-order">
                  <Input
                    id="faqform-order"
                    type="number"
                    value={String(form.sortOrder)}
                    readOnly={lock}
                    onChange={(e) => set('sortOrder', Number(e.target.value))}
                    {...lockAttrs}
                  />
                </Field>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Answer (full-width). One editor, keyed by locale; the base answer stays in `form.answer`. */}
        {blockEditor ? (
          <div className="space-y-2">
            <span className="text-sm font-medium">{t(locale, 'faqform.answerLabel')}</span>
            {loaded ? (
              <div className="space-y-2">
                {!isBase ? (
                  <div className="rounded-md border border-border bg-muted/40 p-2 text-sm">
                    <span className="mb-1 block text-xs font-medium text-muted-foreground">
                      {baseLabel}
                    </span>
                    <span className="block max-h-40 overflow-y-auto whitespace-pre-wrap break-words">
                      {loc.baseValueFor('answer') || (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </span>
                  </div>
                ) : null}
                <BlockEditor
                  key={`faq-${loc.activeLocale}`}
                  profile="minimal"
                  locale={locale}
                  initialDoc={null}
                  initialBodyMdx={isBase ? form.answer : loc.valueFor('answer')}
                  initialEmbeds={[]}
                  onChange={(c) =>
                    isBase ? set('answer', c.bodyMdx) : loc.setValueFor('answer', c.bodyMdx)
                  }
                />
              </div>
            ) : null}
          </div>
        ) : (
          <LocalizableField
            locale={locale}
            kind="rich"
            isBase={isBase}
            blockEditor={false}
            label={t(locale, 'faqform.answerLabel')}
            remountKey={`faq-${loc.activeLocale}`}
            value={isBase ? form.answer : loc.valueFor('answer')}
            baseValue={loc.baseValueFor('answer')}
            onChange={(v) => (isBase ? set('answer', v) : loc.setValueFor('answer', v))}
            baseLabel={baseLabel}
          />
        )}

        <div className="flex flex-wrap gap-3 border-t border-border pt-4">
          {isBase ? (
            <>
              <Button type="submit" disabled={busy}>
                <Icon name="check" className="size-4" />
                {isEdit ? t(locale, 'faqform.saveChanges') : t(locale, 'faqform.create')}
              </Button>
              {isEdit && slug ? (
                <Button
                  type="button"
                  variant="destructive"
                  disabled={busy}
                  onClick={() => {
                    if (confirm(t(locale, 'faqform.deleteConfirm'))) {
                      setBusy(true);
                      faqAdminApi
                        .remove(slug)
                        .then(() => {
                          window.location.href = localizedPath(locale, '/admin/faq');
                        })
                        .catch((e: Error) => {
                          setError(e.message);
                          setBusy(false);
                        });
                    }
                  }}
                >
                  <Icon name="trash" className="size-4" />
                  {t(locale, 'faqform.delete')}
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
