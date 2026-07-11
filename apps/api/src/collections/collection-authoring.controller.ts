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
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { GetCollectionForEditUseCase } from './application/use-cases/get-collection.use-case';
import { ListCollectionsAdminUseCase } from './application/use-cases/list-collections.use-case';
import {
  CreateCollectionUseCase,
  DeleteCollectionUseCase,
  SetCollectionItemsUseCase,
  SetCollectionStatusUseCase,
  UpdateCollectionUseCase,
} from './application/use-cases/manage-collection.use-case';
import {
  CreateCollectionDto,
  SetCollectionItemsDto,
  UpdateCollectionDto,
} from './dto/collections.dto';

/** Admin authoring for collections (RBAC-gated; reuses the `content` permission resource). */
@Controller('admin/collections')
export class CollectionAuthoringController {
  constructor(
    private readonly listAdmin: ListCollectionsAdminUseCase,
    private readonly getForEdit: GetCollectionForEditUseCase,
    private readonly createCollection: CreateCollectionUseCase,
    private readonly updateCollection: UpdateCollectionUseCase,
    private readonly setItems: SetCollectionItemsUseCase,
    private readonly setStatus: SetCollectionStatusUseCase,
    private readonly deleteCollection: DeleteCollectionUseCase,
  ) {}

  @Get()
  @RequirePermissions({ content: ['update'] })
  async list() {
    return { items: await this.listAdmin.execute() };
  }

  @Post()
  @HttpCode(201)
  @RequirePermissions({ content: ['create'] })
  create(@Body() body: CreateCollectionDto) {
    return this.createCollection.execute(body);
  }

  @Get(':slug')
  @RequirePermissions({ content: ['update'] })
  detail(@Param('slug') slug: string) {
    return this.getForEdit.execute(slug);
  }

  @Put(':slug')
  @RequirePermissions({ content: ['update'] })
  update(@Param('slug') slug: string, @Body() body: UpdateCollectionDto) {
    return this.updateCollection.execute(slug, body);
  }

  @Put(':slug/items')
  @RequirePermissions({ content: ['update'] })
  items(@Param('slug') slug: string, @Body() body: SetCollectionItemsDto) {
    return this.setItems.execute(slug, body.contentSlugs);
  }

  @Post(':slug/publish')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions({ content: ['publish'] })
  publish(@Param('slug') slug: string) {
    return this.setStatus.execute(slug, 'published');
  }

  @Post(':slug/unpublish')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions({ content: ['publish'] })
  unpublish(@Param('slug') slug: string) {
    return this.setStatus.execute(slug, 'draft');
  }

  @Delete(':slug')
  @HttpCode(204)
  @RequirePermissions({ content: ['delete'] })
  remove(@Param('slug') slug: string) {
    return this.deleteCollection.execute(slug);
  }
}
