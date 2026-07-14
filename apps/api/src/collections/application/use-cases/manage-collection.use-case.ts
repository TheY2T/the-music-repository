import { Injectable } from '@nestjs/common';
import type {
  CollectionDetailView,
  CollectionItemWriteData,
  CollectionSectionWriteData,
  CollectionWriteData,
} from '../../domain/collection';
import { CollectionNotFoundError } from '../../domain/errors/collection-not-found.error';
import { CollectionSlugConflictError } from '../../domain/errors/collection-slug-conflict.error';
import { CollectionDetailAssembler } from '../collection-detail.assembler';
import { CollectionRepository } from '../ports/collection-repository.port';

/** Shared helper: re-read a collection and assemble the admin detail view (all items, any status). */
async function adminDetail(
  repository: CollectionRepository,
  assembler: CollectionDetailAssembler,
  slug: string,
): Promise<CollectionDetailView> {
  const collection = await repository.getBySlug(slug);
  if (!collection) {
    throw new CollectionNotFoundError(slug);
  }
  return assembler.assemble(collection, { publishedOnly: false });
}

@Injectable()
export class CreateCollectionUseCase {
  constructor(
    private readonly repository: CollectionRepository,
    private readonly assembler: CollectionDetailAssembler,
  ) {}

  async execute(data: CollectionWriteData): Promise<CollectionDetailView> {
    if (await this.repository.exists(data.slug)) {
      throw new CollectionSlugConflictError(data.slug);
    }
    await this.repository.create(data);
    return adminDetail(this.repository, this.assembler, data.slug);
  }
}

@Injectable()
export class UpdateCollectionUseCase {
  constructor(
    private readonly repository: CollectionRepository,
    private readonly assembler: CollectionDetailAssembler,
  ) {}

  async execute(slug: string, data: CollectionWriteData): Promise<CollectionDetailView> {
    if (!(await this.repository.exists(slug))) {
      throw new CollectionNotFoundError(slug);
    }
    await this.repository.update(slug, data);
    return adminDetail(this.repository, this.assembler, slug);
  }
}

@Injectable()
export class SetCollectionStatusUseCase {
  constructor(
    private readonly repository: CollectionRepository,
    private readonly assembler: CollectionDetailAssembler,
  ) {}

  async execute(slug: string, status: 'published' | 'draft'): Promise<CollectionDetailView> {
    if (!(await this.repository.exists(slug))) {
      throw new CollectionNotFoundError(slug);
    }
    await this.repository.setStatus(slug, status);
    return adminDetail(this.repository, this.assembler, slug);
  }
}

@Injectable()
export class SetCollectionSectionsUseCase {
  constructor(
    private readonly repository: CollectionRepository,
    private readonly assembler: CollectionDetailAssembler,
  ) {}

  async execute(
    slug: string,
    sections: CollectionSectionWriteData[],
  ): Promise<CollectionDetailView> {
    if (!(await this.repository.exists(slug))) {
      throw new CollectionNotFoundError(slug);
    }
    await this.repository.setSections(slug, sections);
    return adminDetail(this.repository, this.assembler, slug);
  }
}

@Injectable()
export class SetCollectionItemsUseCase {
  constructor(
    private readonly repository: CollectionRepository,
    private readonly assembler: CollectionDetailAssembler,
  ) {}

  async execute(slug: string, items: CollectionItemWriteData[]): Promise<CollectionDetailView> {
    if (!(await this.repository.exists(slug))) {
      throw new CollectionNotFoundError(slug);
    }
    await this.repository.setItems(slug, items);
    return adminDetail(this.repository, this.assembler, slug);
  }
}

@Injectable()
export class DeleteCollectionUseCase {
  constructor(private readonly repository: CollectionRepository) {}

  async execute(slug: string): Promise<void> {
    if (!(await this.repository.exists(slug))) {
      throw new CollectionNotFoundError(slug);
    }
    await this.repository.delete(slug);
  }
}
