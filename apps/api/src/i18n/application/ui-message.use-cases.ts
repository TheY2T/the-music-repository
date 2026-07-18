import { Injectable } from '@nestjs/common';
import { LocaleConflictError } from '../domain/errors/locale-conflict.error';
import { UiMessageKeyConflictError } from '../domain/errors/ui-message-key-conflict.error';
import { UiMessageNotFoundError } from '../domain/errors/ui-message-not-found.error';
import type { LocaleInfo } from '../domain/locale';
import type {
  CatalogueSnapshot,
  UiMessageCreateData,
  UiMessageQuery,
  UiMessageRevisionView,
  UiMessageView,
} from '../domain/ui-message';
import { LocaleRegistry } from './ports/locale-registry.port';
import { UiMessageAuthoring } from './ports/ui-message-authoring.port';
import { UiMessageCatalogue } from './ports/ui-message-catalogue.port';

@Injectable()
export class GetLocaleCatalogueUseCase {
  constructor(private readonly catalogue: UiMessageCatalogue) {}
  execute(locale: string): Promise<CatalogueSnapshot> {
    return this.catalogue.snapshot(locale);
  }
}

@Injectable()
export class GetLocaleVersionsUseCase {
  constructor(private readonly catalogue: UiMessageCatalogue) {}
  async execute(): Promise<Record<string, string>> {
    return this.catalogue.versions();
  }
}

@Injectable()
export class ListUiMessagesUseCase {
  constructor(private readonly authoring: UiMessageAuthoring) {}
  execute(query: UiMessageQuery): Promise<UiMessageView[]> {
    return this.authoring.list(query);
  }
}

@Injectable()
export class CreateUiMessageUseCase {
  constructor(private readonly authoring: UiMessageAuthoring) {}
  async execute(data: UiMessageCreateData): Promise<UiMessageView> {
    if (await this.authoring.existsKey(data.locale, data.key)) {
      throw new UiMessageKeyConflictError(data.locale, data.key);
    }
    return this.authoring.create(data);
  }
}

@Injectable()
export class UpdateUiMessageUseCase {
  constructor(private readonly authoring: UiMessageAuthoring) {}
  async execute(id: string, value: string, editedBy?: string): Promise<UiMessageView> {
    const updated = await this.authoring.updateDraft(id, value, editedBy);
    if (!updated) {
      throw new UiMessageNotFoundError(id);
    }
    return updated;
  }
}

@Injectable()
export class DeleteUiMessageUseCase {
  constructor(private readonly authoring: UiMessageAuthoring) {}
  async execute(id: string, editedBy?: string): Promise<UiMessageView> {
    const deleted = await this.authoring.softDelete(id, editedBy);
    if (!deleted) {
      throw new UiMessageNotFoundError(id);
    }
    return deleted;
  }
}

@Injectable()
export class RestoreUiMessageUseCase {
  constructor(private readonly authoring: UiMessageAuthoring) {}
  async execute(id: string, editedBy?: string): Promise<UiMessageView> {
    const restored = await this.authoring.restore(id, editedBy);
    if (!restored) {
      throw new UiMessageNotFoundError(id);
    }
    return restored;
  }
}

@Injectable()
export class ListUiMessageRevisionsUseCase {
  constructor(private readonly authoring: UiMessageAuthoring) {}
  async execute(id: string): Promise<UiMessageRevisionView[]> {
    if (!(await this.authoring.getById(id))) {
      throw new UiMessageNotFoundError(id);
    }
    return this.authoring.listRevisions(id);
  }
}

@Injectable()
export class RestoreUiMessageRevisionUseCase {
  constructor(private readonly authoring: UiMessageAuthoring) {}
  async execute(id: string, revisionId: string, editedBy?: string): Promise<UiMessageView> {
    const restored = await this.authoring.restoreRevision(id, revisionId, editedBy);
    if (!restored) {
      throw new UiMessageNotFoundError(id);
    }
    return restored;
  }
}

@Injectable()
export class PublishUiMessagesUseCase {
  constructor(private readonly authoring: UiMessageAuthoring) {}
  execute(locale: string | undefined, editedBy?: string): Promise<Record<string, string>> {
    return this.authoring.publish(locale, editedBy);
  }
}

@Injectable()
export class GetLocalesUseCase {
  constructor(private readonly registry: LocaleRegistry) {}
  execute(): Promise<LocaleInfo[]> {
    return this.registry.list();
  }
}

@Injectable()
export class CreateLocaleUseCase {
  constructor(private readonly registry: LocaleRegistry) {}
  async execute(code: string, label: string): Promise<LocaleInfo> {
    if (await this.registry.exists(code)) {
      throw new LocaleConflictError(code);
    }
    return this.registry.create(code, label);
  }
}

@Injectable()
export class ImportUiMessagesUseCase {
  constructor(
    private readonly authoring: UiMessageAuthoring,
    private readonly registry: LocaleRegistry,
  ) {}
  async execute(
    locale: string,
    entries: Record<string, string>,
    editedBy?: string,
    label?: string,
  ): Promise<number> {
    await this.registry.ensure(locale, label); // accept a brand-new locale on import
    return this.authoring.importMany(locale, entries, editedBy);
  }
}
