import { t } from '@TheY2T/tmr-i18n';
import { Badge, Button, Icon, Input } from '@TheY2T/tmr-ui';
import { type NodeViewProps, NodeViewWrapper } from '@tiptap/react';
import { useState } from 'react';
import { useEditorUi } from './editor-ui';

/**
 * TipTap node view for a `tmrCollectionItem` block: a card that references a catalogue piece (chosen via
 * a search picker) plus a curator note + focus skills. This is how a collection's items are authored
 * inline in the editor (Phase B) — `collection-doc` serializes the node's attrs into the collection's
 * `items[]`.
 */
export function CollectionItemNodeView(props: NodeViewProps) {
  const { locale, catalogue = [] } = useEditorUi();
  const slug = String(props.node.attrs.contentSlug ?? '');
  const curatorNote = String(props.node.attrs.curatorNote ?? '');
  const focusSkills = (
    Array.isArray(props.node.attrs.focusSkills) ? props.node.attrs.focusSkills : []
  ) as string[];

  const [query, setQuery] = useState('');
  const picked = catalogue.find((c) => c.slug === slug);
  const needle = query.trim().toLowerCase();
  const matches = needle
    ? catalogue
        .filter(
          (c) => c.title.toLowerCase().includes(needle) || c.slug.toLowerCase().includes(needle),
        )
        .slice(0, 8)
    : [];

  const remove = (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      aria-label={t(locale, 'blockEditor.item.remove')}
      onClick={() => props.deleteNode()}
    >
      <Icon name="trash" className="size-4" />
    </Button>
  );

  return (
    <NodeViewWrapper
      className="my-3 rounded-lg border border-border bg-card p-3"
      contentEditable={false}
    >
      {slug ? (
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Icon name="music" className="size-4 shrink-0 text-muted-foreground" />
                <span className="truncate font-medium text-foreground">
                  {picked?.title ?? slug}
                </span>
                {picked ? (
                  <Badge variant="secondary" className="shrink-0">
                    {picked.type}
                  </Badge>
                ) : null}
              </div>
              <p className="truncate text-xs text-muted-foreground">{slug}</p>
            </div>
            <div className="flex shrink-0 gap-1">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => props.updateAttributes({ contentSlug: '' })}
              >
                {t(locale, 'blockEditor.item.change')}
              </Button>
              {remove}
            </div>
          </div>
          <Input
            value={curatorNote}
            onChange={(e) => props.updateAttributes({ curatorNote: e.target.value })}
            placeholder={t(locale, 'blockEditor.item.note')}
          />
          <Input
            value={focusSkills.join(', ')}
            onChange={(e) =>
              props.updateAttributes({
                focusSkills: e.target.value
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
            placeholder={t(locale, 'blockEditor.item.skills')}
          />
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t(locale, 'blockEditor.item.pick')}
              // biome-ignore lint/a11y/noAutofocus: a freshly-inserted item card should let the author search immediately.
              autoFocus
            />
            {remove}
          </div>
          {needle ? (
            matches.length ? (
              <ul className="max-h-56 overflow-y-auto rounded-md border border-border">
                {matches.map((c) => (
                  <li key={c.slug}>
                    <button
                      type="button"
                      onClick={() => {
                        props.updateAttributes({ contentSlug: c.slug });
                        setQuery('');
                      }}
                      className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                    >
                      <span className="truncate">{c.title}</span>
                      <Badge variant="secondary" className="shrink-0">
                        {c.type}
                      </Badge>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-1 text-sm text-muted-foreground">
                {t(locale, 'blockEditor.item.empty')}
              </p>
            )
          ) : null}
        </div>
      )}
    </NodeViewWrapper>
  );
}
