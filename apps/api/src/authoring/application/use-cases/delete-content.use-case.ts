import { Injectable } from '@nestjs/common';
import { ContentNotFoundError } from '../../../catalogue/domain/errors/content-not-found.error';
import { CatalogueReindexService } from '../../../catalogue/infrastructure/catalogue-reindex.service';
import { ContentAuthoring } from '../ports/content-authoring.port';

@Injectable()
export class DeleteContentUseCase {
  constructor(
    private readonly authoring: ContentAuthoring,
    private readonly reindex: CatalogueReindexService,
  ) {}

  async execute(slug: string): Promise<void> {
    if (!(await this.authoring.exists(slug))) {
      throw new ContentNotFoundError(slug);
    }
    await this.authoring.delete(slug);
    await this.reindex.reindex();
  }
}
