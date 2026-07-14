import { Injectable } from '@nestjs/common';
import type { CollectionDetailView } from '../../domain/collection';
import { CollectionNotFoundError } from '../../domain/errors/collection-not-found.error';
import { CollectionDetailAssembler } from '../collection-detail.assembler';
import { CollectionRatings } from '../ports/collection-ratings.port';
import { CollectionRepository } from '../ports/collection-repository.port';

@Injectable()
export class GetCollectionBySlugUseCase {
  constructor(
    private readonly repository: CollectionRepository,
    private readonly assembler: CollectionDetailAssembler,
    private readonly ratings: CollectionRatings,
  ) {}

  /** Public: a published collection with its published items (renumbered), grouped into sections. */
  async execute(slug: string): Promise<CollectionDetailView> {
    const collection = await this.repository.getBySlug(slug);
    if (!collection || collection.status !== 'published' || collection.visibility === 'private') {
      throw new CollectionNotFoundError(slug);
    }
    const rating = (await this.ratings.getAggregate([slug])).get(slug);
    return this.assembler.assemble(collection, { publishedOnly: true, rating });
  }
}

@Injectable()
export class GetCollectionForEditUseCase {
  constructor(
    private readonly repository: CollectionRepository,
    private readonly assembler: CollectionDetailAssembler,
  ) {}

  /** Admin: any-status collection with every existing item. */
  async execute(slug: string): Promise<CollectionDetailView> {
    const collection = await this.repository.getBySlug(slug);
    if (!collection) {
      throw new CollectionNotFoundError(slug);
    }
    return this.assembler.assemble(collection, { publishedOnly: false });
  }
}
