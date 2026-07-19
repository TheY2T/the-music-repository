import type { CollectionItemInput, CollectionWriteInput } from '@TheY2T/tmr-api-client';
import type { PMDoc } from '@TheY2T/tmr-content-serde';
import { type Locale, localizedPath, t } from '@TheY2T/tmr-i18n';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Badge,
  Button,
  Field,
  Icon,
  Input,
  SegmentedToggle,
  Select,
  Textarea,
} from '@TheY2T/tmr-ui';
import { adminApi, collectionsAdminApi } from '@TheY2T/tmr-web-data/admin-api';
import {
  type CollectionDocData,
  type CollectionDocItem,
  collectionToDoc,
  docToCollection,
} from '@TheY2T/tmr-web-data/collection-doc';
import {
  LOCALIZABLE_FIELDS,
  type LocalizableFieldSpec,
} from '@TheY2T/tmr-web-data/content-translations-api';
import type {
  CollectionPreviewItem,
  CollectionPreviewPayload,
} from '@TheY2T/tmr-web-data/preview-protocol';
import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { BlockEditor } from './admin/block-editor/BlockEditor';
import type { CatalogueOption } from './admin/block-editor/editor-ui';
import { PreviewPane } from './admin/block-editor/PreviewPane';
import { LocaleBar } from './localization/LocaleBar';
import { LocalizableField } from './localization/LocalizableField';
import { useLocaleContent } from './localization/useLocaleContent';

const KINDS = ['course', 'path', 'syllabus', 'songlist'] as const;

const emptyForm = {
  slug: '',
  title: '',
  summary: '',
  kind: 'course' as CollectionWriteInput['kind'],
  curatorName: '',
  curatorBio: '',
  difficultyMin: '',
  difficultyMax: '',
  estMinutes: '',
  featured: false,
  tags: '', // comma-separated
  outcomes: '', // newline-separated
};

const emptyDoc: CollectionDocData = { bodyMdx: '', ungrouped: [], sections: [] };

interface LoadedSection {
  id: string;
  title: string;
  description: string;
}
interface LoadedItemNote {
  slug: string;
  note: string;
}

function toInt(value: string): number | undefined {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : undefined;
}

