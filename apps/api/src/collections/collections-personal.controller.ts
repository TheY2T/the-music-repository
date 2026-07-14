import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put } from '@nestjs/common';
import { CurrentUser } from '../auth/application/current-user';
import { RequireAuth } from '../auth/require-permissions.decorator';
import {
  AddCollectionBookmarkUseCase,
  ListCollectionBookmarksUseCase,
  RateCollectionUseCase,
  RemoveCollectionBookmarkUseCase,
} from './application/use-cases/collection-engagement.use-case';
import {
  CreateUserCollectionUseCase,
  DeleteUserCollectionUseCase,
  GetMyCollectionUseCase,
  ListMyCollectionsUseCase,
  SetUserCollectionItemsUseCase,
  UpdateUserCollectionUseCase,
} from './application/use-cases/manage-user-collection.use-case';
import {
  CreateUserCollectionDto,
  RateCollectionDto,
  SetUserCollectionItemsDto,
  UpdateUserCollectionDto,
} from './dto/collections.dto';
import { CollectionReindexService } from './infrastructure/collection-reindex.service';

/**
 * The acting user's collections surface — saved (bookmarked) collections, ratings, and user-created
 * collection CRUD. Every route requires authentication; the user id comes from `CurrentUser`, never
 * the request path. Ownership of user-created collections is enforced in the use-cases (403).
 */
@Controller()
export class CollectionsPersonalController {
  constructor(
    private readonly currentUser: CurrentUser,
    private readonly listBookmarks: ListCollectionBookmarksUseCase,
    private readonly addBookmark: AddCollectionBookmarkUseCase,
    private readonly removeBookmark: RemoveCollectionBookmarkUseCase,
    private readonly rate: RateCollectionUseCase,
    private readonly listMine: ListMyCollectionsUseCase,
    private readonly getMine: GetMyCollectionUseCase,
    private readonly createMine: CreateUserCollectionUseCase,
    private readonly updateMine: UpdateUserCollectionUseCase,
    private readonly setMineItems: SetUserCollectionItemsUseCase,
    private readonly deleteMine: DeleteUserCollectionUseCase,
    private readonly reindex: CollectionReindexService,
  ) {}

  /** Rebuild discovery after a user write (public user collections surface there); best-effort. */
  private reindexQuietly(): void {
    void this.reindex.reindex().catch(() => undefined);
  }

  // --- Saved / bookmarked ---
  @Get('me/saved-collections')
  @RequireAuth()
  async saved() {
    return { items: await this.listBookmarks.execute(this.currentUser.require().id) };
  }

  @Post('me/collections/:slug/bookmark')
  @HttpCode(204)
  @RequireAuth()
  bookmark(@Param('slug') slug: string) {
    return this.addBookmark.execute(this.currentUser.require().id, slug);
  }

  @Delete('me/collections/:slug/bookmark')
  @HttpCode(204)
  @RequireAuth()
  unbookmark(@Param('slug') slug: string) {
    return this.removeBookmark.execute(this.currentUser.require().id, slug);
  }

  // --- Ratings ---
  @Put('me/collections/:slug/rating')
  @RequireAuth()
  rateCollection(@Param('slug') slug: string, @Body() body: RateCollectionDto) {
    return this.rate.execute(this.currentUser.require().id, slug, body.rating);
  }

  // --- User-created collections ---
  @Get('me/collections')
  @RequireAuth()
  async mine() {
    return { items: await this.listMine.execute(this.currentUser.require().id) };
  }

  @Post('me/collections')
  @RequireAuth()
  async create(@Body() body: CreateUserCollectionDto) {
    const result = await this.createMine.execute(this.currentUser.require().id, body);
    this.reindexQuietly();
    return result;
  }

  @Get('me/collections/:slug')
  @RequireAuth()
  detail(@Param('slug') slug: string) {
    return this.getMine.execute(this.currentUser.require().id, slug);
  }

  @Put('me/collections/:slug')
  @RequireAuth()
  async update(@Param('slug') slug: string, @Body() body: UpdateUserCollectionDto) {
    const result = await this.updateMine.execute(this.currentUser.require().id, slug, body);
    this.reindexQuietly();
    return result;
  }

  @Put('me/collections/:slug/items')
  @RequireAuth()
  async items(@Param('slug') slug: string, @Body() body: SetUserCollectionItemsDto) {
    const result = await this.setMineItems.execute(this.currentUser.require().id, slug, body.items);
    this.reindexQuietly();
    return result;
  }

  @Delete('me/collections/:slug')
  @HttpCode(204)
  @RequireAuth()
  async remove(@Param('slug') slug: string) {
    await this.deleteMine.execute(this.currentUser.require().id, slug);
    this.reindexQuietly();
  }
}
