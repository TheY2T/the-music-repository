import { Injectable } from '@nestjs/common';
import { FavoritesRepository } from '../ports/favorites-repository.port';

@Injectable()
export class AddFavoriteUseCase {
  constructor(private readonly favorites: FavoritesRepository) {}

  execute(userId: string, slug: string): Promise<void> {
    return this.favorites.add(userId, slug);
  }
}
