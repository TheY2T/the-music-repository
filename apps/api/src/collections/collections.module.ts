import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CatalogueModule } from '../catalogue/catalogue.module';
import { CollectionDetailAssembler } from './application/collection-detail.assembler';
import { CollectionBookmarks } from './application/ports/collection-bookmarks.port';
import { CollectionRatings } from './application/ports/collection-ratings.port';
import { CollectionRepository } from './application/ports/collection-repository.port';
import { CollectionSearchIndex } from './application/ports/collection-search.port';
import { LearnerProgress } from './application/ports/learner-progress.port';
import {
  AddCollectionBookmarkUseCase,
  ListCollectionBookmarksUseCase,
  RateCollectionUseCase,
  RecordCollectionOpenUseCase,
  RemoveCollectionBookmarkUseCase,
} from './application/use-cases/collection-engagement.use-case';
import {
  GetCollectionBySlugUseCase,
  GetCollectionForEditUseCase,
} from './application/use-cases/get-collection.use-case';
import { GetCollectionWithProgressUseCase } from './application/use-cases/get-collection-progress.use-case';
import {
  ListCollectionsAdminUseCase,
  ListCollectionsUseCase,
} from './application/use-cases/list-collections.use-case';
import {
  CreateCollectionUseCase,
  DeleteCollectionUseCase,
  SetCollectionItemsUseCase,
  SetCollectionSectionsUseCase,
  SetCollectionStatusUseCase,
  UpdateCollectionUseCase,
} from './application/use-cases/manage-collection.use-case';
import {
  CreateUserCollectionUseCase,
  DeleteUserCollectionUseCase,
  GetMyCollectionUseCase,
  ListMyCollectionsUseCase,
  SetUserCollectionItemsUseCase,
  UpdateUserCollectionUseCase,
} from './application/use-cases/manage-user-collection.use-case';
import { SearchCollectionsUseCase } from './application/use-cases/search-collections.use-case';
import { CollectionAuthoringController } from './collection-authoring.controller';
import { CollectionsController } from './collections.controller';
import { CollectionsPersonalController } from './collections-personal.controller';
import { CollectionReindexService } from './infrastructure/collection-reindex.service';
import { DrizzleCollectionRepository } from './infrastructure/drizzle-collection.repository';
import { DrizzleCollectionBookmarks } from './infrastructure/drizzle-collection-bookmarks.repository';
import { DrizzleCollectionRatings } from './infrastructure/drizzle-collection-ratings.repository';
import { DrizzleLearnerProgress } from './infrastructure/drizzle-learner-progress';
import { MeilisearchCollectionSearch } from './infrastructure/meilisearch-collection-search.adapter';

/**
 * Collections feature (hexagonal). Imports CatalogueModule to reuse `ContentRepository` for resolving
 * items into summaries, and AuthModule for `CurrentUser` on personal/engagement routes. Binds the
 * collection repository + bookmark/rating/progress ports to their Drizzle adapters. Exports
 * `CollectionRepository` (consumed by the progress module).
 */
@Module({
  imports: [CatalogueModule, AuthModule],
  controllers: [
    CollectionsController,
    CollectionsPersonalController,
    CollectionAuthoringController,
  ],
  providers: [
    CollectionDetailAssembler,
    // Public + admin reads/writes
    ListCollectionsUseCase,
    ListCollectionsAdminUseCase,
    SearchCollectionsUseCase,
    GetCollectionBySlugUseCase,
    GetCollectionForEditUseCase,
    GetCollectionWithProgressUseCase,
    CreateCollectionUseCase,
    UpdateCollectionUseCase,
    SetCollectionItemsUseCase,
    SetCollectionSectionsUseCase,
    SetCollectionStatusUseCase,
    DeleteCollectionUseCase,
    // Engagement
    AddCollectionBookmarkUseCase,
    RemoveCollectionBookmarkUseCase,
    ListCollectionBookmarksUseCase,
    RateCollectionUseCase,
    RecordCollectionOpenUseCase,
    // User-created collections
    ListMyCollectionsUseCase,
    GetMyCollectionUseCase,
    CreateUserCollectionUseCase,
    UpdateUserCollectionUseCase,
    SetUserCollectionItemsUseCase,
    DeleteUserCollectionUseCase,
    // Discovery
    CollectionReindexService,
    // Ports → adapters
    { provide: CollectionRepository, useClass: DrizzleCollectionRepository },
    { provide: CollectionBookmarks, useClass: DrizzleCollectionBookmarks },
    { provide: CollectionRatings, useClass: DrizzleCollectionRatings },
    { provide: LearnerProgress, useClass: DrizzleLearnerProgress },
    { provide: CollectionSearchIndex, useClass: MeilisearchCollectionSearch },
  ],
  exports: [CollectionRepository, CollectionReindexService],
})
export class CollectionsModule {}
