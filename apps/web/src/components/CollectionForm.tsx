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
import { type FormEvent, useEffect, useState } from 'react';
import { BlockEditor } from '@/components/admin/block-editor/BlockEditor';
import type { CatalogueOption } from '@/components/admin/block-editor/editor-ui';
import { adminApi, collectionsAdminApi } from '@/lib/admin-api';
import { type CollectionDocData, collectionToDoc, docToCollection } from '@/lib/collection-doc';

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
}: {
  slug?: string;
  locale: Locale;
  /** Use the block editor (single authoring surface: prose + sections + items) — ADR 0030 / Phase B. */
  blockEditor?: boolean;
}) {
  const isEdit = Boolean(slug);
  const [form, setForm] = useState({ ...emptyForm });
  // The structure (intro prose + sections + items) is authored in the editor; this is the live output.
  const [docData, setDocData] = useState<CollectionDocData>(emptyDoc);
  const [initialDoc, setInitialDoc] = useState<PMDoc | null>(null);
  const [catalogue, setCatalogue] = useState<CatalogueOption[]>([]);
  const [loaded, setLoaded] = useState(!isEdit);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
        {/* Title + summary are the document head; the workflow status sits alongside. */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-1">
            <Input
              aria-label={t(locale, 'colform.title')}
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder={t(locale, 'colform.titlePlaceholder')}
              className="h-auto border-0 bg-transparent px-0 py-1 font-display text-3xl font-semibold tracking-tight shadow-none focus-visible:ring-0"
            />
            <Input
              aria-label={t(locale, 'colform.summary')}
              value={form.summary}
              onChange={(e) => set('summary', e.target.value)}
              placeholder={t(locale, 'colform.summaryPlaceholder')}
              className="h-auto border-0 bg-transparent px-0 text-base text-muted-foreground shadow-none focus-visible:ring-0"
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
                    readOnly={isEdit}
                    onChange={(e) => set('slug', e.target.value)}
                    placeholder="beginner-piano-path"
                  />
                </Field>
                <Field label={t(locale, 'colform.kind')} htmlFor="colform-kind">
                  <Select
                    id="colform-kind"
                    value={form.kind}
                    onChange={(e) => set('kind', e.target.value as CollectionWriteInput['kind'])}
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
                    onChange={(e) => set('curatorName', e.target.value)}
                  />
                </Field>
                <Field label={t(locale, 'colform.featured')}>
                  <SegmentedToggle<'yes' | 'no'>
                    options={[
                      { value: 'no', label: t(locale, 'colform.no') },
                      { value: 'yes', label: t(locale, 'colform.yes') },
                    ]}
                    value={form.featured ? 'yes' : 'no'}
                    onValueChange={(v) => set('featured', v === 'yes')}
                  />
                </Field>
                <Field label={t(locale, 'colform.difficultyFrom')} htmlFor="colform-dmin">
                  <Input
                    id="colform-dmin"
                    type="number"
                    value={form.difficultyMin}
                    onChange={(e) => set('difficultyMin', e.target.value)}
                  />
                </Field>
                <Field label={t(locale, 'colform.difficultyTo')} htmlFor="colform-dmax">
                  <Input
                    id="colform-dmax"
                    type="number"
                    value={form.difficultyMax}
                    onChange={(e) => set('difficultyMax', e.target.value)}
                  />
                </Field>
                <Field label={t(locale, 'colform.duration')} htmlFor="colform-mins">
                  <Input
                    id="colform-mins"
                    type="number"
                    value={form.estMinutes}
                    onChange={(e) => set('estMinutes', e.target.value)}
                  />
                </Field>
                <Field label={t(locale, 'colform.tags')} htmlFor="colform-tags">
                  <Input
                    id="colform-tags"
                    value={form.tags}
                    onChange={(e) => set('tags', e.target.value)}
                    placeholder="piano, baroque"
                  />
                </Field>
              </div>
              <Field label={t(locale, 'colform.curatorBio')} htmlFor="colform-bio">
                <Textarea
                  id="colform-bio"
                  className="h-20"
                  value={form.curatorBio}
                  onChange={(e) => set('curatorBio', e.target.value)}
                />
              </Field>
              <Field label={t(locale, 'colform.outcomes')} htmlFor="colform-outcomes">
                <Textarea
                  id="colform-outcomes"
                  className="h-24"
                  value={form.outcomes}
                  onChange={(e) => set('outcomes', e.target.value)}
                  placeholder={t(locale, 'colform.outcomesHelp')}
                />
              </Field>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Contents — intro prose, sections (headings) and items authored in one editor. */}
        <div className="space-y-2">
          <div className="space-y-0.5">
            <span className="text-sm font-medium">{t(locale, 'colform.structureLabel')}</span>
            <p className="text-xs text-muted-foreground">{t(locale, 'colform.structureHint')}</p>
          </div>
          {blockEditor ? (
            loaded ? (
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
            ) : null
          ) : (
            <Textarea
              className="h-40"
              value={docData.bodyMdx}
              onChange={(e) => setDocData((d) => ({ ...d, bodyMdx: e.target.value }))}
            />
          )}
        </div>

        <div className="flex flex-wrap gap-3 border-t border-border pt-4">
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
        </div>
      </form>
    </div>
  );
}
