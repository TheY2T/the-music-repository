import { Controller, Get, Param, Query } from '@nestjs/common';
import { GetHelpTopicUseCase, ListHelpTopicsUseCase } from './application/help-topic.use-cases';

/** The `locale` query param: undefined for the base locale (`en`), else the locale id (ADR 0034). */
function localeOf(locale: string | undefined): string | undefined {
  return locale && locale !== 'en' ? locale : undefined;
}

/** Public read path for Info View help topics. */
@Controller('help-topics')
export class HelpController {
  constructor(
    private readonly listTopics: ListHelpTopicsUseCase,
    private readonly getTopic: GetHelpTopicUseCase,
  ) {}

  @Get()
  async list(@Query('locale') locale?: string) {
    return { items: await this.listTopics.execute(localeOf(locale)) };
  }

  @Get(':slug')
  get(@Param('slug') slug: string, @Query('locale') locale?: string) {
    return this.getTopic.execute(slug, localeOf(locale));
  }
}
