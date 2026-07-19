import { Injectable } from '@nestjs/common';
import { FeedbackNotFoundError } from '../domain/errors/feedback-not-found.error';
import type { FeedbackBoardItemView } from '../domain/feedback-submission';
import { type BoardListOptions, FeedbackRepository } from './ports/feedback-repository.port';

@Injectable()
export class ListBoardUseCase {
  constructor(private readonly repository: FeedbackRepository) {}
  execute(options: BoardListOptions) {
    return this.repository.listBoard(options);
  }
}

@Injectable()
export class VoteFeedbackUseCase {
  constructor(private readonly repository: FeedbackRepository) {}
  async execute(id: string, userId: string): Promise<FeedbackBoardItemView> {
    const item = await this.repository.addVote(id, userId);
    if (!item) {
      throw new FeedbackNotFoundError(id);
    }
    return item;
  }
}

@Injectable()
export class UnvoteFeedbackUseCase {
  constructor(private readonly repository: FeedbackRepository) {}
  async execute(id: string, userId: string): Promise<FeedbackBoardItemView> {
    const item = await this.repository.removeVote(id, userId);
    if (!item) {
      throw new FeedbackNotFoundError(id);
    }
    return item;
  }
}
