import { Injectable } from '@nestjs/common';
import type {
  EntityTranslationRevisionView,
  EntityTranslationView,
  TranslationQuery,
  UpsertTranslationData,
} from '../domain/entity-translation';
import { TranslationNotFoundError } from '../domain/errors/translation-not-found.error';
import { EntityTranslationAuthoring } from './ports/entity-translation-authoring.port';

@Injectable()
export class ListTranslationsUseCase {
  constructor(private readonly authoring: EntityTranslationAuthoring) {}
  execute(query: TranslationQuery): Promise<EntityTranslationView[]> {
    return this.authoring.list(query);
  }
}

@Injectable()
export class UpsertTranslationUseCase {
  constructor(private readonly authoring: EntityTranslationAuthoring) {}
  execute(data: UpsertTranslationData): Promise<EntityTranslationView> {
    return this.authoring.upsertDraft(data);
  }
}

@Injectable()
export class DeleteTranslationUseCase {
  constructor(private readonly authoring: EntityTranslationAuthoring) {}
  async execute(id: string, editedBy?: string): Promise<EntityTranslationView> {
    const deleted = await this.authoring.softDelete(id, editedBy);
    if (!deleted) {
      throw new TranslationNotFoundError(id);
    }
    return deleted;
  }
}

@Injectable()
export class RestoreTranslationUseCase {
  constructor(private readonly authoring: EntityTranslationAuthoring) {}
  async execute(id: string, editedBy?: string): Promise<EntityTranslationView> {
    const restored = await this.authoring.restore(id, editedBy);
    if (!restored) {
      throw new TranslationNotFoundError(id);
    }
    return restored;
  }
}

@Injectable()
export class ListTranslationRevisionsUseCase {
  constructor(private readonly authoring: EntityTranslationAuthoring) {}
  async execute(id: string): Promise<EntityTranslationRevisionView[]> {
    if (!(await this.authoring.getById(id))) {
      throw new TranslationNotFoundError(id);
    }
    return this.authoring.listRevisions(id);
  }
}

@Injectable()
export class PublishTranslationsUseCase {
  constructor(private readonly authoring: EntityTranslationAuthoring) {}
  execute(entityType?: string, entityId?: string): Promise<number> {
    return this.authoring.publish(entityType, entityId);
  }
}
