import { Controller, Delete, Get, HttpCode, Param, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/application/current-user';
import { RequireAuth } from '../auth/require-permissions.decorator';
import { AddFavoriteUseCase } from './application/use-cases/add-favorite.use-case';
import { ListFavoritesUseCase } from './application/use-cases/list-favorites.use-case';
import { RemoveFavoriteUseCase } from './application/use-cases/remove-favorite.use-case';

/**
 * Personalization surface — the acting user's favorites. Every route requires authentication (any
 * role); the user id comes from the `CurrentUser` port, never the request path.
 */
@Controller()
export class FavoritesController {
  constructor(
    private readonly currentUser: CurrentUser,
    private readonly addFavorite: AddFavoriteUseCase,
    private readonly removeFavorite: RemoveFavoriteUseCase,
    private readonly listFavorites: ListFavoritesUseCase,
  ) {}

  @Get('me/favorites')
  @RequireAuth()
  async list() {
    return { items: await this.listFavorites.execute(this.currentUser.require().id) };
  }

  @Post('me/favorites/:slug')
  @HttpCode(204)
  @RequireAuth()
  add(@Param('slug') slug: string) {
    return this.addFavorite.execute(this.currentUser.require().id, slug);
  }

  @Delete('me/favorites/:slug')
  @HttpCode(204)
  @RequireAuth()
  remove(@Param('slug') slug: string) {
    return this.removeFavorite.execute(this.currentUser.require().id, slug);
  }
}
