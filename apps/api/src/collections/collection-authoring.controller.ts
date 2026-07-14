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
  SetCollectionSectionsUseCase,
  SetCollectionStatusUseCase,
  UpdateCollectionUseCase,
} from './application/use-cases/manage-collection.use-case';
import {
  CreateCollectionDto,
  SetCollectionItemsDto,
  SetCollectionSectionsDto,
  UpdateCollectionDto,
} from './dto/collections.dto';
import { CollectionReindexService } from './infrastructure/collection-reindex.service';

/** Admin authoring for collections (RBAC-gated; reuses the `content` permission resource). */
@Controller('admin/collections')
export class CollectionAuthoringController {
  constructor(
    private readonly listAdmin: ListCollectionsAdminUseCase,
    private readonly getForEdit: GetCollectionForEditUseCase,
    private readonly createCollection: CreateCollectionUseCase,
    private readonly updateCollection: UpdateCollectionUseCase,
    private readonly setItems: SetCollectionItemsUseCase,
    private readonly setSections: SetCollectionSectionsUseCase,
    private readonly setStatus: SetCollectionStatusUseCase,
    private readonly deleteCollection: DeleteCollectionUseCase,
    private readonly reindex: CollectionReindexService,
  ) {}

  /** Rebuild the discovery index after a write; best-effort so writes never fail if Meili is down. */
  private reindexQuietly(): void {
    void this.reindex.reindex().catch(() => undefined);
  }

  @Get()
  @RequirePermissions({ content: ['update'] })
  async list() {
    return { items: await this.listAdmin.execute() };
  }

  @Post()
  @HttpCode(201)
  @RequirePermissions({ content: ['create'] })
  async create(@Body() body: CreateCollectionDto) {
    const result = await this.createCollection.execute(body);
    this.reindexQuietly();
    return result;
  }

  @Get(':slug')
  @RequirePermissions({ content: ['update'] })
  detail(@Param('slug') slug: string) {
    return this.getForEdit.execute(slug);
  }

  @Put(':slug')
  @RequirePermissions({ content: ['update'] })
  async update(@Param('slug') slug: string, @Body() body: UpdateCollectionDto) {
    const result = await this.updateCollection.execute(slug, body);
    this.reindexQuietly();
    return result;
  }

  @Put(':slug/items')
  @RequirePermissions({ content: ['update'] })
  async items(@Param('slug') slug: string, @Body() body: SetCollectionItemsDto) {
    const result = await this.setItems.execute(slug, body.items);
    this.reindexQuietly();
    return result;
  }

  @Put(':slug/sections')
  @RequirePermissions({ content: ['update'] })
  async sections(@Param('slug') slug: string, @Body() body: SetCollectionSectionsDto) {
    const result = await this.setSections.execute(slug, body.sections);
    this.reindexQuietly();
    return result;
  }

  @Post(':slug/publish')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions({ content: ['publish'] })
  async publish(@Param('slug') slug: string) {
    const result = await this.setStatus.execute(slug, 'published');
    this.reindexQuietly();
    return result;
  }

  @Post(':slug/unpublish')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions({ content: ['publish'] })
  async unpublish(@Param('slug') slug: string) {
    const result = await this.setStatus.execute(slug, 'draft');
    this.reindexQuietly();
    return result;
  }

  @Delete(':slug')
  @HttpCode(204)
  @RequirePermissions({ content: ['delete'] })
  async remove(@Param('slug') slug: string) {
    await this.deleteCollection.execute(slug);
    this.reindexQuietly();
  }
}
