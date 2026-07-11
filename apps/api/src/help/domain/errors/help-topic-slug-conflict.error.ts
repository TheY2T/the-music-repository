import { ConflictError } from '@TheY2T/tmr-errors';

export class HelpTopicSlugConflictError extends ConflictError {
  readonly code = 'HELP_TOPIC_SLUG_CONFLICT';

  constructor(slug: string) {
    super(`A help topic with slug '${slug}' already exists.`, { slug });
  }
}
