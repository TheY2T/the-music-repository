import type { ContentWriteInput, MediaUploadRequestKind } from '@TheY2T/tmr-api-client';
import { type Locale, t } from '@TheY2T/tmr-i18n';
import { marked } from 'marked';
import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { adminApi, uploadToTicket } from '@/lib/admin-api';

const CONTENT_TYPES = [
  'lesson',
  'song',
  'score',
  'exercise',
  'technique',
  'backing_track',
  'tool_page',
] as const;
const VISIBILITIES = ['public', 'authed', 'premium'] as const;
const TAXONOMY_DIMS = ['genres', 'instruments', 'topics', 'tags'] as const;
type Dim = (typeof TAXONOMY_DIMS)[number];

/** Message keys for each displayed content-type label (values stay as enum codes). */
const TYPE_LABEL_KEYS = {
  lesson: 'cform.typeLesson',
  song: 'cform.typeSong',
  score: 'cform.typeScore',
  exercise: 'cform.typeExercise',
  technique: 'cform.typeTechnique',
  backing_track: 'cform.typeBackingTrack',
  tool_page: 'cform.typeToolPage',
} as const;

/** Message keys for each displayed visibility label (values stay as enum codes). */
const VISIBILITY_LABEL_KEYS = {
  public: 'cform.visibilityPublic',
  authed: 'cform.visibilityAuthed',
  premium: 'cform.visibilityPremium',
} as const;

/** Message keys for each taxonomy dimension label. */
const DIM_LABEL_KEYS = {
  genres: 'cform.dimGenres',
  instruments: 'cform.dimInstruments',
  topics: 'cform.dimTopics',
  tags: 'cform.dimTags',
} as const;

interface MediaRow {
  id: string;
  filename: string;
  kind: string;
  url: string;
}

const emptyForm = {
  slug: '',
  title: '',
  summary: '',
  bodyMdx: '',
  type: 'lesson' as ContentWriteInput['type'],
  visibility: 'public' as ContentWriteInput['visibility'],
  difficulty: '',
  source: '',
  attribution: '',
  license: '',
  genres: '',
  instruments: '',
  topics: '',
  tags: '',
};

