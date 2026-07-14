import { describe, expect, it, vi } from 'vitest';
import { CollectionInvalidRatingError } from '../../domain/errors/collection-invalid-rating.error';
import type { CollectionRatings } from '../ports/collection-ratings.port';
import { RateCollectionUseCase } from './collection-engagement.use-case';

function ratings(): CollectionRatings {
  return {
    rate: vi.fn().mockResolvedValue(undefined),
    getUserRating: vi.fn(),
    getAggregate: vi.fn().mockResolvedValue(new Map([['c1', { average: 4.5, count: 2 }]])),
  } as unknown as CollectionRatings;
}

describe('RateCollectionUseCase', () => {
  it.each([0, 6, 3.5, Number.NaN])('rejects out-of-range rating %s', async (value) => {
    const useCase = new RateCollectionUseCase(ratings());
    await expect(useCase.execute('u1', 'c1', value)).rejects.toBeInstanceOf(
      CollectionInvalidRatingError,
    );
  });

  it('persists a valid rating and returns the aggregate + the viewer rating', async () => {
    const store = ratings();
    const useCase = new RateCollectionUseCase(store);
    const result = await useCase.execute('u1', 'c1', 5);
    expect(store.rate).toHaveBeenCalledWith('u1', 'c1', 5);
    expect(result).toEqual({ average: 4.5, count: 2, yourRating: 5 });
  });
});
