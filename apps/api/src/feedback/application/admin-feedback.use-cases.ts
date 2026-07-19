import { Injectable } from '@nestjs/common';
import { FeedbackNotFoundError } from '../domain/errors/feedback-not-found.error';
import type { FeedbackSubmissionView, FeedbackUpdateData } from '../domain/feedback-submission';
import { type FeedbackListFilter, FeedbackRepository } from './ports/feedback-repository.port';

@Injectable()
export class ListFeedbackUseCase {
  constructor(private readonly repository: FeedbackRepository) {}
  execute(filter: FeedbackListFilter) {
    return this.repository.list(filter);
  }
}

@Injectable()
export class GetFeedbackUseCase {
  constructor(private readonly repository: FeedbackRepository) {}
  async execute(id: string): Promise<FeedbackSubmissionView> {
    const submission = await this.repository.getById(id);
    if (!submission) {
      throw new FeedbackNotFoundError(id);
    }
    return submission;
  }
}

@Injectable()
export class UpdateFeedbackUseCase {
  constructor(private readonly repository: FeedbackRepository) {}
  async execute(id: string, data: FeedbackUpdateData): Promise<FeedbackSubmissionView> {
    const updated = await this.repository.update(id, data);
    if (!updated) {
      throw new FeedbackNotFoundError(id);
    }
    return updated;
  }
}

@Injectable()
export class DeleteFeedbackUseCase {
  constructor(private readonly repository: FeedbackRepository) {}
  async execute(id: string): Promise<void> {
    const existing = await this.repository.getById(id);
    if (!existing) {
      throw new FeedbackNotFoundError(id);
    }
    await this.repository.delete(id);
  }
}
