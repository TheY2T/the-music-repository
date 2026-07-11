import { NotFoundError } from '@TheY2T/tmr-errors';

export class HelpTopicNotFoundError extends NotFoundError {
  readonly code = 'HELP_TOPIC_NOT_FOUND';

  constructor(slug: string) {
    super(`No help topic exists with slug '${slug}'.`, { slug });
  }
}
