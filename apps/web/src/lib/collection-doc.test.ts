import type { PMDoc } from '@TheY2T/tmr-content-serde';
import { describe, expect, it } from 'vitest';
import {
  COLLECTION_ITEM_NODE,
  type CollectionDocData,
  collectionToDoc,
  docToCollection,
} from './collection-doc';

const item = (
  contentSlug: string,
  curatorNote?: string,
  focusSkills?: string[],
): PMDoc['content'][number] => ({
  type: COLLECTION_ITEM_NODE,
  attrs: { contentSlug, curatorNote: curatorNote ?? '', focusSkills: focusSkills ?? [] },
});
const para = (text: string) => ({ type: 'paragraph', content: [{ type: 'text', text }] });
const h2 = (text: string) => ({
  type: 'heading',
  attrs: { level: 2 },
  content: [{ type: 'text', text }],
});

describe('docToCollection', () => {
  it('splits intro prose, ungrouped items, and chaptered sections', () => {
    const doc: PMDoc = {
      type: 'doc',
      content: [
        para('An intro to the collection.'),
        item('warm-up-scale'),
        h2('Preludes'),
        para('Keep it even.'),
        item('bach-prelude', 'Steady tempo', ['evenness']),
        h2('Counterpoint'),
        item('bach-invention'),
      ],
    };
    const result = docToCollection(doc);
    expect(result.bodyMdx).toBe('An intro to the collection.');
    expect(result.ungrouped).toEqual([{ contentSlug: 'warm-up-scale' }]);
    expect(result.sections).toHaveLength(2);
    expect(result.sections[0]).toEqual({
      title: 'Preludes',
      description: 'Keep it even.',
      items: [
        { contentSlug: 'bach-prelude', curatorNote: 'Steady tempo', focusSkills: ['evenness'] },
      ],
    });
    expect(result.sections[1]).toEqual({
      title: 'Counterpoint',
      description: undefined,
      items: [{ contentSlug: 'bach-invention' }],
    });
  });

  it('drops items with no content slug', () => {
    const doc: PMDoc = { type: 'doc', content: [item(''), item('  ')] };
    expect(docToCollection(doc).ungrouped).toEqual([]);
  });

  it('handles a doc with only prose (no sections/items)', () => {
    const doc: PMDoc = { type: 'doc', content: [para('Just a description.')] };
    const result = docToCollection(doc);
    expect(result.bodyMdx).toBe('Just a description.');
    expect(result.ungrouped).toEqual([]);
    expect(result.sections).toEqual([]);
  });
});

describe('round-trip', () => {
  it('collectionToDoc → docToCollection preserves structure', () => {
    const data: CollectionDocData = {
      bodyMdx: 'Learn the Baroque style.',
      ungrouped: [{ contentSlug: 'warm-up' }],
      sections: [
        {
          title: 'Preludes',
          description: 'Even figuration.',
          items: [
            { contentSlug: 'bach-prelude', curatorNote: 'Steady', focusSkills: ['evenness'] },
          ],
        },
        { title: 'Inventions', description: undefined, items: [{ contentSlug: 'bach-invention' }] },
      ],
    };
    expect(docToCollection(collectionToDoc(data))).toEqual(data);
  });

  it('produces a non-empty doc for empty input', () => {
    const doc = collectionToDoc({ bodyMdx: '', ungrouped: [], sections: [] });
    expect(doc.content.length).toBeGreaterThan(0);
  });
});
