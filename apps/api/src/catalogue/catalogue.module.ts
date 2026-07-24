import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EntitlementsModule } from '../entitlements/entitlements.module';
import { DATABASE, type Database } from '../infrastructure/database/database.module';
import { TranslationsModule } from '../translations/translations.module';
import { CatalogueSearch } from './application/ports/catalogue-search.port';
import { ContentRepository } from './application/ports/content-repository.port';
import { MediaLibrary } from './application/ports/media-library.port';
import { GetContentBySlugUseCase } from './application/use-cases/get-content-by-slug.use-case';
import { GetRelatedContentUseCase } from './application/use-cases/get-related-content.use-case';
import { SearchCatalogueUseCase } from './application/use-cases/search-catalogue.use-case';
import { CatalogueController } from './catalogue.controller';
import { CatalogueReindexService } from './infrastructure/catalogue-reindex.service';
import { DrizzleContentRepository } from './infrastructure/drizzle-content.repository';
import { MeiliCatalogueSearch } from './infrastructure/meili-catalogue-search.adapter';
import { PostgresCatalogueSearch } from './infrastructure/postgres-catalogue-search.adapter';
import { PostgresMediaLibrary } from './infrastructure/postgres-media-library.adapter';
import { S3MediaLibrary } from './infrastructure/s3-media-library.adapter';
import { MediaController } from './media.controller';

/**
 * Catalogue feature (hexagonal). Ports are named for the capability the core needs
 * (`ContentRepository`, `CatalogueSearch`, `MediaLibrary`); adapters name the technology. Swap an
 * adapter here to change tech.
 */
@Module({
  imports: [EntitlementsModule, TranslationsModule],
  controllers: [CatalogueController, MediaController],
  providers: [
    SearchCatalogueUseCase,
    GetContentBySlugUseCase,
    GetRelatedContentUseCase,
    CatalogueReindexService,
    { provide: ContentRepository, useClass: DrizzleContentRepository },
    {
      // Meilisearch when MEILI_HOST is configured, else in-memory search over Postgres.
      provide: CatalogueSearch,
      useFactory: (config: ConfigService, repository: ContentRepository) =>
        config.get<string>('MEILI_HOST')
          ? new MeiliCatalogueSearch(config, repository)
          : new PostgresCatalogueSearch(repository),
      inject: [ConfigService, ContentRepository],
    },
    {
      // S3/R2 object storage when R2_BUCKET is configured, else media bytes in Postgres.
      provide: MediaLibrary,
      useFactory: (config: ConfigService, db: Database) =>
        config.get<string>('R2_BUCKET')
          ? new S3MediaLibrary(config)
          : new PostgresMediaLibrary(db, config),
      inject: [ConfigService, DATABASE],
    },
  ],
  // Exported so the seed can reindex + upload media.
  exports: [CatalogueReindexService, MediaLibrary, ContentRepository, CatalogueSearch],
})
export class CatalogueModule {}
