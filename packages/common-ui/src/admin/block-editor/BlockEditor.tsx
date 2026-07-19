import {
  docToMdx,
  EMBED_NODE,
  type EmbedConfig,
  type EmbedTool,
  mdxToDoc,
  type PMDoc,
} from '@TheY2T/tmr-content-serde';
import { type Locale, t } from '@TheY2T/tmr-i18n';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Icon,
  type IconName,
} from '@TheY2T/tmr-ui';
import { COLLECTION_ITEM_NODE } from '@TheY2T/tmr-web-acl/collection-doc';
import { Extension } from '@tiptap/core';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Table from '@tiptap/extension-table';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TableRow from '@tiptap/extension-table-row';
import { type Editor, EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TmrCollectionItem } from './collection-nodes';
import { EmbedInspector } from './EmbedInspector';
import { type CatalogueOption, EditorUiContext, type EmbedInspectorTarget } from './editor-ui';
import { defaultConfig, TOOL_LABEL_KEY, TOOL_ORDER } from './embed-fields';
import { HtmlBlock, TmrEmbed } from './nodes';

export interface BlockEditorChange {
  doc: PMDoc;
  bodyMdx: string;
  embeds: EmbedConfig[];
}

export interface BlockEditorProps {
  locale: Locale;
  interactive?: boolean;
  /**
   * `full` (default) = the catalogue-article editor with the insert-tool menu + tables. `minimal` =
   * prose + basic marks only (no interactive embeds, no tables) — for collection descriptions and help
   * topics, which store plain markdown.
   */
  profile?: 'full' | 'minimal' | 'collection';
  /** Canonical doc (preferred). When null, the editor falls back to parsing `bodyMdx` + `embeds`. */
  initialDoc: PMDoc | null;
  initialBodyMdx: string;
  initialEmbeds: EmbedConfig[];
  /** Catalogue entries for the collection profile's item picker. */
  catalogue?: CatalogueOption[];
  onChange?: (change: BlockEditorChange) => void;
}

/**
 * StarterKit's history binds undo/redo via `Mod` (= Cmd on macOS), so plain Ctrl+Z/Ctrl+Y don't fire
 * on a Mac. Bind the Ctrl variants explicitly, in addition to the platform defaults.
 */
const UndoRedoShortcuts = Extension.create({
  name: 'undoRedoShortcuts',
  addKeyboardShortcuts() {
    return {
      'Ctrl-z': () => this.editor.commands.undo(),
      'Ctrl-y': () => this.editor.commands.redo(),
      'Ctrl-Shift-z': () => this.editor.commands.redo(),
    };
  },
});

/** A toolbar button; `active` reflects the current mark/node so the control shows state. */
function ToolbarButton({
  icon,
  label,
  active,
  disabled,
  onClick,
}: {
  icon: IconName;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      size="icon"
      variant={active ? 'secondary' : 'ghost'}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
    >
      <Icon name={icon} className="size-4" />
    </Button>
  );
}

/**
 * WYSIWYG block editor island (ADR 0030). One `client:only` React root: a TipTap editor whose schema
 * matches content-serde's node set, an insert-tool menu that drops real interactive embeds, and a
 * side-panel inspector to configure them. Emits the derived `{ doc, bodyMdx, embeds }` (debounced) so the
 * parent form persists `body_doc` + the render fields.
 */
