import { Controller, Get, Param } from '@nestjs/common';
import { GetHelpTopicUseCase, ListHelpTopicsUseCase } from './application/help-topic.use-cases';

/** Public read path for Info View help topics. */
@Controller('help-topics')
export class HelpController {
  constructor(
    private readonly listTopics: ListHelpTopicsUseCase,
    private readonly getTopic: GetHelpTopicUseCase,
  ) {}

  @Get()
  async list() {
    return { items: await this.listTopics.execute() };
  }

  @Get(':slug')
  get(@Param('slug') slug: string) {
    return this.getTopic.execute(slug);
  }
}
