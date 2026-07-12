import { FlagKeys } from '@TheY2T/tmr-flags';
import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { RequireFlagsEnabled } from '@openfeature/nestjs-sdk';
import { CurrentUser } from '../auth/application/current-user';
import { RequireAuth } from '../auth/require-permissions.decorator';
import {
  CreateClassroomUseCase,
  GetClassroomUseCase,
  GrantClassroomPremiumUseCase,
  JoinClassroomUseCase,
  ListClassroomsUseCase,
} from './application/classrooms.use-cases';
import { CreateClassroomDto, JoinClassroomDto } from './dto/classrooms.dto';

/**
 * Classrooms (teacher mode). Every route requires auth (any role) and the `education.classrooms` flag
 * (method-level — a class-level flag guard drops route mapping). The acting user comes from the
 * `CurrentUser` port, never the path.
 */
@Controller()
export class ClassroomsController {
  constructor(
    private readonly currentUser: CurrentUser,
    private readonly createClassroom: CreateClassroomUseCase,
    private readonly listClassrooms: ListClassroomsUseCase,
    private readonly joinClassroom: JoinClassroomUseCase,
    private readonly getClassroom: GetClassroomUseCase,
    private readonly grantPremium: GrantClassroomPremiumUseCase,
  ) {}

  @Get('me/classrooms')
  @RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.Classrooms }] })
  @RequireAuth()
  async list() {
    return { items: await this.listClassrooms.execute(this.currentUser.require().id) };
  }

  @Post('me/classrooms')
  @HttpCode(201)
  @RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.Classrooms }] })
  @RequireAuth()
  create(@Body() body: CreateClassroomDto) {
    return this.createClassroom.execute(this.currentUser.require().id, body.name);
  }

  @Post('classrooms/join')
  @RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.Classrooms }] })
  @RequireAuth()
  join(@Body() body: JoinClassroomDto) {
    return this.joinClassroom.execute(this.currentUser.require().id, body.code);
  }

  @Get('classrooms/:id')
  @RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.Classrooms }] })
  @RequireAuth()
  get(@Param('id') id: string) {
    return this.getClassroom.execute(id, this.currentUser.require().id);
  }

  @Post('classrooms/:id/grant-premium')
  @HttpCode(200)
  @RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.Classrooms }] })
  @RequireAuth()
  grant(@Param('id') id: string) {
    return this.grantPremium.execute(id, this.currentUser.require().id);
  }
}
