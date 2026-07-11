import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CatalogueModule } from '../catalogue/catalogue.module';
import { FavoritesRepository } from './application/ports/favorites-repository.port';
import { AddFavoriteUseCase } from './application/use-cases/add-favorite.use-case';
import { ListFavoritesUseCase } from './application/use-cases/list-favorites.use-case';
import { RemoveFavoriteUseCase } from './application/use-cases/remove-favorite.use-case';
import { FavoritesController } from './favorites.controller';
import { DrizzleFavoritesRepository } from './infrastructure/drizzle-favorites.repository';

/**
 * Favorites feature (hexagonal). Imports AuthModule for the `CurrentUser` port and CatalogueModule
 * for the read `ContentRepository` (to project favorited items into summaries).
 */
@Module({
  imports: [AuthModule, CatalogueModule],
  controllers: [FavoritesController],
  providers: [
    AddFavoriteUseCase,
    RemoveFavoriteUseCase,
    ListFavoritesUseCase,
    { provide: FavoritesRepository, useClass: DrizzleFavoritesRepository },
  ],
})
export class FavoritesModule {}
