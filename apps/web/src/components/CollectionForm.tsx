import type { CollectionWriteInput } from '@TheY2T/tmr-api-client';
import { type Locale, localizedPath, t } from '@TheY2T/tmr-i18n';
import { type FormEvent, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { collectionsAdminApi } from '@/lib/admin-api';

const KINDS = ['course', 'path', 'syllabus', 'songlist'] as const;

const emptyForm = {
  slug: '',
  title: '',
  summary: '',
  kind: 'course' as CollectionWriteInput['kind'],
  items: '', // newline-separated content slugs
};

export default function CollectionForm({ slug, locale }: { slug?: string; locale: Locale }) {
  const isEdit = Boolean(slug);
  const [form, setForm] = useState({ ...emptyForm });
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!slug) {
      return;
    }
    collectionsAdminApi
      .get(slug)
      .then((c) => {
        setForm({
          slug: c.slug,
          title: c.title,
          summary: c.summary ?? '',
          kind: c.kind,
          items: c.items.map((e) => e.content.slug).join('\n'),
        });
        setStatus(c.status);
      })
      .catch((e: Error) => setError(e.message));
  }, [slug]);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function meta(): CollectionWriteInput {
    return {
      slug: form.slug.trim(),
      title: form.title.trim(),
      summary: form.summary.trim() || undefined,
      kind: form.kind,
      visibility: 'public',
    };
  }

  function itemSlugs(): string[] {
    return form.items
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  async function onSave(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (isEdit && slug) {
        await collectionsAdminApi.update(slug, meta());
        await collectionsAdminApi.setItems(slug, itemSlugs());
        setNotice(t(locale, 'colform.savedNotice'));
      } else {
        const created = await collectionsAdminApi.create(meta());
        await collectionsAdminApi.setItems(created.slug, itemSlugs());
        window.location.href = localizedPath(
          locale,
          `/admin/collections/${encodeURIComponent(created.slug)}/edit`,
        );
        return;
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function act(fn: () => Promise<unknown>, done: string) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await fn();
      setNotice(done);
      if (slug) {
        setStatus((await collectionsAdminApi.get(slug)).status);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const inputClass = 'w-full rounded-md border border-input bg-background px-3 py-2 text-sm';

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
      {status ? (
        <p className="text-sm text-muted-foreground">
          {t(locale, 'colform.statusLabel', { status })}
        </p>
      ) : null}

      <form onSubmit={onSave} className="space-y-4">
        <label className="block space-y-1">
          <span className="text-sm font-medium">{t(locale, 'colform.slug')}</span>
          <input
            className={inputClass}
            value={form.slug}
            readOnly={isEdit}
            onChange={(e) => set('slug', e.target.value)}
            placeholder="beginner-piano-path"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">{t(locale, 'colform.title')}</span>
          <input
            className={inputClass}
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">{t(locale, 'colform.summary')}</span>
          <input
            className={inputClass}
            value={form.summary}
            onChange={(e) => set('summary', e.target.value)}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">{t(locale, 'colform.kind')}</span>
          <select
            className={inputClass}
            value={form.kind}
            onChange={(e) => set('kind', e.target.value as CollectionWriteInput['kind'])}
          >
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">{t(locale, 'colform.itemsHelp')}</span>
          <textarea
            className={`${inputClass} h-40 font-mono`}
            value={form.items}
            onChange={(e) => set('items', e.target.value)}
            placeholder={'c-major-scale-two-octaves\nczerny-op-599-no-1'}
          />
        </label>

        <div className="flex flex-wrap gap-3 border-t pt-4">
          <Button type="submit" disabled={busy}>
            {isEdit ? t(locale, 'colform.saveChanges') : t(locale, 'colform.create')}
          </Button>
          {isEdit && slug ? (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() =>
                  act(() => collectionsAdminApi.publish(slug), t(locale, 'colform.publishedNotice'))
                }
              >
                {t(locale, 'colform.publish')}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() =>
                  act(
                    () => collectionsAdminApi.unpublish(slug),
                    t(locale, 'colform.unpublishedNotice'),
                  )
                }
              >
                {t(locale, 'colform.unpublish')}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => {
                  if (confirm(t(locale, 'colform.confirmDelete'))) {
                    act(
                      () => collectionsAdminApi.remove(slug),
                      t(locale, 'colform.deletedNotice'),
                    ).then(() => {
                      window.location.href = localizedPath(locale, '/admin/collections');
                    });
                  }
                }}
              >
                {t(locale, 'colform.delete')}
              </Button>
            </>
          ) : null}
        </div>
      </form>
    </div>
  );
}
