import { Module } from '@nestjs/common';
import { CatalogueSearch } from './application/ports/catalogue-search.port';
import { ContentRepository } from './application/ports/content-repository.port';
import { MediaLibrary } from './application/ports/media-library.port';
import { GetContentBySlugUseCase } from './application/use-cases/get-content-by-slug.use-case';
import { SearchCatalogueUseCase } from './application/use-cases/search-catalogue.use-case';
import { CatalogueController } from './catalogue.controller';
import { CatalogueReindexService } from './infrastructure/catalogue-reindex.service';
import { DrizzleContentRepository } from './infrastructure/drizzle-content.repository';
import { MeilisearchCatalogueSearch } from './infrastructure/meilisearch-catalogue-search.adapter';
import { S3MediaLibrary } from './infrastructure/s3-media-library.adapter';

/**
 * Catalogue feature (hexagonal). Ports are named for the capability the core needs
 * (`ContentRepository`, `CatalogueSearch`, `MediaLibrary`); adapters name the technology. Swap an
 * adapter here to change tech.
 */
@Module({
  controllers: [CatalogueController],
  providers: [
    SearchCatalogueUseCase,
    GetContentBySlugUseCase,
    CatalogueReindexService,
    { provide: ContentRepository, useClass: DrizzleContentRepository },
    { provide: CatalogueSearch, useClass: MeilisearchCatalogueSearch },
    { provide: MediaLibrary, useClass: S3MediaLibrary },
  ],
  // Exported so the seed can reindex + upload media.
  exports: [CatalogueReindexService, MediaLibrary, ContentRepository, CatalogueSearch],
})
export class CatalogueModule {}
