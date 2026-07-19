import type { ContentWriteInput, MediaUploadRequestKind } from '@TheY2T/tmr-api-client';
import type { EmbedConfig } from '@TheY2T/tmr-content-serde';
import { type Locale, type MessageKey, t } from '@TheY2T/tmr-i18n';
import AlphaTexScore from '@TheY2T/tmr-musickit-ui/score/AlphaTexScore';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
  Field,
  Icon,
  Input,
  Select,
  Textarea,
} from '@TheY2T/tmr-ui';
import { adminApi, uploadToTicket } from '@TheY2T/tmr-web-data/admin-api';
import { LOCALIZABLE_FIELDS } from '@TheY2T/tmr-web-data/content-translations-api';
import { marked } from 'marked';
import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BlockEditor, type BlockEditorChange } from './admin/block-editor/BlockEditor';
import { PreviewPane } from './admin/block-editor/PreviewPane';
import { RevisionsPanel } from './admin/RevisionsPanel';
import { LocaleBar } from './localization/LocaleBar';
import { LocalizableField } from './localization/LocalizableField';
import { useLocaleContent } from './localization/useLocaleContent';

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

/** The `details` facts, editable in the properties strip and translatable per-locale (`details.<fact>`). */
const FACTS = [
  { key: 'key', labelKey: 'cform.factKey' },
  { key: 'era', labelKey: 'cform.factEra' },
  { key: 'form', labelKey: 'cform.factForm' },
  { key: 'timeSignature', labelKey: 'cform.factTimeSignature' },
  { key: 'composer', labelKey: 'cform.factComposer' },
  { key: 'composerDates', labelKey: 'cform.factComposerDates' },
  { key: 'composedYear', labelKey: 'cform.factComposedYear' },
] as const satisfies readonly { key: string; labelKey: MessageKey }[];

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
  key: '',
  era: '',
  form: '',
  timeSignature: '',
  composer: '',
  composerDates: '',
  composedYear: '',
};
type FormState = typeof emptyForm;

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
  revisions = false,
  interactive = false,
  localeStrings = false,
}: {
  slug?: string;
  locale: Locale;
  /** When true, use the WYSIWYG block editor for the body instead of the Markdown textarea (ADR 0030). */
  blockEditor?: boolean;
  /** When true (+ blockEditor), show the side-by-side live iframe preview. */
  preview?: boolean;
  /** When true (+ edit mode), autosave drafts + show the version-history panel. */
  revisions?: boolean;
  /** Whether embedded tools render interactively in the editor (mirrors learning.interactive-scores). */
  interactive?: boolean;
  /** When true, enable the per-locale content localization switcher (ADR 0034). */
  localeStrings?: boolean;
}) {
  const isEdit = Boolean(slug);
  const [form, setForm] = useState<FormState>({ ...emptyForm });
  const [entityId, setEntityId] = useState<string | null>(null);
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
  // Bumped after a revision restore to remount the editor with the reloaded content.
  const [reloadKey, setReloadKey] = useState(0);
  // Standalone-score editor (type === 'score'): alphaTex source, loaded from the alphatex media asset.
  const [scoreTex, setScoreTex] = useState('');
  const [autosave, setAutosave] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  // The WYSIWYG editor is already a faithful render, so the side-by-side preview is opt-in.
  const [showPreview, setShowPreview] = useState(false);
  const autosaveArmed = useRef(false);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setField = useCallback((key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  // The live base (English) value of each localizable field — the source stays in `form`/editor state.
  const baseValues = useMemo(() => {
    const values: Record<string, string> = {
      title: form.title,
      summary: form.summary,
      bodyMdx: blockEditor && editorOut ? editorOut.bodyMdx : form.bodyMdx,
    };
    for (const fact of FACTS) {
      values[`details.${fact.key}`] = form[fact.key as keyof FormState] as string;
    }
    return values;
  }, [form, editorOut, blockEditor]);

  const onBaseChange = useCallback(
    (field: string, value: string) => {
      if (field.startsWith('details.')) {
        setField(field.slice('details.'.length), value);
      } else {
        setField(field, value);
      }
    },
    [setField],
  );

  const loc = useLocaleContent({
    entityType: 'content',
    entityId,
    specs: LOCALIZABLE_FIELDS.content,
    baseValues,
    onBaseChange,
    enabled: localeStrings,
    locale,
  });
  const isBase = loc.isBase;
  const lock = !isBase;
  const baseLabel = t(locale, 'transadmin.baseLabel');

  // Load taxonomy suggestions + (edit) the existing item.
  useEffect(() => {
    Promise.all(TAXONOMY_DIMS.map((d) => adminApi.listTaxonomy(d).catch(() => ({ items: [] }))))
      .then((lists) => {
        const next = {} as Record<Dim, string[]>;
        TAXONOMY_DIMS.forEach((d, i) => {
          next[d] = lists[i].items.map((tax) => tax.slug);
        });
        setOptions(next);
      })
      .catch(() => {});
  }, []);

  const loadItem = useCallback((s: string) => {
    adminApi
      .get(s)
      .then((c) => {
        const details = c.details ?? {};
        setEntityId(c.id);
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
          genres: c.genres.map((tax) => tax.slug).join(', '),
          instruments: c.instruments.map((tax) => tax.slug).join(', '),
          topics: c.topics.map((tax) => tax.slug).join(', '),
          tags: c.tags.map((tax) => tax.slug).join(', '),
          key: details.key ?? '',
          era: details.era ?? '',
          form: details.form ?? '',
          timeSignature: details.timeSignature ?? '',
          composer: details.composer ?? '',
          composerDates: details.composerDates ?? '',
          composedYear: details.composedYear ?? '',
        });
        setMedia(
          c.media.map((m) => ({ id: m.id, filename: m.filename, kind: m.kind, url: m.url })),
        );
        setLoadedEmbeds((c.embeds ?? []) as EmbedConfig[]);
        setLoaded(true);
        // Standalone score: pull the alphaTex text from its media asset so it can be edited.
        const alphatex = c.media.find((m) => m.kind === 'alphatex');
        if (alphatex) {
          fetch(alphatex.url)
            .then((r) => (r.ok ? r.text() : ''))
            .then((tex) => setScoreTex(tex))
            .catch(() => {});
        }
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  useEffect(() => {
    if (slug) {
      loadItem(slug);
    }
  }, [slug, loadItem]);

  // Autosave: after the first (initial) editor emit, debounce a draft save on subsequent edits (base only).
  useEffect(() => {
    if (!revisions || !blockEditor || !isEdit || !slug || !editorOut || !isBase) {
      return;
    }
    if (!autosaveArmed.current) {
      autosaveArmed.current = true;
      return;
    }
    setAutosave('saving');
    if (autosaveTimer.current) {
      clearTimeout(autosaveTimer.current);
    }
    autosaveTimer.current = setTimeout(() => {
      adminApi
        .update(slug, buildInput())
        .then(() => setAutosave('saved'))
        .catch(() => setAutosave('error'));
    }, 2000);
    return () => {
      if (autosaveTimer.current) {
        clearTimeout(autosaveTimer.current);
      }
    };
    // biome-ignore lint/correctness/useExhaustiveDependencies: debounce keyed on the editor output only.
  }, [editorOut]);

  const previewHtml = useMemo(
    () => marked.parse(form.bodyMdx || t(locale, 'cform.previewEmpty')) as string,
    [form.bodyMdx, locale],
  );

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function buildInput(): ContentWriteInput {
    const difficulty = form.difficulty.trim() ? Number(form.difficulty) : undefined;
    // Block editor: persist the canonical doc + its derived body_mdx/embeds. Legacy textarea: raw body.
    const useEditor = blockEditor && editorOut !== null;
    const bodyMdx = useEditor ? editorOut.bodyMdx : form.bodyMdx;
    const details: Record<string, string> = {};
    for (const fact of FACTS) {
      details[fact.key] = (form[fact.key as keyof FormState] as string).trim();
    }
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
      details,
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
    // In a target locale the primary action saves the translation, not the base entity.
    if (!isBase) {
      await loc.saveActive();
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (isEdit && slug) {
        await adminApi.update(slug, buildInput());
        setNotice(t(locale, 'cform.noticeSaved'));
      } else {
        const created = await adminApi.create(buildInput());
        // Persist any translations authored before the base existed, then open the editor.
        try {
          await loc.flushBuffered(created.id);
        } catch {
          // The base item is saved; translations can be re-entered on the edit page.
        }
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

  const showLocaleBar =
    localeStrings && (loc.availableLocales.length > 1 || loc.addableLocales.length > 0);
  const bannerError = error ?? loc.error;
  const bannerNotice = notice ?? loc.notice;

  /** Read-only hint applied to structural inputs while a target locale is active. */
  const lockAttrs = lock ? { title: t(locale, 'loc.lockedFieldHint') } : {};

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
        {/* Title + summary read as the document head, not form fields (Notion-style). */}
        <div className="space-y-1">
          <LocalizableField
            locale={locale}
            kind="plain"
            variant="head"
            isBase={isBase}
            value={loc.valueFor('title')}
            baseValue={loc.baseValueFor('title')}
            onChange={(v) => loc.setValueFor('title', v)}
            baseLabel={baseLabel}
            placeholder={t(locale, 'cform.titlePlaceholder')}
            inputClassName="h-auto border-0 bg-transparent px-0 py-1 font-display text-3xl font-semibold tracking-tight shadow-none focus-visible:ring-0"
          />
          <LocalizableField
            locale={locale}
            kind="plain"
            variant="head"
            isBase={isBase}
            value={loc.valueFor('summary')}
            baseValue={loc.baseValueFor('summary')}
            onChange={(v) => loc.setValueFor('summary', v)}
            baseLabel={baseLabel}
            placeholder={t(locale, 'cform.summaryPlaceholder')}
            inputClassName="h-auto border-0 bg-transparent px-0 text-base text-muted-foreground shadow-none focus-visible:ring-0"
          />
        </div>

        {/* Metadata as a collapsible properties strip (default open), not a separate form card. */}
        <Accordion
          type="multiple"
          defaultValue={['properties']}
          className="rounded-lg border border-border"
        >
          <AccordionItem value="properties" className="border-b-0 px-4">
            <AccordionTrigger>{t(locale, 'cform.properties')}</AccordionTrigger>
            <AccordionContent className="text-foreground">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t(locale, 'cform.slug')} htmlFor="cform-slug">
                  <Input
                    id="cform-slug"
                    value={form.slug}
                    readOnly={isEdit || lock}
                    onChange={(e) => set('slug', e.target.value)}
                    placeholder={t(locale, 'cform.slugPlaceholder')}
                    {...lockAttrs}
                  />
                </Field>
                <Field label={t(locale, 'cform.difficulty')} htmlFor="cform-difficulty">
                  <Input
                    id="cform-difficulty"
                    type="number"
                    min={1}
                    max={10}
                    value={form.difficulty}
                    readOnly={lock}
                    onChange={(e) => set('difficulty', e.target.value)}
                    {...lockAttrs}
                  />
                </Field>
                <Field label={t(locale, 'cform.type')} htmlFor="cform-type">
                  <Select
                    id="cform-type"
                    value={form.type}
                    disabled={lock}
                    onChange={(e) => set('type', e.target.value as ContentWriteInput['type'])}
                    {...lockAttrs}
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
                    disabled={lock}
                    onChange={(e) =>
                      set('visibility', e.target.value as ContentWriteInput['visibility'])
                    }
                    {...lockAttrs}
                  >
                    {VISIBILITIES.map((v) => (
                      <option key={v} value={v}>
                        {t(locale, VISIBILITY_LABEL_KEYS[v])}
                      </option>
                    ))}
                  </Select>
                </Field>
                {form.visibility === 'premium' ? (
                  <Field label={t(locale, 'cform.tier')} htmlFor="cform-tier">
                    <Select
                      id="cform-tier"
                      value={form.tier}
                      disabled={lock}
                      onChange={(e) => set('tier', e.target.value)}
                      {...lockAttrs}
                    >
                      <option value="premium">{t(locale, 'cform.tierPremium')}</option>
                      <option value="pro">{t(locale, 'cform.tierPro')}</option>
                    </Select>
                  </Field>
                ) : null}
                {TAXONOMY_DIMS.map((dim) => (
                  <Field
                    key={dim}
                    label={t(locale, 'cform.taxonomyLabel', {
                      dim: t(locale, DIM_LABEL_KEYS[dim]),
                    })}
                    htmlFor={`cform-${dim}`}
                  >
                    <Input
                      id={`cform-${dim}`}
                      list={`opts-${dim}`}
                      value={form[dim]}
                      readOnly={lock}
                      onChange={(e) => set(dim, e.target.value)}
                      {...lockAttrs}
                    />
                    <datalist id={`opts-${dim}`}>
                      {options[dim].map((o) => (
                        <option key={o} value={o} />
                      ))}
                    </datalist>
                  </Field>
                ))}
                <Field label={t(locale, 'cform.attribution')} htmlFor="cform-attribution">
                  <Input
                    id="cform-attribution"
                    value={form.attribution}
                    readOnly={lock}
                    onChange={(e) => set('attribution', e.target.value)}
                    {...lockAttrs}
                  />
                </Field>
                <Field label={t(locale, 'cform.license')} htmlFor="cform-license">
                  <Input
                    id="cform-license"
                    value={form.license}
                    readOnly={lock}
                    onChange={(e) => set('license', e.target.value)}
                    {...lockAttrs}
                  />
                </Field>
                {/* Structured facts — editable in the base locale, translatable per-locale. */}
                {FACTS.map((fact) => (
                  <LocalizableField
                    key={fact.key}
                    locale={locale}
                    kind="plain"
                    variant="field"
                    isBase={isBase}
                    label={t(locale, fact.labelKey)}
                    htmlFor={`cform-${fact.key}`}
                    value={loc.valueFor(`details.${fact.key}`)}
                    baseValue={loc.baseValueFor(`details.${fact.key}`)}
                    onChange={(v) => loc.setValueFor(`details.${fact.key}`, v)}
                    baseLabel={baseLabel}
                  />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Body — the base editor stays mounted (keeping its full doc/embeds across locale switches);
            a target locale swaps in a per-locale body editor with the English original for reference. */}
        <div className="space-y-2">
          <span className="text-sm font-medium">{t(locale, 'cform.bodyEditor')}</span>
          {blockEditor ? (
            <>
              <div className={isBase ? '' : 'hidden'}>
                {preview ? (
                  <div className="mb-2 flex items-center justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-pressed={showPreview}
                      onClick={() => setShowPreview((v) => !v)}
                    >
                      <Icon name={showPreview ? 'eye-off' : 'eye'} className="size-4" />
                      {showPreview
                        ? t(locale, 'cform.hidePreview')
                        : t(locale, 'cform.showPreview')}
                    </Button>
                  </div>
                ) : null}
                <div className={showPreview ? 'grid gap-4 lg:grid-cols-2' : ''}>
                  {loaded ? (
                    <BlockEditor
                      key={`${slug ?? 'new'}-${reloadKey}`}
                      locale={locale}
                      interactive={interactive}
                      profile="full"
                      initialDoc={null}
                      initialBodyMdx={form.bodyMdx}
                      initialEmbeds={loadedEmbeds}
                      onChange={setEditorOut}
                    />
                  ) : null}
                  {preview && showPreview ? (
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
              {!isBase ? (
                <LocalizableField
                  locale={locale}
                  kind="rich"
                  isBase={isBase}
                  blockEditor
                  interactive={interactive}
                  profile="full"
                  remountKey={`tr-body-${loc.activeLocale}`}
                  embeds={loadedEmbeds}
                  value={loc.valueFor('bodyMdx')}
                  baseValue={loc.baseValueFor('bodyMdx')}
                  onChange={(v) => loc.setValueFor('bodyMdx', v)}
                  baseLabel={baseLabel}
                />
              ) : null}
            </>
          ) : isBase ? (
            <div className="flex flex-col gap-3">
              <Textarea
                id="cform-body"
                className="h-64 font-mono"
                value={form.bodyMdx}
                onChange={(e) => set('bodyMdx', e.target.value)}
              />
              <div className="space-y-1.5">
                <span className="text-sm font-medium">{t(locale, 'cform.preview')}</span>
                {/* biome-ignore lint/security/noDangerouslySetInnerHtml: admin-authored markdown preview. */}
                <div
                  className="prose prose-sm max-w-none rounded-md border border-border bg-muted/20 p-3 dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              </div>
            </div>
          ) : (
            <LocalizableField
              locale={locale}
              kind="rich"
              isBase={isBase}
              blockEditor={false}
              remountKey={`tr-body-${loc.activeLocale}`}
              value={loc.valueFor('bodyMdx')}
              baseValue={loc.baseValueFor('bodyMdx')}
              onChange={(v) => loc.setValueFor('bodyMdx', v)}
              baseLabel={baseLabel}
            />
          )}
        </div>

        <div className="flex flex-wrap gap-3 border-t border-border pt-4">
          {isBase ? (
            <>
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
                        act(() => adminApi.remove(slug), t(locale, 'cform.noticeDeleted')).then(
                          () => {
                            window.location.href = '/admin';
                          },
                        );
                      }
                    }}
                  >
                    <Icon name="trash" className="size-4" />
                    {t(locale, 'cform.delete')}
                  </Button>
                </>
              ) : null}
              {revisions && isEdit && autosave !== 'idle' ? (
                <span
                  className="ml-auto self-center text-sm text-muted-foreground"
                  aria-live="polite"
                >
                  {autosave === 'saving'
                    ? t(locale, 'cform.autosaving')
                    : autosave === 'saved'
                      ? t(locale, 'cform.autosaved')
                      : t(locale, 'cform.autosaveError')}
                </span>
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

      {isEdit && slug ? (
        <Accordion
          type="multiple"
          defaultValue={[]}
          className="rounded-lg border border-border [&>*]:px-4"
        >
          <AccordionItem value="media">
            <AccordionTrigger>{t(locale, 'cform.media')}</AccordionTrigger>
            <AccordionContent className="space-y-3 text-foreground">
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
            </AccordionContent>
          </AccordionItem>

          {form.type === 'score' ? (
            <AccordionItem value="score" className="border-b-0">
              <AccordionTrigger>{t(locale, 'cform.scoreHeading')}</AccordionTrigger>
              <AccordionContent className="space-y-3 text-foreground">
                <p className="text-sm text-muted-foreground">{t(locale, 'cform.scoreHelp')}</p>
                <div className="grid gap-4 lg:grid-cols-2">
                  <Textarea
                    className="h-72 font-mono text-sm"
                    value={scoreTex}
                    onChange={(e) => setScoreTex(e.target.value)}
                    placeholder={'\\title "Etude"\n.\n:4 c d e f | g a b c5'}
                  />
                  <div className="rounded-lg border border-border bg-card p-2">
                    {scoreTex.trim() ? (
                      <AlphaTexScore tex={scoreTex} locale={locale} />
                    ) : (
                      <p className="p-4 text-sm text-muted-foreground">
                        {t(locale, 'cform.scorePreviewEmpty')}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  type="button"
                  disabled={busy || !scoreTex.trim()}
                  onClick={() =>
                    act(() => adminApi.setScore(slug, scoreTex), t(locale, 'cform.scoreSaved'))
                  }
                >
                  <Icon name="check" className="size-4" />
                  {t(locale, 'cform.scoreSave')}
                </Button>
              </AccordionContent>
            </AccordionItem>
          ) : null}
        </Accordion>
      ) : null}

      {revisions && isEdit && slug ? (
        <RevisionsPanel
          slug={slug}
          locale={locale}
          onRestored={() => {
            autosaveArmed.current = false;
            setAutosave('idle');
            setReloadKey((k) => k + 1);
            loadItem(slug);
            setNotice(t(locale, 'cform.revisionRestored'));
          }}
        />
      ) : null}
    </div>
  );
}
