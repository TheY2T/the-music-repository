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
  Textarea,
} from '@TheY2T/tmr-ui';
import { type FormEvent, useEffect, useState } from 'react';
import { BlockEditor } from '@/components/admin/block-editor/BlockEditor';
import { getHelpTopic, helpAdminApi } from '@/lib/help-api';

const emptyForm = { slug: '', term: '', body: '', linkSlug: '' };

export default function HelpTopicForm({
  slug,
  locale,
  blockEditor = false,
}: {
  slug?: string;
  locale: Locale;
  /** Use the minimal block editor for the body (ADR 0030) instead of the Markdown textarea. */
  blockEditor?: boolean;
}) {
  const isEdit = Boolean(slug);
  const [form, setForm] = useState({ ...emptyForm });
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
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (isEdit && slug) {
        await helpAdminApi.update(slug, payload());
        setNotice(t(locale, 'hform.saved'));
      } else {
        const created = await helpAdminApi.create(payload());
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

      <form onSubmit={onSave} className="space-y-6">
        {/* The term reads as the document head (Notion-style), consistent with content/collections. */}
        <div className="space-y-1">
          <Input
            aria-label={t(locale, 'hform.termLabel')}
            value={form.term}
            onChange={(e) => set('term', e.target.value)}
            placeholder={t(locale, 'hform.termPlaceholder')}
            className="h-auto border-0 bg-transparent px-0 py-1 font-display text-3xl font-semibold tracking-tight shadow-none focus-visible:ring-0"
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
                    readOnly={isEdit}
                    onChange={(e) => set('slug', e.target.value)}
                    placeholder="cadence"
                  />
                </Field>
                <Field label={t(locale, 'hform.linkSlugLabel')} htmlFor="hform-linkSlug">
                  <Input
                    id="hform-linkSlug"
                    value={form.linkSlug}
                    onChange={(e) => set('linkSlug', e.target.value)}
                    placeholder="omt-diatonic-chords"
                  />
                </Field>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Body (full-width). */}
        {blockEditor ? (
          <div className="space-y-2">
            <span className="text-sm font-medium">{t(locale, 'hform.bodyLabel')}</span>
            {loaded ? (
              <BlockEditor
                key={slug ?? 'new'}
                profile="minimal"
                locale={locale}
                initialDoc={null}
                initialBodyMdx={form.body}
                initialEmbeds={[]}
                onChange={(c) => set('body', c.bodyMdx)}
              />
            ) : null}
          </div>
        ) : (
          <Field label={t(locale, 'hform.bodyLabel')} htmlFor="hform-body">
            <Textarea
              id="hform-body"
              className="h-32"
              value={form.body}
              onChange={(e) => set('body', e.target.value)}
            />
          </Field>
        )}

        <div className="flex flex-wrap gap-3 border-t border-border pt-4">
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
        </div>
      </form>
    </div>
  );
}