function splitLines(text: string): string[] {
  return text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function CollectionForm({
  slug,
  locale,
  blockEditor = false,
  preview = false,
  localeStrings = false,
}: {
  slug?: string;
  locale: Locale;
  /** Use the block editor (single authoring surface: prose + sections + items) — ADR 0030 / Phase B. */
  blockEditor?: boolean;
  /** When true (+ blockEditor), show the opt-in side-by-side live preview. */
  preview?: boolean;
  /** When true, enable the per-locale content localization switcher (ADR 0034). */
  localeStrings?: boolean;
}) {
  const isEdit = Boolean(slug);
  const [form, setForm] = useState({ ...emptyForm });
  const [entityId, setEntityId] = useState<string | null>(null);
  // The structure (intro prose + sections + items) is authored in the editor; this is the live output.
  const [docData, setDocData] = useState<CollectionDocData>(emptyDoc);
  const [initialDoc, setInitialDoc] = useState<PMDoc | null>(null);
  // Persisted section ids + item notes, for keying the per-locale structure translations.
  const [loadedSections, setLoadedSections] = useState<LoadedSection[]>([]);
  const [loadedItemNotes, setLoadedItemNotes] = useState<LoadedItemNote[]>([]);
  const [catalogue, setCatalogue] = useState<CatalogueOption[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [loaded, setLoaded] = useState(!isEdit);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const setField = useCallback((key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Catalogue pieces the item picker can reference.
  useEffect(() => {
    adminApi
      .list()
      .then((r) =>
        setCatalogue(r.items.map((c) => ({ slug: c.slug, title: c.title, type: c.type }))),
      )
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!slug) {
      return;
    }
    collectionsAdminApi
      .get(slug)
      .then((c) => {
        setEntityId(c.id);
        setForm({
          slug: c.slug,
          title: c.title,
          summary: c.summary ?? '',
          kind: c.kind,
          curatorName: c.curatorName ?? '',
          curatorBio: c.curatorBio ?? '',
          difficultyMin: c.difficultyMin != null ? String(c.difficultyMin) : '',
          difficultyMax: c.difficultyMax != null ? String(c.difficultyMax) : '',
          estMinutes: c.estMinutes != null ? String(c.estMinutes) : '',
          featured: c.featured ?? false,
          tags: (c.tags ?? []).join(', '),
          outcomes: (c.outcomes ?? []).join('\n'),
        });
        const data: CollectionDocData = {
          bodyMdx: c.bodyMdx ?? '',
          ungrouped: c.items
            .filter((e) => !e.sectionId)
            .map((e) => ({
              contentSlug: e.content.slug,
              curatorNote: e.curatorNote ?? undefined,
              focusSkills: e.focusSkills?.length ? e.focusSkills : undefined,
            })),
          sections: c.sections.map((s) => ({
            title: s.title,
            description: s.description ?? undefined,
            items: s.items.map((e) => ({
              contentSlug: e.content.slug,
              curatorNote: e.curatorNote ?? undefined,
              focusSkills: e.focusSkills?.length ? e.focusSkills : undefined,
            })),
          })),
        };
        setDocData(data);
        setInitialDoc(collectionToDoc(data));
        setLoadedSections(
          c.sections.map((s) => ({ id: s.id, title: s.title, description: s.description ?? '' })),
        );
        setLoadedItemNotes(
          c.items
            .filter((e) => e.curatorNote)
            .map((e) => ({ slug: e.content.slug, note: e.curatorNote ?? '' })),
        );
        setStatus(c.status);
        setLoaded(true);
      })
      .catch((e: Error) => {
        setError(e.message);
        setLoaded(true);
      });
  }, [slug]);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // Localizable fields = static text fields + the loaded structure (sections / outcomes / item notes).
  const specs = useMemo<LocalizableFieldSpec[]>(() => {
    const dynamic: LocalizableFieldSpec[] = [];
    for (const s of loadedSections) {
      dynamic.push({ field: `section.${s.id}.title`, kind: 'plain' });
      dynamic.push({ field: `section.${s.id}.description`, kind: 'multiline' });
    }
    const outcomeCount = splitLines(form.outcomes).length;
    for (let i = 0; i < outcomeCount; i++) {
      dynamic.push({ field: `outcome.${i}`, kind: 'plain' });
    }
    for (const it of loadedItemNotes) {
      dynamic.push({ field: `item.${it.slug}.curatorNote`, kind: 'multiline' });
    }
    return [...LOCALIZABLE_FIELDS.collection, ...dynamic];
  }, [loadedSections, loadedItemNotes, form.outcomes]);

  const baseValues = useMemo(() => {
    const values: Record<string, string> = {
      title: form.title,
      summary: form.summary,
      bodyMdx: docData.bodyMdx,
      curatorBio: form.curatorBio,
    };
    for (const s of loadedSections) {
      values[`section.${s.id}.title`] = s.title;
      values[`section.${s.id}.description`] = s.description;
    }
    splitLines(form.outcomes).forEach((line, i) => {
      values[`outcome.${i}`] = line;
    });
    for (const it of loadedItemNotes) {
      values[`item.${it.slug}.curatorNote`] = it.note;
    }
    return values;
  }, [form, docData.bodyMdx, loadedSections, loadedItemNotes]);

  const onBaseChange = useCallback(
    (field: string, value: string) => {
      // Only the flat text fields flow back here; structure/outcomes are authored in the editor/textarea.
      if (field === 'title' || field === 'summary' || field === 'curatorBio') {
        setField(field, value);
      }
    },
    [setField],
  );

  const loc = useLocaleContent({
    entityType: 'collection',
    entityId,
    specs,
    baseValues,
    onBaseChange,
    enabled: localeStrings,
    locale,
  });
  const isBase = loc.isBase;
  const lock = !isBase;
  const baseLabel = t(locale, 'transadmin.baseLabel');
  const lockAttrs = lock ? { title: t(locale, 'loc.lockedFieldHint') } : {};
  const outcomeLines = useMemo(() => splitLines(form.outcomes), [form.outcomes]);

  function meta(): CollectionWriteInput {
    const tags = form.tags
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const outcomes = splitLines(form.outcomes);
    return {
      slug: form.slug.trim(),
      title: form.title.trim(),
      summary: form.summary.trim() || undefined,
      bodyMdx: docData.bodyMdx.trim() || undefined,
      kind: form.kind,
      visibility: 'public',
      featured: form.featured,
      difficultyMin: toInt(form.difficultyMin),
      difficultyMax: toInt(form.difficultyMax),
      estMinutes: toInt(form.estMinutes),
      curatorName: form.curatorName.trim() || undefined,
      curatorBio: form.curatorBio.trim() || undefined,
      tags: tags.length ? tags : undefined,
      outcomes: outcomes.length ? outcomes : undefined,
    };
  }

  function buildItems(): CollectionItemInput[] {
    return [
      ...docData.ungrouped.map((it) => ({
        contentSlug: it.contentSlug,
        curatorNote: it.curatorNote,
        focusSkills: it.focusSkills,
      })),
      ...docData.sections.flatMap((s, sectionIndex) =>
        s.items.map((it) => ({
          contentSlug: it.contentSlug,
          curatorNote: it.curatorNote,
          focusSkills: it.focusSkills,
          sectionIndex,
        })),
      ),
    ];
  }

  /** Persist metadata → sections → items (sections before items so `sectionIndex` resolves). */
  async function persist(targetSlug: string) {
    await collectionsAdminApi.setSections(
      targetSlug,
      docData.sections.map((s) => ({
        title: s.title.trim(),
        description: s.description?.trim() || undefined,
      })),
    );
    await collectionsAdminApi.setItems(targetSlug, buildItems());
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
        await collectionsAdminApi.update(slug, meta());
        await persist(slug);
        setNotice(t(locale, 'colform.savedNotice'));
      } else {
        const created = await collectionsAdminApi.create(meta());
        await persist(created.slug);
        try {
          await loc.flushBuffered(created.id);
        } catch {
          // The base collection is saved; translations can be re-entered on the edit page.
        }
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

  // Live-preview payload: resolve each item's title/type from the catalogue.
  const previewPayload = useMemo<CollectionPreviewPayload>(() => {
    const resolve = (it: CollectionDocItem): CollectionPreviewItem => {
      const c = catalogue.find((o) => o.slug === it.contentSlug);
      return {
        slug: it.contentSlug,
        title: c?.title ?? it.contentSlug,
        type: c?.type ?? 'lesson',
        curatorNote: it.curatorNote,
        focusSkills: it.focusSkills,
      };
    };
    return {
      title: form.title,
      summary: form.summary || undefined,
      bodyMdx: docData.bodyMdx,
      kind: form.kind,
      featured: form.featured,
      curatorName: form.curatorName || undefined,
      difficultyMin: toInt(form.difficultyMin),
      difficultyMax: toInt(form.difficultyMax),
      estMinutes: toInt(form.estMinutes),
      outcomes: splitLines(form.outcomes),
      ungrouped: docData.ungrouped.map(resolve),
      sections: docData.sections.map((s) => ({
        title: s.title,
        description: s.description,
        items: s.items.map(resolve),
      })),
    };
  }, [form, docData, catalogue]);

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
        {/* Title + summary are the document head; the workflow status sits alongside. */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-1">
            <LocalizableField
              locale={locale}
              kind="plain"
              variant="head"
              isBase={isBase}
              value={loc.valueFor('title')}
              baseValue={loc.baseValueFor('title')}
              onChange={(v) => loc.setValueFor('title', v)}
              baseLabel={baseLabel}
              placeholder={t(locale, 'colform.titlePlaceholder')}
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
              placeholder={t(locale, 'colform.summaryPlaceholder')}
              inputClassName="h-auto border-0 bg-transparent px-0 text-base text-muted-foreground shadow-none focus-visible:ring-0"
            />
          </div>
          {status ? (
            <Badge variant={status === 'published' ? 'success' : 'secondary'}>{status}</Badge>
          ) : null}
        </div>

        {/* Metadata as a collapsible properties strip. */}
        <Accordion
          type="multiple"
          defaultValue={['properties']}
          className="rounded-lg border border-border"
        >
          <AccordionItem value="properties" className="border-b-0 px-4">
            <AccordionTrigger>{t(locale, 'colform.properties')}</AccordionTrigger>
            <AccordionContent className="space-y-4 text-foreground">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t(locale, 'colform.slug')} htmlFor="colform-slug">
                  <Input
                    id="colform-slug"
                    value={form.slug}
                    readOnly={isEdit || lock}
                    onChange={(e) => set('slug', e.target.value)}
                    placeholder="beginner-piano-path"
                    {...lockAttrs}
                  />
                </Field>
                <Field label={t(locale, 'colform.kind')} htmlFor="colform-kind">
                  <Select
                    id="colform-kind"
                    value={form.kind}
                    disabled={lock}
                    onChange={(e) => set('kind', e.target.value as CollectionWriteInput['kind'])}
                    {...lockAttrs}
                  >
                    {KINDS.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label={t(locale, 'colform.curator')} htmlFor="colform-curator">
                  <Input
                    id="colform-curator"
                    value={form.curatorName}
                    readOnly={lock}
                    onChange={(e) => set('curatorName', e.target.value)}
                    {...lockAttrs}
                  />
                </Field>
                <Field label={t(locale, 'colform.featured')}>
                  <SegmentedToggle<'yes' | 'no'>
                    options={[
                      { value: 'no', label: t(locale, 'colform.no') },
                      { value: 'yes', label: t(locale, 'colform.yes') },
                    ]}
                    value={form.featured ? 'yes' : 'no'}
                    onValueChange={(v) => !lock && set('featured', v === 'yes')}
                  />
                </Field>
                <Field label={t(locale, 'colform.difficultyFrom')} htmlFor="colform-dmin">
                  <Input
                    id="colform-dmin"
                    type="number"
                    value={form.difficultyMin}
                    readOnly={lock}
                    onChange={(e) => set('difficultyMin', e.target.value)}
                    {...lockAttrs}
                  />
                </Field>
                <Field label={t(locale, 'colform.difficultyTo')} htmlFor="colform-dmax">
                  <Input
                    id="colform-dmax"
                    type="number"
                    value={form.difficultyMax}
                    readOnly={lock}
                    onChange={(e) => set('difficultyMax', e.target.value)}
                    {...lockAttrs}
                  />
                </Field>
                <Field label={t(locale, 'colform.duration')} htmlFor="colform-mins">
                  <Input
                    id="colform-mins"
                    type="number"
                    value={form.estMinutes}
                    readOnly={lock}
                    onChange={(e) => set('estMinutes', e.target.value)}
                    {...lockAttrs}
                  />
                </Field>
                <Field label={t(locale, 'colform.tags')} htmlFor="colform-tags">
                  <Input
                    id="colform-tags"
                    value={form.tags}
                    readOnly={lock}
                    onChange={(e) => set('tags', e.target.value)}
                    placeholder="piano, baroque"
                    {...lockAttrs}
                  />
                </Field>
              </div>
              {/* Curator bio is translatable — it rebinds to the active locale. */}
              <LocalizableField
                locale={locale}
                kind="multiline"
                variant="field"
                isBase={isBase}
                label={t(locale, 'colform.curatorBio')}
                htmlFor="colform-bio"
                rows={3}
                value={loc.valueFor('curatorBio')}
                baseValue={loc.baseValueFor('curatorBio')}
                onChange={(v) => loc.setValueFor('curatorBio', v)}
                baseLabel={baseLabel}
              />
              {/* Outcomes: base authors the list; a target locale translates it line-by-line. */}
              {isBase ? (
                <Field label={t(locale, 'colform.outcomes')} htmlFor="colform-outcomes">
                  <Textarea
                    id="colform-outcomes"
                    className="h-24"
                    value={form.outcomes}
                    onChange={(e) => set('outcomes', e.target.value)}
                    placeholder={t(locale, 'colform.outcomesHelp')}
                  />
                </Field>
              ) : outcomeLines.length ? (
                <div className="space-y-3">
                  <span className="text-sm font-medium">{t(locale, 'loc.outcomesHeading')}</span>
                  {outcomeLines.map((_, i) => (
                    <LocalizableField
                      // biome-ignore lint/suspicious/noArrayIndexKey: outcomes are keyed by their line index.
                      key={`outcome-${i}`}
                      locale={locale}
                      kind="plain"
                      variant="field"
                      isBase={isBase}
                      label={t(locale, 'loc.fieldOutcome', { n: i + 1 })}
                      value={loc.valueFor(`outcome.${i}`)}
                      baseValue={loc.baseValueFor(`outcome.${i}`)}
                      onChange={(v) => loc.setValueFor(`outcome.${i}`, v)}
                      baseLabel={baseLabel}
                    />
                  ))}
                </div>
              ) : null}
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Contents — intro prose, sections (headings) and items authored in one editor (base);
            a target locale swaps in per-locale translations of the prose, section text, and item notes. */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-0.5">
              <span className="text-sm font-medium">{t(locale, 'colform.structureLabel')}</span>
              <p className="text-xs text-muted-foreground">{t(locale, 'colform.structureHint')}</p>
            </div>
            {blockEditor && preview && isBase ? (
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

          {/* Base structure editor stays mounted (keeping the authored doc across locale switches). */}
          <div className={isBase ? '' : 'hidden'}>
            {blockEditor ? (
              loaded ? (
                <div className={showPreview ? 'grid gap-4 lg:grid-cols-2' : ''}>
                  <BlockEditor
                    key={slug ?? 'new'}
                    profile="collection"
                    locale={locale}
                    initialDoc={initialDoc}
                    initialBodyMdx=""
                    initialEmbeds={[]}
                    catalogue={catalogue}
                    onChange={(c) => setDocData(docToCollection(c.doc))}
                  />
                  {preview && showPreview ? (
                    <PreviewPane
                      slug={slug ?? 'new'}
                      locale={locale}
                      route="/admin/preview/collection"
                      payload={previewPayload}
                    />
                  ) : null}
                </div>
              ) : null
            ) : (
              <Textarea
                className="h-40"
                value={docData.bodyMdx}
                onChange={(e) => setDocData((d) => ({ ...d, bodyMdx: e.target.value }))}
              />
            )}
          </div>

          {/* Target-locale translations of the intro prose + section text + item notes. */}
          {!isBase ? (
            <div className="space-y-6">
              <LocalizableField
                locale={locale}
                kind="rich"
                isBase={isBase}
                blockEditor={blockEditor}
                profile="minimal"
                remountKey={`col-body-${loc.activeLocale}`}
                label={t(locale, 'transadmin.fieldBodyMdx')}
                value={loc.valueFor('bodyMdx')}
                baseValue={loc.baseValueFor('bodyMdx')}
                onChange={(v) => loc.setValueFor('bodyMdx', v)}
                baseLabel={baseLabel}
              />
              {loadedSections.length ? (
                <div className="space-y-4">
                  <span className="text-sm font-medium">{t(locale, 'loc.sectionsHeading')}</span>
                  {loadedSections.map((s) => (
                    <div key={s.id} className="grid gap-4 sm:grid-cols-2">
                      <LocalizableField
                        locale={locale}
                        kind="plain"
                        variant="field"
                        isBase={isBase}
                        label={t(locale, 'loc.fieldSectionTitle')}
                        value={loc.valueFor(`section.${s.id}.title`)}
                        baseValue={loc.baseValueFor(`section.${s.id}.title`)}
                        onChange={(v) => loc.setValueFor(`section.${s.id}.title`, v)}
                        baseLabel={baseLabel}
                      />
                      <LocalizableField
                        locale={locale}
                        kind="multiline"
                        variant="field"
                        isBase={isBase}
                        label={t(locale, 'loc.fieldSectionDescription')}
                        value={loc.valueFor(`section.${s.id}.description`)}
                        baseValue={loc.baseValueFor(`section.${s.id}.description`)}
                        onChange={(v) => loc.setValueFor(`section.${s.id}.description`, v)}
                        baseLabel={baseLabel}
                      />
                    </div>
                  ))}
                </div>
              ) : null}
              {loadedItemNotes.length ? (
                <div className="space-y-4">
                  <span className="text-sm font-medium">{t(locale, 'loc.itemNotesHeading')}</span>
                  {loadedItemNotes.map((it) => (
                    <LocalizableField
                      key={it.slug}
                      locale={locale}
                      kind="multiline"
                      variant="field"
                      isBase={isBase}
                      label={t(locale, 'loc.fieldItemNote', { slug: it.slug })}
                      rows={2}
                      value={loc.valueFor(`item.${it.slug}.curatorNote`)}
                      baseValue={loc.baseValueFor(`item.${it.slug}.curatorNote`)}
                      onChange={(v) => loc.setValueFor(`item.${it.slug}.curatorNote`, v)}
                      baseLabel={baseLabel}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-3 border-t border-border pt-4">
          {isBase ? (
            <>
              <Button type="submit" disabled={busy}>
                <Icon name="check" className="size-4" />
                {isEdit ? t(locale, 'colform.saveChanges') : t(locale, 'colform.create')}
              </Button>
              {isEdit && slug ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy}
                    onClick={() =>
                      act(
                        () => collectionsAdminApi.publish(slug),
                        t(locale, 'colform.publishedNotice'),
                      )
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
                    variant="destructive"
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
                    <Icon name="trash" className="size-4" />
                    {t(locale, 'colform.delete')}
                  </Button>
                </>
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
