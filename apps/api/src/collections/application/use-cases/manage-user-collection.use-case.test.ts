import { describe, expect, it, vi } from 'vitest';
import { CollectionForbiddenError } from '../../domain/errors/collection-forbidden.error';
import { CollectionNotFoundError } from '../../domain/errors/collection-not-found.error';
import type { CollectionDetailAssembler } from '../collection-detail.assembler';
import type { CollectionRepository } from '../ports/collection-repository.port';
import {
  DeleteUserCollectionUseCase,
  UpdateUserCollectionUseCase,
} from './manage-user-collection.use-case';

const assembler = {
  assemble: vi.fn().mockResolvedValue({}),
} as unknown as CollectionDetailAssembler;

function repoReturning(collection: unknown): CollectionRepository {
  return {
    getBySlug: vi.fn().mockResolvedValue(collection),
    update: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
  } as unknown as CollectionRepository;
}

describe('user collection ownership', () => {
  it('404s when the collection does not exist', async () => {
    const repo = repoReturning(null);
    const useCase = new DeleteUserCollectionUseCase(repo);
    await expect(useCase.execute('user-1', 'missing')).rejects.toBeInstanceOf(
      CollectionNotFoundError,
    );
  });

  it('403s when another user tries to update a user collection', async () => {
    const repo = repoReturning({ curationType: 'user', ownerId: 'owner', kind: 'songlist' });
    const useCase = new UpdateUserCollectionUseCase(repo, assembler);
    await expect(useCase.execute('intruder', 'c1', { title: 'Hacked' })).rejects.toBeInstanceOf(
      CollectionForbiddenError,
    );
  });

  it('403s when trying to edit an editorial collection', async () => {
    const repo = repoReturning({ curationType: 'editorial', ownerId: null, kind: 'course' });
    const useCase = new DeleteUserCollectionUseCase(repo);
    await expect(useCase.execute('anyone', 'editorial-one')).rejects.toBeInstanceOf(
      CollectionForbiddenError,
    );
  });

  it('allows the owner to delete their own collection', async () => {
    const repo = repoReturning({ curationType: 'user', ownerId: 'owner', kind: 'songlist' });
    const useCase = new DeleteUserCollectionUseCase(repo);
    await expect(useCase.execute('owner', 'c1')).resolves.toBeUndefined();
    expect(repo.delete).toHaveBeenCalledWith('c1');
  });
});
