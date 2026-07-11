import { Controller, Get, Param } from '@nestjs/common';
import { GetCollectionBySlugUseCase } from './application/use-cases/get-collection.use-case';
import { ListCollectionsUseCase } from './application/use-cases/list-collections.use-case';

/** Public read path for collections (published only). */
@Controller('collections')
export class CollectionsController {
  constructor(
    private readonly listCollections: ListCollectionsUseCase,
    private readonly getCollection: GetCollectionBySlugUseCase,
  ) {}

  @Get()
  async list() {
    return { items: await this.listCollections.execute() };
  }

  @Get(':slug')
  detail(@Param('slug') slug: string) {
    return this.getCollection.execute(slug);
  }
}
