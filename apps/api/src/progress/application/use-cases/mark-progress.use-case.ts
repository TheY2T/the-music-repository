import { Injectable } from '@nestjs/common';
import { ProgressRepository } from '../ports/progress-repository.port';

@Injectable()
export class MarkCompleteUseCase {
  constructor(private readonly progress: ProgressRepository) {}

  execute(userId: string, slug: string): Promise<void> {
    return this.progress.markComplete(userId, slug);
  }
}

@Injectable()
export class MarkIncompleteUseCase {
  constructor(private readonly progress: ProgressRepository) {}

  execute(userId: string, slug: string): Promise<void> {
    return this.progress.markIncomplete(userId, slug);
  }
}

@Injectable()
export class LogPracticeUseCase {
  constructor(private readonly progress: ProgressRepository) {}

  execute(userId: string, contentSlug: string | null, minutes: number): Promise<void> {
    return this.progress.logPractice(userId, contentSlug, minutes);
  }
}
