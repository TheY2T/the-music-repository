import { FlagKeys } from '@TheY2T/tmr-flags';
import { Body, Controller, Delete, HttpCode, Param, Post, Put } from '@nestjs/common';
import { RequireFlagsEnabled } from '@openfeature/nestjs-sdk';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import {
  CreateFaqEntryUseCase,
  DeleteFaqEntryUseCase,
  UpdateFaqEntryUseCase,
} from './application/faq-entry.use-cases';
import { CreateFaqEntryDto, UpdateFaqEntryDto } from './dto/faq.dto';

/** Admin authoring for FAQ entries (RBAC-gated; reuses the `content` permission resource). */
@Controller('admin/faq-entries')
export class FaqAuthoringController {
  constructor(
    private readonly createEntry: CreateFaqEntryUseCase,
    private readonly updateEntry: UpdateFaqEntryUseCase,
    private readonly deleteEntry: DeleteFaqEntryUseCase,
  ) {}

  @Post()
  @HttpCode(201)
  @RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.ContentFaq }] })
  @RequirePermissions({ content: ['create'] })
  create(@Body() body: CreateFaqEntryDto) {
    return this.createEntry.execute(body);
  }

  @Put(':slug')
  @RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.ContentFaq }] })
  @RequirePermissions({ content: ['update'] })
  update(@Param('slug') slug: string, @Body() body: UpdateFaqEntryDto) {
    return this.updateEntry.execute(slug, body);
  }

  @Delete(':slug')
  @HttpCode(204)
  @RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.ContentFaq }] })
  @RequirePermissions({ content: ['delete'] })
  remove(@Param('slug') slug: string) {
    return this.deleteEntry.execute(slug);
  }
}
