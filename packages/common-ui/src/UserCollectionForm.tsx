import { ApiProvider, useSearchCatalogue } from '@TheY2T/tmr-api-client';
import { type Locale, localizedPath, t } from '@TheY2T/tmr-i18n';
import {
  Button,
  Card,
  Field,
  Icon,
  Input,
  SearchField,
  SegmentedToggle,
  Textarea,
} from '@TheY2T/tmr-ui';
import {
  createUserCollection,
  deleteUserCollection,
  getMyCollection,
  setUserCollectionItems,
  updateUserCollection,
} from '@TheY2T/tmr-web-data/collections-api';
import { useEffect, useState } from 'react';

interface Item {
  contentSlug: string;
  title: string;
  curatorNote: string;
}

type Visibility = 'public' | 'private';

function Form({ slug, locale }: { slug?: string; locale: Locale }) {
  const editing = Boolean(slug);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('private');
  const [items, setItems] = useState<Item[]>([]);
  const [pickerQuery, setPickerQuery] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (slug) {
      getMyCollection(slug).then((c) => {
        if (!c) {
          return;
        }
        setTitle(c.title);
        setSummary(c.summary ?? '');
        setVisibility(c.visibility === 'public' ? 'public' : 'private');
        setItems(
          c.items.map((e) => ({
            contentSlug: e.content.slug,
            title: e.content.title,
            curatorNote: e.curatorNote ?? '',
          })),
        );
      });
    }
  }, [slug]);

  const { data } = useSearchCatalogue({ q: pickerQuery || undefined, page: 1, pageSize: 8 });
  const results = pickerQuery ? (data?.data?.items ?? []) : [];
  const chosen = new Set(items.map((i) => i.contentSlug));

  function addItem(contentSlug: string, itemTitle: string) {
    if (!chosen.has(contentSlug)) {
      setItems((cur) => [...cur, { contentSlug, title: itemTitle, curatorNote: '' }]);
    }
    setPickerQuery('');
  }

  function move(index: number, delta: number) {
    setItems((cur) => {
      const next = [...cur];
      const target = index + delta;
      if (target < 0 || target >= next.length) {
        return cur;
      }
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function updateNote(index: number, note: string) {
    setItems((cur) => cur.map((it, i) => (i === index ? { ...it, curatorNote: note } : it)));
  }

  async function save() {
    if (!title.trim()) {
      return;
    }
    setSaving(true);
    const body = { title: title.trim(), summary: summary.trim() || undefined, visibility };
    const saved = slug ? await updateUserCollection(slug, body) : await createUserCollection(body);
    if (saved) {
      await setUserCollectionItems(
        saved.slug,
        items.map((it) => ({
          contentSlug: it.contentSlug,
          curatorNote: it.curatorNote.trim() || undefined,
        })),
      );
      window.location.href = localizedPath(locale, '/me/collections');
      return;
    }
    setSaving(false);
  }

  async function remove() {
    if (slug && window.confirm(t(locale, 'ucoll.confirmDelete'))) {
      await deleteUserCollection(slug);
      window.location.href = localizedPath(locale, '/me/collections');
    }
  }

  return (
    <div className="space-y-6">
      <Field label={t(locale, 'ucoll.name')} htmlFor="uc-name">
        <Input
          id="uc-name"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t(locale, 'ucoll.namePlaceholder')}
        />
      </Field>

      <Field label={t(locale, 'ucoll.description')} htmlFor="uc-desc">
        <Textarea
          id="uc-desc"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={3}
        />
      </Field>

      <Field label={t(locale, 'ucoll.visibility')}>
        <SegmentedToggle<Visibility>
          options={[
            { value: 'private', label: t(locale, 'ucoll.private') },
            { value: 'public', label: t(locale, 'ucoll.public') },
          ]}
          value={visibility}
          onValueChange={setVisibility}
        />
      </Field>

      <div className="space-y-3">
        <p className="font-display font-semibold">{t(locale, 'ucoll.itemsHeading')}</p>
        <SearchField
          value={pickerQuery}
          onChange={(e) => setPickerQuery(e.target.value)}
          onClear={() => setPickerQuery('')}
          placeholder={t(locale, 'ucoll.searchItems')}
        />
        {results.length > 0 ? (
          <Card className="divide-y divide-border p-0">
            {results.map((r) => (
              <button
                key={r.slug}
                type="button"
                disabled={chosen.has(r.slug)}
                onClick={() => addItem(r.slug, r.title)}
                className="flex w-full items-center justify-between gap-2 p-3 text-left text-sm hover:bg-muted disabled:opacity-40"
              >
                <span className="min-w-0 truncate">{r.title}</span>
                <Icon name="plus" className="size-4 shrink-0 text-accent" />
              </button>
            ))}
          </Card>
        ) : null}

        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t(locale, 'ucoll.noItems')}</p>
        ) : (
          <ol className="space-y-2">
            {items.map((it, index) => (
              <li key={it.contentSlug}>
                <Card className="flex items-start gap-3 p-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-semibold text-accent tabular-nums">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1 space-y-2">
                    <span className="block truncate font-medium">{it.title}</span>
                    <Input
                      value={it.curatorNote}
                      onChange={(e) => updateNote(index, e.target.value)}
                      placeholder={t(locale, 'ucoll.notePlaceholder')}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="flex shrink-0 flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => move(index, -1)}
                      aria-label={t(locale, 'ucoll.reorderUp')}
                      className="text-muted-foreground hover:text-accent"
                    >
                      <Icon name="chevron-up" className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(index, 1)}
                      aria-label={t(locale, 'ucoll.reorderDown')}
                      className="text-muted-foreground hover:text-accent"
                    >
                      <Icon name="chevron-down" className="size-4" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setItems((cur) => cur.filter((_, i) => i !== index))}
                    aria-label={t(locale, 'ucoll.removeItem')}
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                  >
                    <Icon name="trash" className="size-4" />
                  </button>
                </Card>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={save} disabled={saving || !title.trim()}>
          {editing ? t(locale, 'ucoll.save') : t(locale, 'ucoll.create')}
        </Button>
        {editing ? (
          <Button type="button" variant="outline" onClick={remove}>
            <Icon name="trash" className="size-4" />
            {t(locale, 'ucoll.delete')}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export default function UserCollectionForm({ slug, locale }: { slug?: string; locale: Locale }) {
  return (
    <ApiProvider>
      <Form slug={slug} locale={locale} />
    </ApiProvider>
  );
}
