import type { HelpTopicWriteInput } from '@TheY2T/tmr-api-client';
import { type Locale, localizedPath, t } from '@TheY2T/tmr-i18n';
import { Button, Field, Input, Textarea } from '@TheY2T/tmr-ui';
import { type FormEvent, useEffect, useState } from 'react';
import { getHelpTopic, helpAdminApi } from '@/lib/help-api';

const emptyForm = { slug: '', term: '', body: '', linkSlug: '' };

export default function HelpTopicForm({ slug, locale }: { slug?: string; locale: Locale }) {
  const isEdit = Boolean(slug);
  const [form, setForm] = useState({ ...emptyForm });
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
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className="rounded-md bg-green-100 px-3 py-2 text-sm text-green-800 dark:bg-green-900 dark:text-green-100">
          {notice}
        </p>
      ) : null}

      <form onSubmit={onSave} className="space-y-4">
        <Field label={t(locale, 'hform.slugLabel')} htmlFor="hform-slug">
          <Input
            id="hform-slug"
            value={form.slug}
            readOnly={isEdit}
            onChange={(e) => set('slug', e.target.value)}
            placeholder="cadence"
          />
        </Field>
        <Field label={t(locale, 'hform.termLabel')} htmlFor="hform-term">
          <Input id="hform-term" value={form.term} onChange={(e) => set('term', e.target.value)} />
        </Field>
        <Field label={t(locale, 'hform.bodyLabel')} htmlFor="hform-body">
          <Textarea
            id="hform-body"
            className="h-32"
            value={form.body}
            onChange={(e) => set('body', e.target.value)}
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

        <div className="flex flex-wrap gap-3 border-t pt-4">
          <Button type="submit" disabled={busy}>
            {isEdit ? t(locale, 'hform.saveChanges') : t(locale, 'hform.create')}
          </Button>
          {isEdit && slug ? (
            <Button
              type="button"
              variant="outline"
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
              {t(locale, 'hform.delete')}
            </Button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
