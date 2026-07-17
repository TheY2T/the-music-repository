import { docToMdx, mdxToDoc, type PMDoc, type PMNode } from '@TheY2T/tmr-content-serde';

/**
 * Serde between the block editor's ProseMirror document and a collection's structure (intro prose +
 * chaptered sections + items), so a collection can be authored as ONE document (Phase B). The mapping:
 *
 * - An **H2 heading** starts a new section (its text is the section title).
 * - A **`tmrCollectionItem`** node is an item (a catalogue reference + curator note + focus skills).
 * - Any other block is prose: before the first heading it's the collection intro (`bodyMdx`); under a
 *   heading (before/around its items) it's that section's description.
 *
 * Prose is (de)serialized with content-serde's `docToMdx`/`mdxToDoc`, so it stays byte-consistent with
 * how content bodies round-trip.
 */

/** The item node's type name in the collection document. */
export const COLLECTION_ITEM_NODE = 'tmrCollectionItem';

export interface CollectionDocItem {
  contentSlug: string;
  curatorNote?: string;
  focusSkills?: string[];
}

export interface CollectionDocSection {
  title: string;
  description?: string;
  items: CollectionDocItem[];
}

export interface CollectionDocData {
  /** Intro prose before the first section heading. */
  bodyMdx: string;
  /** Items that appear before any section heading. */
  ungrouped: CollectionDocItem[];
  sections: CollectionDocSection[];
}

function blocksToMdx(blocks: PMNode[]): string {
  if (blocks.length === 0) {
    return '';
  }
  return docToMdx({ type: 'doc', content: blocks }).bodyMdx;
}

function mdxToBlocks(mdx: string): PMNode[] {
  return mdx.trim() ? (mdxToDoc(mdx, []).content ?? []) : [];
}

function headingText(node: PMNode): string {
  return (node.content ?? [])
    .map((c) => c.text ?? '')
    .join('')
    .trim();
}

function nodeToItem(node: PMNode): CollectionDocItem | null {
  const slug = typeof node.attrs?.contentSlug === 'string' ? node.attrs.contentSlug.trim() : '';
  if (!slug) {
    return null;
  }
  const note = typeof node.attrs?.curatorNote === 'string' ? node.attrs.curatorNote.trim() : '';
  const skills = Array.isArray(node.attrs?.focusSkills)
    ? (node.attrs.focusSkills as unknown[]).filter((s): s is string => typeof s === 'string')
    : [];
  return {
    contentSlug: slug,
    curatorNote: note || undefined,
    focusSkills: skills.length ? skills : undefined,
  };
}

function itemToNode(item: CollectionDocItem): PMNode {
  return {
    type: COLLECTION_ITEM_NODE,
    attrs: {
      contentSlug: item.contentSlug,
      curatorNote: item.curatorNote ?? '',
      focusSkills: item.focusSkills ?? [],
    },
  };
}

/** Walk the editor document top-to-bottom into a collection's structure. */
export function docToCollection(doc: PMDoc): CollectionDocData {
  const introBlocks: PMNode[] = [];
  const ungrouped: CollectionDocItem[] = [];
  const sections: CollectionDocSection[] = [];
  let current: { title: string; descBlocks: PMNode[]; items: CollectionDocItem[] } | null = null;

  const flush = () => {
    if (current) {
      sections.push({
        title: current.title,
        description: blocksToMdx(current.descBlocks) || undefined,
        items: current.items,
      });
    }
  };

  for (const node of doc.content ?? []) {
    if (node.type === 'heading') {
      flush();
      current = { title: headingText(node), descBlocks: [], items: [] };
    } else if (node.type === COLLECTION_ITEM_NODE) {
      const item = nodeToItem(node);
      if (item) {
        (current ? current.items : ungrouped).push(item);
      }
    } else {
      (current ? current.descBlocks : introBlocks).push(node);
    }
  }
  flush();

  return { bodyMdx: blocksToMdx(introBlocks), ungrouped, sections };
}

/** Build an editor document from a collection's structure (for opening an existing collection). */
export function collectionToDoc(data: CollectionDocData): PMDoc {
  const content: PMNode[] = [];
  content.push(...mdxToBlocks(data.bodyMdx));
  for (const item of data.ungrouped) {
    content.push(itemToNode(item));
  }
  for (const section of data.sections) {
    content.push({
      type: 'heading',
      attrs: { level: 2 },
      content: section.title ? [{ type: 'text', text: section.title }] : [],
    });
    content.push(...mdxToBlocks(section.description ?? ''));
    for (const item of section.items) {
      content.push(itemToNode(item));
    }
  }
  // ProseMirror requires a non-empty doc — fall back to an empty paragraph.
  if (content.length === 0) {
    content.push({ type: 'paragraph' });
  }
  return { type: 'doc', content };
}
