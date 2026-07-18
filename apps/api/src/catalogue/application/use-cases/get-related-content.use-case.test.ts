import { describe, expect, it, vi } from 'vitest';
import type { ContentTranslations } from '../../../translations/application/ports/content-translations.port';
import type { ContentItem } from '../../domain/content-item';
import type { ContentRepository } from '../ports/content-repository.port';
import { GetRelatedContentUseCase } from './get-related-content.use-case';

function translations(
  overlays: Map<string, Record<string, string>> = new Map(),
): ContentTranslations {
  return {
    overlay: vi.fn().mockResolvedValue({}),
    overlayMany: vi.fn().mockResolvedValue(overlays),
  } as unknown as ContentTranslations;
}

function item(slug: string, over: Partial<ContentItem> = {}): ContentItem {
  const now = new Date('2026-01-01T00:00:00.000Z');
  return {
    id: `id-${slug}`,
    slug,
    title: slug,
    summary: null,
    bodyMdx: null,
    type: 'score',
    visibility: 'public',
    tier: null,
    status: 'published',
    difficulty: null,
    source: null,
    attribution: null,
    license: null,
    details: null,
    bodyDoc: null,
    createdAt: now,
    updatedAt: now,
    genres: [],
    instruments: [],
    topics: [],
    tags: [],
    media: [],
    ...over,
  };
}

function repo(over: Partial<ContentRepository>): ContentRepository {
  return {
    getBySlug: vi.fn(),
    findAllPublished: vi.fn(),
    findRelated: vi.fn().mockResolvedValue([]),
    findManyBySlugs: vi.fn().mockResolvedValue([]),
    ...over,
  } as unknown as ContentRepository;
}

describe('GetRelatedContentUseCase', () => {
  it('returns the curated related slugs (in order) when present', async () => {
    const repository = repo({
      getBySlug: vi.fn().mockResolvedValue(item('a', { details: { related: ['b', 'c'] } })),
      findManyBySlugs: vi.fn().mockResolvedValue([item('b'), item('c')]),
      findRelated: vi.fn().mockResolvedValue([item('z')]),
    });
    const result = await new GetRelatedContentUseCase(repository, translations()).execute('a');
    expect(result.map((r) => r.slug)).toEqual(['b', 'c']);
    expect(repository.findManyBySlugs).toHaveBeenCalledWith(['b', 'c']);
    expect(repository.findRelated).not.toHaveBeenCalled();
  });

  it('falls back to algorithmic related when there are no curated slugs', async () => {
    const repository = repo({
      getBySlug: vi.fn().mockResolvedValue(item('a', { details: null })),
      findRelated: vi.fn().mockResolvedValue([item('x'), item('y')]),
    });
    const result = await new GetRelatedContentUseCase(repository, translations()).execute('a');
    expect(result.map((r) => r.slug)).toEqual(['x', 'y']);
    expect(repository.findRelated).toHaveBeenCalled();
  });

  it('falls back when curated slugs resolve to nothing (all missing/unpublished)', async () => {
    const repository = repo({
      getBySlug: vi.fn().mockResolvedValue(item('a', { details: { related: ['gone'] } })),
      findManyBySlugs: vi.fn().mockResolvedValue([]),
      findRelated: vi.fn().mockResolvedValue([item('x')]),
    });
    const result = await new GetRelatedContentUseCase(repository, translations()).execute('a');
    expect(result.map((r) => r.slug)).toEqual(['x']);
    expect(repository.findRelated).toHaveBeenCalled();
  });

  it('overlays published translations onto related items for a locale', async () => {
    const repository = repo({
      getBySlug: vi.fn().mockResolvedValue(item('a', { details: { related: ['b'] } })),
      findManyBySlugs: vi.fn().mockResolvedValue([item('b', { title: 'B', summary: 'base' })]),
    });
    const overlays = new Map([['id-b', { title: 'B-zh', summary: 'summary-zh' }]]);
    const result = await new GetRelatedContentUseCase(repository, translations(overlays)).execute(
      'a',
      'zh-Hans',
    );
    expect(result[0]?.title).toBe('B-zh');
    expect(result[0]?.summary).toBe('summary-zh');
  });
});
