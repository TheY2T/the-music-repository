import { Injectable } from '@nestjs/common';
import { type ContentAdminRow, ContentAuthoring } from '../ports/content-authoring.port';

@Injectable()
export class ListContentUseCase {
  constructor(private readonly authoring: ContentAuthoring) {}

  execute(): Promise<ContentAdminRow[]> {
    return this.authoring.listAll();
  }
}
