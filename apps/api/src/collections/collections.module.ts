import { Module } from '@nestjs/common';
import { CatalogueModule } from '../catalogue/catalogue.module';
import { CollectionDetailAssembler } from './application/collection-detail.assembler';
import { CollectionRepository } from './application/ports/collection-repository.port';
import {
  GetCollectionBySlugUseCase,
  GetCollectionForEditUseCase,
} from './application/use-cases/get-collection.use-case';
import {
  ListCollectionsAdminUseCase,
  ListCollectionsUseCase,
} from './application/use-cases/list-collections.use-case';
import {
  CreateCollectionUseCase,
  DeleteCollectionUseCase,
  SetCollectionItemsUseCase,
  SetCollectionStatusUseCase,
  UpdateCollectionUseCase,
} from './application/use-cases/manage-collection.use-case';
import { CollectionAuthoringController } from './collection-authoring.controller';
import { CollectionsController } from './collections.controller';
import { DrizzleCollectionRepository } from './infrastructure/drizzle-collection.repository';

/**
 * Collections feature (Phase 2, hexagonal). Imports CatalogueModule to reuse `ContentRepository`
 * for resolving ordered items into `ContentSummary`. One `CollectionRepository` handles read + write.
 */
@Module({
  imports: [CatalogueModule],
  controllers: [CollectionsController, CollectionAuthoringController],
  providers: [
    CollectionDetailAssembler,
    ListCollectionsUseCase,
    ListCollectionsAdminUseCase,
    GetCollectionBySlugUseCase,
    GetCollectionForEditUseCase,
    CreateCollectionUseCase,
    UpdateCollectionUseCase,
    SetCollectionItemsUseCase,
    SetCollectionStatusUseCase,
    DeleteCollectionUseCase,
    { provide: CollectionRepository, useClass: DrizzleCollectionRepository },
  ],
})
export class CollectionsModule {}
