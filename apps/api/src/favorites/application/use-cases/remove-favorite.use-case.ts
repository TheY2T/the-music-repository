import { Injectable } from '@nestjs/common';
import { FavoritesRepository } from '../ports/favorites-repository.port';

@Injectable()
export class RemoveFavoriteUseCase {
  constructor(private readonly favorites: FavoritesRepository) {}

  execute(userId: string, slug: string): Promise<void> {
    return this.favorites.remove(userId, slug);
  }
}
