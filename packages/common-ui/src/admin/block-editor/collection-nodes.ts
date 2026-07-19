import { COLLECTION_ITEM_NODE } from '@TheY2T/tmr-web-acl/collection-doc';
import { mergeAttributes, Node } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { CollectionItemNodeView } from './CollectionItemNodeView';

/**
 * `tmrCollectionItem` — an atom block referencing a catalogue piece (by slug) with a curator note and
 * focus skills. Rendered by a React node view (a search-picker card); `collection-doc` reads its attrs
 * off the document JSON into the collection's `items[]`. The HTML round-trip attrs exist only so
 * copy/paste survives (serialization goes through `collection-doc`, not `renderHTML`). Phase B.
 */
export const TmrCollectionItem = Node.create({
  name: COLLECTION_ITEM_NODE,
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      contentSlug: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-content-slug') ?? '',
        renderHTML: (attrs) =>
          attrs.contentSlug ? { 'data-content-slug': String(attrs.contentSlug) } : {},
      },
      curatorNote: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-curator-note') ?? '',
        renderHTML: (attrs) =>
          attrs.curatorNote ? { 'data-curator-note': String(attrs.curatorNote) } : {},
      },
      focusSkills: {
        default: [],
        parseHTML: (el) => {
          const raw = el.getAttribute('data-focus-skills');
          return raw ? JSON.parse(raw) : [];
        },
        renderHTML: (attrs) =>
          Array.isArray(attrs.focusSkills) && attrs.focusSkills.length
            ? { 'data-focus-skills': JSON.stringify(attrs.focusSkills) }
            : {},
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-tmr-collection-item]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-tmr-collection-item': '' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CollectionItemNodeView);
  },
});
