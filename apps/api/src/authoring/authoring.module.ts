import { Module } from '@nestjs/common';
import { CatalogueModule } from '../catalogue/catalogue.module';
import { ContentDetailReader } from './application/content-detail-reader';
import { ContentAuthoring } from './application/ports/content-authoring.port';
import { TaxonomyCatalog } from './application/ports/taxonomy-catalog.port';
import { CreateContentUseCase } from './application/use-cases/create-content.use-case';
import { CreateTaxonomyUseCase } from './application/use-cases/create-taxonomy.use-case';
import { DeleteContentUseCase } from './application/use-cases/delete-content.use-case';
import { GetContentForEditUseCase } from './application/use-cases/get-content-for-edit.use-case';
import { ListContentUseCase } from './application/use-cases/list-content.use-case';
import { ListTaxonomyUseCase } from './application/use-cases/list-taxonomy.use-case';
import { RequestMediaUploadUseCase } from './application/use-cases/request-media-upload.use-case';
import { SetContentStatusUseCase } from './application/use-cases/set-content-status.use-case';
import { UpdateContentUseCase } from './application/use-cases/update-content.use-case';
import { AuthoringController } from './authoring.controller';
import { DrizzleContentAuthoring } from './infrastructure/drizzle-content-authoring.adapter';
import { DrizzleTaxonomyCatalog } from './infrastructure/drizzle-taxonomy-catalog.adapter';

/**
 * Admin CMS feature (hexagonal). Imports CatalogueModule to reuse the read `ContentRepository`,
 * `MediaLibrary`, and `CatalogueReindexService` (reindex-on-write). Write ports are bound here.
 */
@Module({
  imports: [CatalogueModule],
  controllers: [AuthoringController],
  providers: [
    ContentDetailReader,
    ListContentUseCase,
    CreateContentUseCase,
    GetContentForEditUseCase,
    UpdateContentUseCase,
    SetContentStatusUseCase,
    DeleteContentUseCase,
    RequestMediaUploadUseCase,
    ListTaxonomyUseCase,
    CreateTaxonomyUseCase,
    { provide: ContentAuthoring, useClass: DrizzleContentAuthoring },
    { provide: TaxonomyCatalog, useClass: DrizzleTaxonomyCatalog },
  ],
})
export class AuthoringModule {}
