import { describe, expect, it } from 'vitest';
import type { ContentRepository } from '../../catalogue/application/ports/content-repository.port';
import type { ContentItem } from '../../catalogue/domain/content-item';
import type { Collection } from '../domain/collection';
import { CollectionDetailAssembler } from './collection-detail.assembler';

function content(slug: string, status = 'published'): ContentItem {
  return {
    id: slug,
    slug,
    title: slug,
    summary: null,
    bodyMdx: null,
    type: 'lesson',
    visibility: 'public',
    tier: null,
    status,
    difficulty: 2,
    source: null,
    attribution: null,
    license: null,
    details: null,
    bodyDoc: null,
    genres: [],
    instruments: [],
    topics: [],
    media: [],
  } as unknown as ContentItem;
}

/** A ContentRepository stub whose `getBySlug` reads from a fixed map. */
function repo(items: Record<string, ContentItem>): ContentRepository {
  return {
    getBySlug: (slug: string) => Promise.resolve(items[slug] ?? null),
  } as unknown as ContentRepository;
}

function collection(overrides: Partial<Collection> = {}): Collection {
  return {
    id: 'c1',
    slug: 'c1',
    title: 'Test',
    summary: null,
    bodyMdx: null,
    kind: 'course',
    visibility: 'public',
    status: 'published',
    curationType: 'editorial',
    ownerId: null,
    heroImageKey: null,
    accent: null,
    featured: false,
    difficultyMin: null,
    difficultyMax: null,
    estMinutes: null,
    curatorName: null,
    curatorBio: null,
    outcomes: null,
    facets: null,
    tags: null,
    popularity: 0,
    createdAt: new Date(0),
    updatedAt: new Date(0),
    itemSlugs: [],
    sections: [],
    items: [],
    ...overrides,
  };
}

describe('CollectionDetailAssembler', () => {
  it('groups resolved items into their sections, carrying per-item notes', async () => {
    const assembler = new CollectionDetailAssembler(repo({ a: content('a'), b: content('b') }));
    const col = collection({
      itemSlugs: ['a', 'b'],
      sections: [
        { id: 's1', title: 'One', description: null, position: 0, itemSlugs: ['a'] },
        { id: 's2', title: 'Two', description: null, position: 1, itemSlugs: ['b'] },
      ],
      items: [
        { contentSlug: 'a', sectionId: 's1', curatorNote: 'focus here', focusSkills: ['reading'] },
        { contentSlug: 'b', sectionId: 's2', curatorNote: null, focusSkills: null },
      ],
    });

    const view = await assembler.assemble(col, { publishedOnly: true });

    expect(view.itemCount).toBe(2);
    expect(view.sections.map((s) => s.id)).toEqual(['s1', 's2']);
    expect(view.sections[0]?.items[0]?.curatorNote).toBe('focus here');
    expect(view.sections[0]?.items[0]?.focusSkills).toEqual(['reading']);
  });

  it('drops unpublished/missing items and renumbers positions in published views', async () => {
    const assembler = new CollectionDetailAssembler(
      repo({ a: content('a'), b: content('b', 'draft') }),
    );
    const col = collection({
      itemSlugs: ['a', 'b', 'gone'],
      items: [
        { contentSlug: 'a', sectionId: null, curatorNote: null, focusSkills: null },
        { contentSlug: 'b', sectionId: null, curatorNote: null, focusSkills: null },
        { contentSlug: 'gone', sectionId: null, curatorNote: null, focusSkills: null },
      ],
    });

    const view = await assembler.assemble(col, { publishedOnly: true });

    expect(view.items).toHaveLength(1);
    expect(view.items[0]?.content.slug).toBe('a');
    expect(view.items[0]?.position).toBe(0);
  });

  it('computes completion, percent and the next incomplete item', async () => {
    const assembler = new CollectionDetailAssembler(
      repo({ a: content('a'), b: content('b'), c: content('c') }),
    );
    const col = collection({
      itemSlugs: ['a', 'b', 'c'],
      items: ['a', 'b', 'c'].map((s) => ({
        contentSlug: s,
        sectionId: null,
        curatorNote: null,
        focusSkills: null,
      })),
    });

    const view = await assembler.assembleWithProgress(col, {
      publishedOnly: true,
      completedSlugs: ['a'],
    });

    expect(view.completedCount).toBe(1);
    expect(view.percentComplete).toBe(33);
    expect(view.nextUpSlug).toBe('b');
  });
});
