import { Body, Controller, Delete, HttpCode, Param, Post, Put } from '@nestjs/common';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import {
  CreateHelpTopicUseCase,
  DeleteHelpTopicUseCase,
  UpdateHelpTopicUseCase,
} from './application/help-topic.use-cases';
import { CreateHelpTopicDto, UpdateHelpTopicDto } from './dto/help.dto';

/** Admin authoring for help topics (RBAC-gated; reuses the `content` permission resource). */
@Controller('admin/help-topics')
export class HelpAuthoringController {
  constructor(
    private readonly createTopic: CreateHelpTopicUseCase,
    private readonly updateTopic: UpdateHelpTopicUseCase,
    private readonly deleteTopic: DeleteHelpTopicUseCase,
  ) {}

  @Post()
  @HttpCode(201)
  @RequirePermissions({ content: ['create'] })
  create(@Body() body: CreateHelpTopicDto) {
    return this.createTopic.execute(body);
  }

  @Put(':slug')
  @RequirePermissions({ content: ['update'] })
  update(@Param('slug') slug: string, @Body() body: UpdateHelpTopicDto) {
    return this.updateTopic.execute(slug, body);
  }

  @Delete(':slug')
  @HttpCode(204)
  @RequirePermissions({ content: ['delete'] })
  remove(@Param('slug') slug: string) {
    return this.deleteTopic.execute(slug);
  }
}
