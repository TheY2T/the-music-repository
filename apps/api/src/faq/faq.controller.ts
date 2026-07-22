import { FlagKeys } from '@TheY2T/tmr-flags';
import { Controller, Get, Header, Param, Query } from '@nestjs/common';
import { RequireFlagsEnabled } from '@openfeature/nestjs-sdk';
import { CACHE_PUBLIC_MEDIUM } from '../http/cache-control';
import { GetFaqEntryUseCase, ListFaqEntriesUseCase } from './application/faq-entry.use-cases';

/** The `locale` query param: undefined for the base locale (`en`), else the locale id (ADR 0034). */
function localeOf(locale: string | undefined): string | undefined {
  return locale && locale !== 'en' ? locale : undefined;
}

/** Public read path for FAQ entries. Gated by the `content.faq` flag. */
@Controller('faq-entries')
export class FaqController {
  constructor(
    private readonly listEntries: ListFaqEntriesUseCase,
    private readonly getEntry: GetFaqEntryUseCase,
  ) {}

  @Get()
  @Header('Cache-Control', CACHE_PUBLIC_MEDIUM)
  @RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.ContentFaq }] })
  async list(@Query('locale') locale?: string) {
    return { items: await this.listEntries.execute(localeOf(locale)) };
  }

  @Get(':slug')
  @Header('Cache-Control', CACHE_PUBLIC_MEDIUM)
  @RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.ContentFaq }] })
  get(@Param('slug') slug: string, @Query('locale') locale?: string) {
    return this.getEntry.execute(slug, localeOf(locale));
  }
}
