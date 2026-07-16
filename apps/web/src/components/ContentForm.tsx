import type { ContentWriteInput, MediaUploadRequestKind } from '@TheY2T/tmr-api-client';
import type { EmbedConfig, PMDoc } from '@TheY2T/tmr-content-serde';
import { type Locale, t } from '@TheY2T/tmr-i18n';
import { Button, Card, Field, Icon, Input, Select, Textarea } from '@TheY2T/tmr-ui';
import { marked } from 'marked';
import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { BlockEditor, type BlockEditorChange } from '@/components/admin/block-editor/BlockEditor';
import { PreviewPane } from '@/components/admin/block-editor/PreviewPane';
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
  tier: '',
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

export default function ContentForm({
  slug,
  locale,
  blockEditor = false,
  preview = false,
  interactive = false,
}: {
  slug?: string;
  locale: Locale;
  /** When true, use the WYSIWYG block editor for the body instead of the Markdown textarea (ADR 0030). */
  blockEditor?: boolean;
  /** When true (+ blockEditor), show the side-by-side live iframe preview. */
  preview?: boolean;
  /** Whether embedded tools render interactively in the editor (mirrors learning.interactive-scores). */
  interactive?: boolean;
}) {
  const isEdit = Boolean(slug);
  const [form, setForm] = useState({ ...emptyForm });
  const [media, setMedia] = useState<MediaRow[]>([]);
  // Block-editor state: the body doc is ready to mount once loaded (immediately for new items), and its
  // latest derived output (body_mdx + embeds + body_doc) is captured here for the save payload.
  const [loaded, setLoaded] = useState(!isEdit);
  const [loadedEmbeds, setLoadedEmbeds] = useState<EmbedConfig[]>([]);
  const [editorOut, setEditorOut] = useState<BlockEditorChange | null>(null);
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
          tier: c.tier ?? '',
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
        setLoadedEmbeds((c.embeds ?? []) as EmbedConfig[]);
        setLoaded(true);
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
    // Block editor: persist the canonical doc + its derived body_mdx/embeds. Legacy textarea: raw body.
    const useEditor = blockEditor && editorOut !== null;
    const bodyMdx = useEditor ? editorOut.bodyMdx : form.bodyMdx;
    return {
      slug: form.slug.trim(),
      title: form.title.trim(),
      summary: form.summary.trim() || undefined,
      bodyMdx: bodyMdx || undefined,
      type: form.type,
      visibility: form.visibility,
      tier: form.visibility === 'premium' ? form.tier.trim() || undefined : undefined,
      difficulty: Number.isFinite(difficulty) ? difficulty : undefined,
      source: form.source.trim() || undefined,
      attribution: form.attribution.trim() || undefined,
      license: form.license.trim() || undefined,
      genres: toSlugs(form.genres),
      instruments: toSlugs(form.instruments),
      topics: toSlugs(form.topics),
      tags: toSlugs(form.tags),
      // Cast at the serde↔DTO boundary: both describe the same ContentEmbed / ProseMirror shapes.
      ...(useEditor
        ? {
            embeds: editorOut.embeds as ContentWriteInput['embeds'],
            bodyDoc: editorOut.doc as unknown as ContentWriteInput['bodyDoc'],
          }
        : {}),
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

      <form onSubmit={onSave} className="grid gap-6 md:grid-cols-2">
        <Card className="space-y-4 p-5">
          <h2 className="font-display text-lg font-semibold tracking-tight">
            {t(locale, 'cform.sectionDetails')}
          </h2>
          <Field label={t(locale, 'cform.slug')} htmlFor="cform-slug">
            <Input
              id="cform-slug"
              value={form.slug}
              readOnly={isEdit}
              onChange={(e) => set('slug', e.target.value)}
              placeholder={t(locale, 'cform.slugPlaceholder')}
            />
          </Field>
          <Field label={t(locale, 'cform.title')} htmlFor="cform-title">
            <Input
              id="cform-title"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
            />
          </Field>
          <Field label={t(locale, 'cform.summary')} htmlFor="cform-summary">
            <Input
              id="cform-summary"
              value={form.summary}
              onChange={(e) => set('summary', e.target.value)}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t(locale, 'cform.type')} htmlFor="cform-type">
              <Select
                id="cform-type"
                value={form.type}
                onChange={(e) => set('type', e.target.value as ContentWriteInput['type'])}
              >
                {CONTENT_TYPES.map((code) => (
                  <option key={code} value={code}>
                    {t(locale, TYPE_LABEL_KEYS[code])}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t(locale, 'cform.visibility')} htmlFor="cform-visibility">
              <Select
                id="cform-visibility"
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
              </Select>
            </Field>
          </div>
          {form.visibility === 'premium' ? (
            <Field label={t(locale, 'cform.tier')} htmlFor="cform-tier">
              <Select
                id="cform-tier"
                value={form.tier}
                onChange={(e) => set('tier', e.target.value)}
              >
                <option value="premium">{t(locale, 'cform.tierPremium')}</option>
                <option value="pro">{t(locale, 'cform.tierPro')}</option>
              </Select>
            </Field>
          ) : null}
          <Field label={t(locale, 'cform.difficulty')} htmlFor="cform-difficulty">
            <Input
              id="cform-difficulty"
              type="number"
              min={1}
              max={10}
              value={form.difficulty}
              onChange={(e) => set('difficulty', e.target.value)}
            />
          </Field>
          {TAXONOMY_DIMS.map((dim) => (
            <Field
              key={dim}
              label={t(locale, 'cform.taxonomyLabel', { dim: t(locale, DIM_LABEL_KEYS[dim]) })}
              htmlFor={`cform-${dim}`}
            >
              <Input
                id={`cform-${dim}`}
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
            <Field label={t(locale, 'cform.attribution')} htmlFor="cform-attribution">
              <Input
                id="cform-attribution"
                value={form.attribution}
                onChange={(e) => set('attribution', e.target.value)}
              />
            </Field>
            <Field label={t(locale, 'cform.license')} htmlFor="cform-license">
              <Input
                id="cform-license"
                value={form.license}
                onChange={(e) => set('license', e.target.value)}
              />
            </Field>
          </div>
        </Card>

        {blockEditor ? (
          <div className="md:col-span-2 space-y-1.5">
            <span className="text-sm font-medium">{t(locale, 'cform.bodyEditor')}</span>
            <div className={preview ? 'grid gap-4 lg:grid-cols-2' : ''}>
              {loaded ? (
                <BlockEditor
                  key={slug ?? 'new'}
                  locale={locale}
                  interactive={interactive}
                  initialDoc={null}
                  initialBodyMdx={form.bodyMdx}
                  initialEmbeds={loadedEmbeds}
                  onChange={setEditorOut}
                />
              ) : null}
              {preview ? (
                <PreviewPane
                  slug={slug ?? 'new'}
                  locale={locale}
                  payload={{
                    title: form.title,
                    summary: form.summary || undefined,
                    bodyMdx: editorOut?.bodyMdx ?? '',
                    embeds: editorOut?.embeds ?? [],
                  }}
                />
              ) : null}
            </div>
          </div>
        ) : (
          <Card className="flex flex-col gap-3 p-5">
            <Field label={t(locale, 'cform.body')} htmlFor="cform-body">
              <Textarea
                id="cform-body"
                className="h-64 font-mono"
                value={form.bodyMdx}
                onChange={(e) => set('bodyMdx', e.target.value)}
              />
            </Field>
            <div className="space-y-1.5">
              <span className="text-sm font-medium">{t(locale, 'cform.preview')}</span>
              {/* biome-ignore lint/security/noDangerouslySetInnerHtml: admin-authored markdown preview. */}
              <div
                className="prose prose-sm max-w-none rounded-md border border-border bg-muted/20 p-3 dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>
          </Card>
        )}

        <div className="md:col-span-2 flex flex-wrap gap-3">
          <Button type="submit" disabled={busy}>
            <Icon name="check" className="size-4" />
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
                variant="destructive"
                disabled={busy}
                onClick={() => {
                  if (confirm(t(locale, 'cform.confirmDelete'))) {
                    act(() => adminApi.remove(slug), t(locale, 'cform.noticeDeleted')).then(() => {
                      window.location.href = '/admin';
                    });
                  }
                }}
              >
                <Icon name="trash" className="size-4" />
                {t(locale, 'cform.delete')}
              </Button>
            </>
          ) : null}
        </div>
      </form>

      {isEdit && slug ? (
        <Card className="space-y-3 p-5">
          <h2 className="font-display text-lg font-semibold tracking-tight">
            {t(locale, 'cform.media')}
          </h2>
          <input
            type="file"
            className="text-sm text-muted-foreground file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-accent/15 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-accent hover:file:bg-accent/25"
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
            <ul className="space-y-1.5 text-sm">
              {media.map((m) => (
                <li key={m.id} className="flex items-center gap-2">
                  <Icon name="external-link" className="size-4 text-muted-foreground" />
                  <a
                    href={m.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-foreground underline-offset-4 hover:text-accent hover:underline"
                  >
                    {m.filename}
                  </a>
                  <span className="text-muted-foreground">({m.kind})</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      ) : null}
    </div>
  );
}
