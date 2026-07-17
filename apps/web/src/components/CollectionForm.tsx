import type { CollectionItemInput, CollectionWriteInput } from '@TheY2T/tmr-api-client';
import { type Locale, localizedPath, t } from '@TheY2T/tmr-i18n';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Badge,
  Button,
  Card,
  Field,
  Icon,
  Input,
  SegmentedToggle,
  Select,
  Textarea,
} from '@TheY2T/tmr-ui';
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { type FormEvent, type ReactNode, useEffect, useState } from 'react';
import { BlockEditor } from '@/components/admin/block-editor/BlockEditor';
import { collectionsAdminApi } from '@/lib/admin-api';

let sectionIdCounter = 0;
/** Stable local id for a section row (dnd-kit needs one; not persisted). */
function nextSectionId(): string {
  sectionIdCounter += 1;
  return `sec-${sectionIdCounter}`;
}

/** A sortable wrapper giving its child a drag handle via render-prop; keyboard-accessible. */
function SortableSection({
  id,
  children,
}: {
  id: string;
  children: (handle: {
    attributes: Record<string, unknown>;
    listeners: Record<string, unknown>;
  }) => ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div ref={setNodeRef} style={style}>
      {children({
        attributes: attributes as unknown as Record<string, unknown>,
        listeners: (listeners ?? {}) as unknown as Record<string, unknown>,
      })}
    </div>
  );
}

const KINDS = ['course', 'path', 'syllabus', 'songlist'] as const;

interface SectionForm {
  /** Stable local id for drag-and-drop (not persisted; order comes from array position). */
  id: string;
  title: string;
  description: string;
  /** newline-separated `slug` or `slug | curator note`. */
  items: string;
}

const emptyForm = {
  slug: '',
  title: '',
  summary: '',
  bodyMdx: '',
  kind: 'course' as CollectionWriteInput['kind'],
  curatorName: '',
  curatorBio: '',
  difficultyMin: '',
  difficultyMax: '',
  estMinutes: '',
  featured: false,
  tags: '', // comma-separated
  outcomes: '', // newline-separated
  ungrouped: '', // newline-separated content slugs with no section
};

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

function parseItemLine(line: string): { contentSlug: string; curatorNote?: string } | null {
  const [slugPart, ...noteParts] = line.split('|');
  const contentSlug = slugPart.trim();
  if (!contentSlug) {
    return null;
  }
  const note = noteParts.join('|').trim();
  return { contentSlug, curatorNote: note || undefined };
}

