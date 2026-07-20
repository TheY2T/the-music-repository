import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CatalogueModule } from '../catalogue/catalogue.module';
import { ContentDetailReader } from './application/content-detail-reader';
import { ContentAuthoring } from './application/ports/content-authoring.port';
import { ContentRevisions } from './application/ports/content-revisions.port';
import { TaxonomyCatalog } from './application/ports/taxonomy-catalog.port';
import { VideoPreviewLookup } from './application/ports/video-preview-lookup.port';
import { CreateContentUseCase } from './application/use-cases/create-content.use-case';
import { CreateTaxonomyUseCase } from './application/use-cases/create-taxonomy.use-case';
import { DeleteContentUseCase } from './application/use-cases/delete-content.use-case';
import { GetContentForEditUseCase } from './application/use-cases/get-content-for-edit.use-case';
import { GetVideoPreviewUseCase } from './application/use-cases/get-video-preview.use-case';
import { ListContentUseCase } from './application/use-cases/list-content.use-case';
import { ListContentRevisionsUseCase } from './application/use-cases/list-content-revisions.use-case';
import { ListTaxonomyUseCase } from './application/use-cases/list-taxonomy.use-case';
import { RequestMediaUploadUseCase } from './application/use-cases/request-media-upload.use-case';
import { RestoreContentRevisionUseCase } from './application/use-cases/restore-content-revision.use-case';
import { SetContentScoreUseCase } from './application/use-cases/set-content-score.use-case';
import { SetContentStatusUseCase } from './application/use-cases/set-content-status.use-case';
import { UpdateContentUseCase } from './application/use-cases/update-content.use-case';
import { VideoEmbedEnricher } from './application/video-embed-enricher';
import { AuthoringController } from './authoring.controller';
import { DrizzleContentAuthoring } from './infrastructure/drizzle-content-authoring.adapter';
import { DrizzleContentRevisions } from './infrastructure/drizzle-content-revisions.adapter';
import { DrizzleTaxonomyCatalog } from './infrastructure/drizzle-taxonomy-catalog.adapter';
import { YouTubeOembedVideoPreviewLookup } from './infrastructure/youtube-oembed-video-preview-lookup.adapter';

/**
 * Admin CMS feature (hexagonal). Imports CatalogueModule to reuse the read `ContentRepository`,
 * `MediaLibrary`, and `CatalogueReindexService` (reindex-on-write). Write ports are bound here.
 */
@Module({
  imports: [CatalogueModule, AuthModule],
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
    ListContentRevisionsUseCase,
    RestoreContentRevisionUseCase,
    SetContentScoreUseCase,
    GetVideoPreviewUseCase,
    VideoEmbedEnricher,
    { provide: ContentAuthoring, useClass: DrizzleContentAuthoring },
    { provide: ContentRevisions, useClass: DrizzleContentRevisions },
    { provide: TaxonomyCatalog, useClass: DrizzleTaxonomyCatalog },
    { provide: VideoPreviewLookup, useClass: YouTubeOembedVideoPreviewLookup },
  ],
})
export class AuthoringModule {}
