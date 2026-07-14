import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import {
  type Collection,
  type CollectionDetailView,
  type CollectionItemWriteData,
  type CollectionSummaryView,
  toCollectionSummaryView,
} from '../../domain/collection';
import { CollectionForbiddenError } from '../../domain/errors/collection-forbidden.error';
import { CollectionNotFoundError } from '../../domain/errors/collection-not-found.error';
import { CollectionDetailAssembler } from '../collection-detail.assembler';
import { CollectionRepository } from '../ports/collection-repository.port';

export interface UserCollectionWriteInput {
  title: string;
  summary?: string | null;
  bodyMdx?: string | null;
  visibility?: 'public' | 'authed' | 'private';
}

function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 48);
  return `${base || 'collection'}-${randomUUID().slice(0, 6)}`;
}

/** Load a user-owned collection or throw (404 unknown, 403 not owner / editorial). */
async function requireOwned(
  repository: CollectionRepository,
  slug: string,
  userId: string,
): Promise<Collection> {
  const collection = await repository.getBySlug(slug);
  if (!collection) {
    throw new CollectionNotFoundError(slug);
  }
  if (collection.curationType !== 'user' || collection.ownerId !== userId) {
    throw new CollectionForbiddenError(slug);
  }
  return collection;
}

@Injectable()
export class ListMyCollectionsUseCase {
  constructor(private readonly repository: CollectionRepository) {}

  async execute(userId: string): Promise<CollectionSummaryView[]> {
    const collections = await this.repository.listByOwner(userId);
    return collections.map((c) => toCollectionSummaryView(c));
  }
}

@Injectable()
export class GetMyCollectionUseCase {
  constructor(
    private readonly repository: CollectionRepository,
    private readonly assembler: CollectionDetailAssembler,
  ) {}

  async execute(userId: string, slug: string): Promise<CollectionDetailView> {
    const collection = await requireOwned(this.repository, slug, userId);
    return this.assembler.assemble(collection, { publishedOnly: false });
  }
}

@Injectable()
export class CreateUserCollectionUseCase {
  constructor(
    private readonly repository: CollectionRepository,
    private readonly assembler: CollectionDetailAssembler,
  ) {}

  async execute(userId: string, input: UserCollectionWriteInput): Promise<CollectionDetailView> {
    const slug = slugify(input.title);
    await this.repository.create({
      slug,
      title: input.title,
      summary: input.summary ?? null,
      bodyMdx: input.bodyMdx ?? null,
      kind: 'songlist',
      visibility: input.visibility ?? 'private',
      curationType: 'user',
      ownerId: userId,
    });
    // User collections are immediately live (visibility, not status, gates who sees them).
    await this.repository.setStatus(slug, 'published');
    const collection = await this.repository.getBySlug(slug);
    if (!collection) {
      throw new CollectionNotFoundError(slug);
    }
    return this.assembler.assemble(collection, { publishedOnly: false });
  }
}

@Injectable()
export class UpdateUserCollectionUseCase {
  constructor(
    private readonly repository: CollectionRepository,
    private readonly assembler: CollectionDetailAssembler,
  ) {}

  async execute(
    userId: string,
    slug: string,
    input: UserCollectionWriteInput,
  ): Promise<CollectionDetailView> {
    const existing = await requireOwned(this.repository, slug, userId);
    await this.repository.update(slug, {
      slug,
      title: input.title,
      summary: input.summary ?? null,
      bodyMdx: input.bodyMdx ?? null,
      kind: existing.kind,
      visibility: input.visibility ?? existing.visibility,
      curationType: 'user',
      ownerId: userId,
    });
    const collection = await this.repository.getBySlug(slug);
    if (!collection) {
      throw new CollectionNotFoundError(slug);
    }
    return this.assembler.assemble(collection, { publishedOnly: false });
  }
}

@Injectable()
export class SetUserCollectionItemsUseCase {
  constructor(
    private readonly repository: CollectionRepository,
    private readonly assembler: CollectionDetailAssembler,
  ) {}

  async execute(
    userId: string,
    slug: string,
    items: CollectionItemWriteData[],
  ): Promise<CollectionDetailView> {
    await requireOwned(this.repository, slug, userId);
    await this.repository.setItems(slug, items);
    const collection = await this.repository.getBySlug(slug);
    if (!collection) {
      throw new CollectionNotFoundError(slug);
    }
    return this.assembler.assemble(collection, { publishedOnly: false });
  }
}

@Injectable()
export class DeleteUserCollectionUseCase {
  constructor(private readonly repository: CollectionRepository) {}

  async execute(userId: string, slug: string): Promise<void> {
    await requireOwned(this.repository, slug, userId);
    await this.repository.delete(slug);
  }
}
