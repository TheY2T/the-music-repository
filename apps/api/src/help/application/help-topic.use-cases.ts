import { Injectable } from '@nestjs/common';
import { HelpTopicNotFoundError } from '../domain/errors/help-topic-not-found.error';
import { HelpTopicSlugConflictError } from '../domain/errors/help-topic-slug-conflict.error';
import type { HelpTopicView, HelpTopicWriteData } from '../domain/help-topic';
import { HelpTopicRepository } from './ports/help-topic-repository.port';

@Injectable()
export class ListHelpTopicsUseCase {
  constructor(private readonly repository: HelpTopicRepository) {}
  execute(): Promise<HelpTopicView[]> {
    return this.repository.findAll();
  }
}

@Injectable()
export class GetHelpTopicUseCase {
  constructor(private readonly repository: HelpTopicRepository) {}
  async execute(slug: string): Promise<HelpTopicView> {
    const topic = await this.repository.getBySlug(slug);
    if (!topic) {
      throw new HelpTopicNotFoundError(slug);
    }
    return topic;
  }
}

@Injectable()
export class CreateHelpTopicUseCase {
  constructor(private readonly repository: HelpTopicRepository) {}
  async execute(data: HelpTopicWriteData): Promise<HelpTopicView> {
    if (await this.repository.exists(data.slug)) {
      throw new HelpTopicSlugConflictError(data.slug);
    }
    return this.repository.create(data);
  }
}

@Injectable()
export class UpdateHelpTopicUseCase {
  constructor(private readonly repository: HelpTopicRepository) {}
  async execute(slug: string, data: HelpTopicWriteData): Promise<HelpTopicView> {
    if (!(await this.repository.exists(slug))) {
      throw new HelpTopicNotFoundError(slug);
    }
    return this.repository.update(slug, data);
  }
}

@Injectable()
export class DeleteHelpTopicUseCase {
  constructor(private readonly repository: HelpTopicRepository) {}
  async execute(slug: string): Promise<void> {
    if (!(await this.repository.exists(slug))) {
      throw new HelpTopicNotFoundError(slug);
    }
    await this.repository.delete(slug);
  }
}
