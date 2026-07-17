import { describe, expect, it, vi } from 'vitest';
import type { ContentDetailView } from '../../../catalogue/domain/content-item';
import type { CatalogueReindexService } from '../../../catalogue/infrastructure/catalogue-reindex.service';
import type { ContentDetailReader } from '../content-detail-reader';
import type { ContentAuthoring } from '../ports/content-authoring.port';
import type { ContentRevisions } from '../ports/content-revisions.port';
import { SetContentStatusUseCase } from './set-content-status.use-case';

function build() {
  const authoring = { exists: vi.fn().mockResolvedValue(true), setStatus: vi.fn() };
  const detail = { bySlug: vi.fn().mockResolvedValue({} as ContentDetailView) };
  const reindex = { reindex: vi.fn() };
  const revisions = { snapshot: vi.fn(), list: vi.fn(), restore: vi.fn() };
  const useCase = new SetContentStatusUseCase(
    authoring as unknown as ContentAuthoring,
    detail as unknown as ContentDetailReader,
    reindex as unknown as CatalogueReindexService,
    revisions as unknown as ContentRevisions,
  );
  return { useCase, authoring, reindex, revisions };
}

describe('SetContentStatusUseCase', () => {
  it('snapshots a revision when publishing, recording the author', async () => {
    const { useCase, revisions, reindex } = build();
    await useCase.execute('lesson-a', 'published', 'author-1');
    expect(revisions.snapshot).toHaveBeenCalledWith('lesson-a', 'author-1');
    expect(reindex.reindex).toHaveBeenCalled();
  });

  it('does not snapshot when unpublishing', async () => {
    const { useCase, revisions } = build();
    await useCase.execute('lesson-a', 'draft', 'author-1');
    expect(revisions.snapshot).not.toHaveBeenCalled();
  });

  it('moves an item to review without snapshotting, but still reindexes', async () => {
    const { useCase, authoring, revisions, reindex } = build();
    await useCase.execute('lesson-a', 'review', 'author-1');
    expect(authoring.setStatus).toHaveBeenCalledWith('lesson-a', 'review');
    expect(revisions.snapshot).not.toHaveBeenCalled();
    expect(reindex.reindex).toHaveBeenCalled();
  });
});
