import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { CurrentUser } from '../auth/application/current-user';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { CreateContentUseCase } from './application/use-cases/create-content.use-case';
import { CreateTaxonomyUseCase } from './application/use-cases/create-taxonomy.use-case';
import { DeleteContentUseCase } from './application/use-cases/delete-content.use-case';
import { GetContentForEditUseCase } from './application/use-cases/get-content-for-edit.use-case';
import { ListContentUseCase } from './application/use-cases/list-content.use-case';
import { ListContentRevisionsUseCase } from './application/use-cases/list-content-revisions.use-case';
import { ListTaxonomyUseCase } from './application/use-cases/list-taxonomy.use-case';
import { RequestMediaUploadUseCase } from './application/use-cases/request-media-upload.use-case';
import { RestoreContentRevisionUseCase } from './application/use-cases/restore-content-revision.use-case';
import { SetContentScoreUseCase } from './application/use-cases/set-content-score.use-case';
import { SetContentStatusUseCase } from './application/use-cases/set-content-status.use-case';
import { UpdateContentUseCase } from './application/use-cases/update-content.use-case';
import {
  CreateContentDto,
  CreateTaxonomyDto,
  RequestMediaUploadDto,
  SetContentScoreDto,
  SetContentStatusDto,
  UpdateContentDto,
} from './dto/authoring.dto';

/**
 * Admin CMS surface (paths mirror TypeSpec). Every route is RBAC-gated via `@RequirePermissions`
 * (the global auth guard is off; see auth module). Use-cases reindex the catalogue on write.
 */
@Controller()
export class AuthoringController {
  constructor(
    private readonly listContent: ListContentUseCase,
    private readonly createContent: CreateContentUseCase,
    private readonly getForEdit: GetContentForEditUseCase,
    private readonly updateContent: UpdateContentUseCase,
    private readonly setStatus: SetContentStatusUseCase,
    private readonly deleteContent: DeleteContentUseCase,
    private readonly requestMedia: RequestMediaUploadUseCase,
    private readonly listTaxonomy: ListTaxonomyUseCase,
    private readonly createTaxonomy: CreateTaxonomyUseCase,
    private readonly listRevisions: ListContentRevisionsUseCase,
    private readonly restoreRevision: RestoreContentRevisionUseCase,
    private readonly setScore: SetContentScoreUseCase,
    private readonly currentUser: CurrentUser,
  ) {}

  @Get('content')
  @RequirePermissions({ content: ['update'] })
  async list() {
    return { items: await this.listContent.execute() };
  }

  @Post('content')
  @HttpCode(201)
  @RequirePermissions({ content: ['create'] })
  create(@Body() body: CreateContentDto) {
    return this.createContent.execute(body);
  }

  @Get('content/:slug')
  @RequirePermissions({ content: ['update'] })
  detail(@Param('slug') slug: string) {
    return this.getForEdit.execute(slug);
  }

  @Put('content/:slug')
  @RequirePermissions({ content: ['update'] })
  update(@Param('slug') slug: string, @Body() body: UpdateContentDto) {
    return this.updateContent.execute(slug, body);
  }

  @Post('content/:slug/publish')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions({ content: ['publish'] })
  publish(@Param('slug') slug: string) {
    return this.setStatus.execute(slug, 'published', this.currentUser.optional()?.id ?? null);
  }

  @Get('content/:slug/revisions')
  @RequirePermissions({ content: ['update'] })
  revisions(@Param('slug') slug: string) {
    return this.listRevisions.execute(slug);
  }

  @Post('content/:slug/revisions/:revisionId/restore')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions({ content: ['publish'] })
  restore(@Param('slug') slug: string, @Param('revisionId') revisionId: string) {
    return this.restoreRevision.execute(slug, revisionId);
  }

  @Post('content/:slug/unpublish')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions({ content: ['publish'] })
  unpublish(@Param('slug') slug: string) {
    return this.setStatus.execute(slug, 'draft');
  }

  @Post('content/:slug/status')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions({ content: ['publish'] })
  status(@Param('slug') slug: string, @Body() body: SetContentStatusDto) {
    return this.setStatus.execute(slug, body.status, this.currentUser.optional()?.id ?? null);
  }

  @Delete('content/:slug')
  @HttpCode(204)
  @RequirePermissions({ content: ['delete'] })
  remove(@Param('slug') slug: string) {
    return this.deleteContent.execute(slug);
  }

  @Post('content/:slug/media')
  @HttpCode(201)
  @RequirePermissions({ media: ['create'] })
  media(@Param('slug') slug: string, @Body() body: RequestMediaUploadDto) {
    return this.requestMedia.execute(slug, body);
  }

  @Put('content/:slug/score')
  @RequirePermissions({ content: ['update'] })
  score(@Param('slug') slug: string, @Body() body: SetContentScoreDto) {
    return this.setScore.execute(slug, body.tex);
  }

  @Get('taxonomy/:dimension')
  @RequirePermissions({ content: ['update'] })
  async taxonomy(@Param('dimension') dimension: string) {
    return { items: await this.listTaxonomy.execute(dimension) };
  }

  @Post('taxonomy/:dimension')
  @HttpCode(201)
  @RequirePermissions({ taxonomy: ['create'] })
  addTaxonomy(@Param('dimension') dimension: string, @Body() body: CreateTaxonomyDto) {
    return this.createTaxonomy.execute(dimension, body);
  }
}