export default function CollectionForm({
  slug,
  locale,
  blockEditor = false,
}: {
  slug?: string;
  locale: Locale;
  /** Use the minimal block editor for the collection description (ADR 0030). */
  blockEditor?: boolean;
}) {
  const isEdit = Boolean(slug);
  const [form, setForm] = useState({ ...emptyForm });
  const [sections, setSections] = useState<SectionForm[]>([]);
  const [loaded, setLoaded] = useState(!isEdit);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

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
          bodyMdx: c.bodyMdx ?? '',
          kind: c.kind,
          curatorName: c.curatorName ?? '',
          curatorBio: c.curatorBio ?? '',
          difficultyMin: c.difficultyMin != null ? String(c.difficultyMin) : '',
          difficultyMax: c.difficultyMax != null ? String(c.difficultyMax) : '',
          estMinutes: c.estMinutes != null ? String(c.estMinutes) : '',
          featured: c.featured ?? false,
          tags: (c.tags ?? []).join(', '),
          outcomes: (c.outcomes ?? []).join('\n'),
          ungrouped: c.items
            .filter((e) => !e.sectionId)
            .map((e) => e.content.slug)
            .join('\n'),
        });
        setSections(
          c.sections.map((s) => ({
            id: nextSectionId(),
            title: s.title,
            description: s.description ?? '',
            items: s.items
              .map((e) => (e.curatorNote ? `${e.content.slug} | ${e.curatorNote}` : e.content.slug))
              .join('\n'),
          })),
        );
        setStatus(c.status);
        setLoaded(true);
      })
      .catch((e: Error) => {
        setError(e.message);
        setLoaded(true);
      });
  }, [slug]);

  function onSectionDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setSections((cur) => {
        const from = cur.findIndex((s) => s.id === active.id);
        const to = cur.findIndex((s) => s.id === over.id);
        return from < 0 || to < 0 ? cur : arrayMove(cur, from, to);
      });
    }
  }

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function setSection(index: number, patch: Partial<SectionForm>) {
    setSections((cur) => cur.map((s, i) => (i === index ? { ...s, ...patch } : s)));
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
      bodyMdx: form.bodyMdx.trim() || undefined,
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
    const items: CollectionItemInput[] = splitLines(form.ungrouped).map((contentSlug) => ({
      contentSlug,
    }));
    sections.forEach((sec, sectionIndex) => {
      for (const line of splitLines(sec.items)) {
        const parsed = parseItemLine(line);
        if (parsed) {
          items.push({ ...parsed, sectionIndex });
        }
      }
    });
    return items;
  }

  /** Persist metadata → sections → items (sections before items so `sectionIndex` resolves). */
  async function persist(targetSlug: string) {
    await collectionsAdminApi.setSections(
      targetSlug,
      sections.map((s) => ({
        title: s.title.trim(),
        description: s.description.trim() || undefined,
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

        {/* Metadata as a collapsible properties strip, not a stack of cards. */}
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

        {/* Description (full-width). */}
        {blockEditor ? (
          <div className="space-y-2">
            <span className="text-sm font-medium">{t(locale, 'colform.body')}</span>
            {loaded ? (
              <BlockEditor
                key={slug ?? 'new'}
                profile="minimal"
                locale={locale}
                initialDoc={null}
                initialBodyMdx={form.bodyMdx}
                initialEmbeds={[]}
                onChange={(c) => set('bodyMdx', c.bodyMdx)}
              />
            ) : null}
          </div>
        ) : (
          <Field label={t(locale, 'colform.body')} htmlFor="colform-body">
            <Textarea
              id="colform-body"
              className="h-28"
              value={form.bodyMdx}
              onChange={(e) => set('bodyMdx', e.target.value)}
            />
          </Field>
        )}

        <Card className="space-y-4 p-5">
          <Field label={t(locale, 'colform.ungroupedHelp')} htmlFor="colform-ungrouped">
            <Textarea
              id="colform-ungrouped"
              className="h-24 font-mono"
              value={form.ungrouped}
              onChange={(e) => set('ungrouped', e.target.value)}
              placeholder={'c-major-scale-two-octaves\nczerny-op-599-no-1'}
            />
          </Field>

          <div className="space-y-4 border-t border-border pt-4">
            <div className="flex items-center justify-between">
              <p className="font-display font-semibold">{t(locale, 'colform.sectionsHeading')}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setSections((cur) => [
                    ...cur,
                    { id: nextSectionId(), title: '', description: '', items: '' },
                  ])
                }
              >
                <Icon name="plus" className="size-4" />
                {t(locale, 'colform.addSection')}
              </Button>
            </div>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={onSectionDragEnd}
              accessibility={{
                announcements: {
                  onDragStart: () => t(locale, 'colform.dndPicked'),
                  onDragOver: () => t(locale, 'colform.dndMoved'),
                  onDragEnd: () => t(locale, 'colform.dndDropped'),
                  onDragCancel: () => t(locale, 'colform.dndCancelled'),
                },
              }}
            >
              <SortableContext
                items={sections.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-4">
                  {sections.map((section, index) => (
                    <SortableSection key={section.id} id={section.id}>
                      {(handle) => (
                        <Card className="space-y-3 border-dashed p-4">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              aria-label={t(locale, 'colform.reorderSection')}
                              className="shrink-0 cursor-grab text-muted-foreground hover:text-foreground"
                              {...handle.attributes}
                              {...handle.listeners}
                            >
                              <Icon name="grip-vertical" className="size-4" />
                            </button>
                            <Input
                              value={section.title}
                              onChange={(e) => setSection(index, { title: e.target.value })}
                              placeholder={t(locale, 'colform.sectionTitle')}
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setSections((cur) => cur.filter((_, i) => i !== index))
                              }
                              aria-label={t(locale, 'colform.removeSection')}
                              className="shrink-0 text-muted-foreground hover:text-destructive"
                            >
                              <Icon name="trash" className="size-4" />
                            </button>
                          </div>
                          <Input
                            value={section.description}
                            onChange={(e) => setSection(index, { description: e.target.value })}
                            placeholder={t(locale, 'colform.sectionSummary')}
                          />
                          <Textarea
                            className="h-24 font-mono text-sm"
                            value={section.items}
                            onChange={(e) => setSection(index, { items: e.target.value })}
                            placeholder={t(locale, 'colform.sectionItemsHelp')}
                          />
                        </Card>
                      )}
                    </SortableSection>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </Card>

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
