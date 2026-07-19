import { Injectable } from '@nestjs/common';
import { FeedbackTypeNotAllowedError } from '../domain/errors/feedback-type-not-allowed.error';
import type { FeedbackSubmissionView, FeedbackType } from '../domain/feedback-submission';
import { FeedbackRepository } from './ports/feedback-repository.port';

export interface SubmitFeedbackInput {
  type: FeedbackType;
  title?: string | null;
  message: string;
  pageUrl?: string | null;
  userAgent?: string | null;
}

export interface SubmitFeedbackContext {
  userId: string;
  locale: string | null;
  /** Whether the `bug` submission type is currently accepted (mirrors the `feedback.bugs` flag). */
  bugReportsEnabled: boolean;
}

function blankToNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

@Injectable()
export class SubmitFeedbackUseCase {
  constructor(private readonly repository: FeedbackRepository) {}

  async execute(
    input: SubmitFeedbackInput,
    ctx: SubmitFeedbackContext,
  ): Promise<FeedbackSubmissionView> {
    if (input.type === 'bug' && !ctx.bugReportsEnabled) {
      throw new FeedbackTypeNotAllowedError('bug');
    }
    // Page/user-agent context is only meaningful for bug reports.
    const isBug = input.type === 'bug';
    return this.repository.create({
      type: input.type,
      title: blankToNull(input.title),
      message: input.message.trim(),
      userId: ctx.userId,
      locale: ctx.locale,
      pageUrl: isBug ? blankToNull(input.pageUrl) : null,
      userAgent: isBug ? blankToNull(input.userAgent) : null,
    });
  }
}
