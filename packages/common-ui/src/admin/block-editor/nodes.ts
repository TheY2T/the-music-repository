import { EMBED_NODE } from '@TheY2T/tmr-content-serde';
import { mergeAttributes, Node } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { EmbedNodeView } from './EmbedNodeView';

/**
 * `tmrEmbed` — an atom block carrying an opaque `config` (the `ContentEmbed`). Rendered in the editor by
 * a React node view showing the real tool; serialized to a `<div data-tmr-embed>` marker by content-serde
 * (never via this node's `renderHTML`, which exists only so copy/paste HTML round-trips). See ADR 0030.
 */
export const TmrEmbed = Node.create({
  name: EMBED_NODE,
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      config: {
        default: null,
        parseHTML: (el) => {
          const raw = el.getAttribute('data-config');
          return raw ? JSON.parse(raw) : null;
        },
        renderHTML: (attrs) =>
          attrs.config ? { 'data-config': JSON.stringify(attrs.config) } : {},
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-tmr-embed]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-tmr-embed': '' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(EmbedNodeView);
  },
});

/**
 * `htmlBlock` — verbatim raw-HTML block (e.g. authored `<!-- comments -->`). Kept so legacy content
 * round-trips losslessly; shown as a muted, non-editable chip in the editor.
 */
export const HtmlBlock = Node.create({
  name: 'htmlBlock',
  group: 'block',
  atom: true,
  selectable: true,

  addAttributes() {
    return { html: { default: '' } };
  },

  parseHTML() {
    return [{ tag: 'div[data-html-block]' }];
  },

  renderHTML({ node }) {
    return [
      'div',
      {
        'data-html-block': '',
        class:
          'rounded border border-dashed border-border bg-muted/30 p-2 font-mono text-xs text-muted-foreground',
      },
      String(node.attrs.html ?? ''),
    ];
  },
});