/** Split a comma/space list into clean slug tokens. */
function toSlugs(value: string): string[] {
  return value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

export default function ContentForm({ slug, locale }: { slug?: string; locale: Locale }) {
  const isEdit = Boolean(slug);
  const [form, setForm] = useState({ ...emptyForm });
  const [media, setMedia] = useState<MediaRow[]>([]);
  const [options, setOptions] = useState<Record<Dim, string[]>>({
    genres: [],
    instruments: [],
    topics: [],
    tags: [],
  });
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Load taxonomy suggestions + (edit) the existing item.
  useEffect(() => {
    Promise.all(TAXONOMY_DIMS.map((d) => adminApi.listTaxonomy(d).catch(() => ({ items: [] }))))
      .then((lists) => {
        const next = {} as Record<Dim, string[]>;
        TAXONOMY_DIMS.forEach((d, i) => {
          next[d] = lists[i].items.map((t) => t.slug);
        });
        setOptions(next);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!slug) {
      return;
    }
    adminApi
      .get(slug)
      .then((c) => {
        setForm({
          slug: c.slug,
          title: c.title,
          summary: c.summary ?? '',
          bodyMdx: c.bodyMdx ?? '',
          type: c.type,
          visibility: c.visibility,
          difficulty: c.difficulty != null ? String(c.difficulty) : '',
          source: c.source ?? '',
          attribution: c.attribution ?? '',
          license: c.license ?? '',
          genres: c.genres.map((t) => t.slug).join(', '),
          instruments: c.instruments.map((t) => t.slug).join(', '),
          topics: c.topics.map((t) => t.slug).join(', '),
          tags: c.tags.map((t) => t.slug).join(', '),
        });
        setMedia(
          c.media.map((m) => ({ id: m.id, filename: m.filename, kind: m.kind, url: m.url })),
        );
      })
      .catch((e: Error) => setError(e.message));
  }, [slug]);

  const previewHtml = useMemo(
    () => marked.parse(form.bodyMdx || t(locale, 'cform.previewEmpty')) as string,
    [form.bodyMdx, locale],
  );

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function buildInput(): ContentWriteInput {
    const difficulty = form.difficulty.trim() ? Number(form.difficulty) : undefined;
    return {
      slug: form.slug.trim(),
      title: form.title.trim(),
      summary: form.summary.trim() || undefined,
      bodyMdx: form.bodyMdx || undefined,
      type: form.type,
      visibility: form.visibility,
      difficulty: Number.isFinite(difficulty) ? difficulty : undefined,
      source: form.source.trim() || undefined,
      attribution: form.attribution.trim() || undefined,
      license: form.license.trim() || undefined,
      genres: toSlugs(form.genres),
      instruments: toSlugs(form.instruments),
      topics: toSlugs(form.topics),
      tags: toSlugs(form.tags),
    };
  }

  async function onSave(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (isEdit && slug) {
        await adminApi.update(slug, buildInput());
        setNotice(t(locale, 'cform.noticeSaved'));
      } else {
        const created = await adminApi.create(buildInput());
        window.location.href = `/admin/content/${encodeURIComponent(created.slug)}/edit`;
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
        const fresh = await adminApi.get(slug);
        setMedia(
          fresh.media.map((m) => ({ id: m.id, filename: m.filename, kind: m.kind, url: m.url })),
        );
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function onUpload(file: File) {
    if (!slug) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const kind: MediaUploadRequestKind = file.type.includes('pdf')
        ? 'score_pdf'
        : file.type.startsWith('audio')
          ? 'audio'
          : file.type.startsWith('image')
            ? 'image'
            : 'score_pdf';
      const ticket = await adminApi.requestMedia(slug, {
        filename: file.name,
        mime: file.type || 'application/octet-stream',
        kind,
      });
      await uploadToTicket(ticket, file);
      const fresh = await adminApi.get(slug);
      setMedia(
        fresh.media.map((m) => ({ id: m.id, filename: m.filename, kind: m.kind, url: m.url })),
      );
      setNotice(t(locale, 'cform.noticeUploaded', { filename: file.name }));
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

      <form onSubmit={onSave} className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <Field label={t(locale, 'cform.slug')}>
            <input
              className={inputClass}
              value={form.slug}
              readOnly={isEdit}
              onChange={(e) => set('slug', e.target.value)}
              placeholder={t(locale, 'cform.slugPlaceholder')}
            />
          </Field>
          <Field label={t(locale, 'cform.title')}>
            <input
              className={inputClass}
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
            />
          </Field>
          <Field label={t(locale, 'cform.summary')}>
            <input
              className={inputClass}
              value={form.summary}
              onChange={(e) => set('summary', e.target.value)}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t(locale, 'cform.type')}>
              <select
                className={inputClass}
                value={form.type}
                onChange={(e) => set('type', e.target.value as ContentWriteInput['type'])}
              >
                {CONTENT_TYPES.map((code) => (
                  <option key={code} value={code}>
                    {t(locale, TYPE_LABEL_KEYS[code])}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t(locale, 'cform.visibility')}>
              <select
                className={inputClass}
                value={form.visibility}
                onChange={(e) =>
                  set('visibility', e.target.value as ContentWriteInput['visibility'])
                }
              >
                {VISIBILITIES.map((v) => (
                  <option key={v} value={v}>
                    {t(locale, VISIBILITY_LABEL_KEYS[v])}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label={t(locale, 'cform.difficulty')}>
            <input
              type="number"
              min={1}
              max={10}
              className={inputClass}
              value={form.difficulty}
              onChange={(e) => set('difficulty', e.target.value)}
            />
          </Field>
          {TAXONOMY_DIMS.map((dim) => (
            <Field
              key={dim}
              label={t(locale, 'cform.taxonomyLabel', { dim: t(locale, DIM_LABEL_KEYS[dim]) })}
            >
              <input
                className={inputClass}
                list={`opts-${dim}`}
                value={form[dim]}
                onChange={(e) => set(dim, e.target.value)}
              />
              <datalist id={`opts-${dim}`}>
                {options[dim].map((o) => (
                  <option key={o} value={o} />
                ))}
              </datalist>
            </Field>
          ))}
          <div className="grid grid-cols-2 gap-3">
            <Field label={t(locale, 'cform.attribution')}>
              <input
                className={inputClass}
                value={form.attribution}
                onChange={(e) => set('attribution', e.target.value)}
              />
            </Field>
            <Field label={t(locale, 'cform.license')}>
              <input
                className={inputClass}
                value={form.license}
                onChange={(e) => set('license', e.target.value)}
              />
            </Field>
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-sm font-medium">{t(locale, 'cform.body')}</span>
          <textarea
            className={`${inputClass} h-64 font-mono`}
            value={form.bodyMdx}
            onChange={(e) => set('bodyMdx', e.target.value)}
          />
          <span className="text-sm font-medium">{t(locale, 'cform.preview')}</span>
          {/* biome-ignore lint/security/noDangerouslySetInnerHtml: admin-authored markdown preview. */}
          <div
            className="prose prose-sm max-w-none rounded-md border p-3 dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </div>

        <div className="md:col-span-2 flex flex-wrap gap-3 border-t pt-4">
          <Button type="submit" disabled={busy}>
            {isEdit ? t(locale, 'cform.saveChanges') : t(locale, 'cform.create')}
          </Button>
          {isEdit && slug ? (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() =>
                  act(() => adminApi.publish(slug), t(locale, 'cform.noticePublished'))
                }
              >
                {t(locale, 'cform.publish')}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() =>
                  act(() => adminApi.unpublish(slug), t(locale, 'cform.noticeUnpublished'))
                }
              >
                {t(locale, 'cform.unpublish')}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => {
                  if (confirm(t(locale, 'cform.confirmDelete'))) {
                    act(() => adminApi.remove(slug), t(locale, 'cform.noticeDeleted')).then(() => {
                      window.location.href = '/admin';
                    });
                  }
                }}
              >
                {t(locale, 'cform.delete')}
              </Button>
            </>
          ) : null}
        </div>
      </form>

      {isEdit && slug ? (
        <section className="space-y-3 border-t pt-4">
          <h2 className="text-lg font-medium">{t(locale, 'cform.media')}</h2>
          <input
            type="file"
            className="text-sm"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                onUpload(file);
              }
              e.target.value = '';
            }}
          />
          {media.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t(locale, 'cform.noMedia')}</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {media.map((m) => (
                <li key={m.id}>
                  <a href={m.url} target="_blank" rel="noreferrer" className="underline">
                    {m.filename}
                  </a>{' '}
                  <span className="text-muted-foreground">({m.kind})</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: the control is passed in as `children`.
    <label className="block space-y-1">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}