export function BlockEditor({
  locale,
  interactive = false,
  profile = 'full',
  initialDoc,
  initialBodyMdx,
  initialEmbeds,
  catalogue,
  onChange,
}: BlockEditorProps) {
  const full = profile === 'full';
  const isCollection = profile === 'collection';
  const [target, setTarget] = useState<EmbedInspectorTarget | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const initialContent = useMemo<PMDoc>(
    () => initialDoc ?? mdxToDoc(initialBodyMdx, initialEmbeds),
    [initialDoc, initialBodyMdx, initialEmbeds],
  );

  const emit = useCallback((ed: Editor) => {
    const doc = ed.getJSON() as PMDoc;
    const { bodyMdx, embeds } = docToMdx(doc);
    onChangeRef.current?.({ doc, bodyMdx, embeds });
  }, []);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      UndoRedoShortcuts,
      Link.configure({ openOnClick: false }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({ placeholder: t(locale, 'blockEditor.placeholder') }),
      ...(isCollection ? [TmrCollectionItem] : [TmrEmbed, HtmlBlock]),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-64',
        'aria-label': t(locale, 'blockEditor.aria'),
      },
    },
    onUpdate: ({ editor: ed }) => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
      timer.current = setTimeout(() => emit(ed), 300);
    },
  });

  // Seed the parent with the initial derived values (so an unedited save still persists correctly).
  useEffect(() => {
    if (editor) {
      emit(editor);
    }
    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    };
  }, [editor, emit]);

  const openInspector = useCallback((next: EmbedInspectorTarget) => setTarget(next), []);
  const ui = useMemo(
    () => ({ locale, interactive, openInspector, catalogue }),
    [locale, interactive, openInspector, catalogue],
  );

  const insertItem = () => {
    editor
      ?.chain()
      .focus()
      .insertContent({
        type: COLLECTION_ITEM_NODE,
        attrs: { contentSlug: '', curatorNote: '', focusSkills: [] },
      })
      .run();
  };

  const insertTool = (tool: EmbedTool) => {
    editor
      ?.chain()
      .focus()
      .insertContent({ type: EMBED_NODE, attrs: { config: defaultConfig(tool) } })
      .run();
  };

  const addLink = () => {
    if (!editor) {
      return;
    }
    const url = window.prompt(t(locale, 'blockEditor.linkPrompt'), 'https://');
    if (url === null) {
      return;
    }
    if (url === '') {
      editor.chain().focus().unsetLink().run();
    } else {
      editor.chain().focus().toggleLink({ href: url }).run();
    }
  };

  return (
    <EditorUiContext.Provider value={ui}>
      <div className="rounded-lg border border-border bg-card">
        <div className="flex flex-wrap items-center gap-1 border-b border-border p-2">
          <ToolbarButton
            icon="undo"
            label={t(locale, 'blockEditor.undo')}
            disabled={!editor?.can().undo()}
            onClick={() => editor?.chain().focus().undo().run()}
          />
          <ToolbarButton
            icon="redo"
            label={t(locale, 'blockEditor.redo')}
            disabled={!editor?.can().redo()}
            onClick={() => editor?.chain().focus().redo().run()}
          />
          <span className="mx-1 h-5 w-px bg-border" aria-hidden />
          <ToolbarButton
            icon="bold"
            label={t(locale, 'blockEditor.bold')}
            active={editor?.isActive('bold')}
            onClick={() => editor?.chain().focus().toggleBold().run()}
          />
          <ToolbarButton
            icon="italic"
            label={t(locale, 'blockEditor.italic')}
            active={editor?.isActive('italic')}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
          />
          <ToolbarButton
            icon="strikethrough"
            label={t(locale, 'blockEditor.strike')}
            active={editor?.isActive('strike')}
            onClick={() => editor?.chain().focus().toggleStrike().run()}
          />
          <ToolbarButton
            icon="code"
            label={t(locale, 'blockEditor.code')}
            active={editor?.isActive('code')}
            onClick={() => editor?.chain().focus().toggleCode().run()}
          />
          <span className="mx-1 h-6 w-px bg-border" />
          <ToolbarButton
            icon="heading-2"
            label={t(locale, 'blockEditor.heading')}
            active={editor?.isActive('heading', { level: 2 })}
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          />
          <ToolbarButton
            icon="list"
            label={t(locale, 'blockEditor.bulletList')}
            active={editor?.isActive('bulletList')}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
          />
          <ToolbarButton
            icon="list-ordered"
            label={t(locale, 'blockEditor.orderedList')}
            active={editor?.isActive('orderedList')}
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          />
          <ToolbarButton
            icon="quote"
            label={t(locale, 'blockEditor.quote')}
            active={editor?.isActive('blockquote')}
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          />
          <ToolbarButton
            icon="link"
            label={t(locale, 'blockEditor.link')}
            active={editor?.isActive('link')}
            onClick={addLink}
          />
          {full ? (
            <ToolbarButton
              icon="table"
              label={t(locale, 'blockEditor.table')}
              onClick={() =>
                editor?.chain().focus().insertTable({ rows: 2, cols: 2, withHeaderRow: true }).run()
              }
            />
          ) : null}
          <ToolbarButton
            icon="minus"
            label={t(locale, 'blockEditor.rule')}
            onClick={() => editor?.chain().focus().setHorizontalRule().run()}
          />
          {full ? (
            <>
              <span className="mx-1 h-6 w-px bg-border" />
              <DropdownMenu>
                <DropdownMenuTrigger className="inline-flex items-center gap-1.5 rounded-md bg-accent/15 px-2.5 py-1.5 text-sm font-medium text-accent hover:bg-accent/25">
                  <Icon name="plus" className="size-4" />
                  {t(locale, 'blockEditor.insertTool')}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="max-h-80 overflow-y-auto">
                  {TOOL_ORDER.map((tool) => (
                    <DropdownMenuItem key={tool} onSelect={() => insertTool(tool)}>
                      {t(locale, TOOL_LABEL_KEY[tool])}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : null}
          {isCollection ? (
            <>
              <span className="mx-1 h-6 w-px bg-border" />
              <button
                type="button"
                onClick={() =>
                  editor
                    ?.chain()
                    .focus()
                    .insertContent({ type: 'heading', attrs: { level: 2 } })
                    .run()
                }
                className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Icon name="plus" className="size-4" />
                {t(locale, 'blockEditor.item.addSection')}
              </button>
              <button
                type="button"
                onClick={insertItem}
                className="inline-flex items-center gap-1.5 rounded-md bg-accent/15 px-2.5 py-1.5 text-sm font-medium text-accent hover:bg-accent/25"
              >
                <Icon name="plus" className="size-4" />
                {t(locale, 'blockEditor.item.add')}
              </button>
            </>
          ) : null}
        </div>

        <EditorContent
          editor={editor}
          className="prose max-w-none prose-headings:font-display px-4 py-3 [&_.ProseMirror]:min-h-64 [&_.ProseMirror]:outline-none"
        />
      </div>

      <EmbedInspector target={target} onClose={() => setTarget(null)} locale={locale} />
    </EditorUiContext.Provider>
  );
}

export default BlockEditor;
