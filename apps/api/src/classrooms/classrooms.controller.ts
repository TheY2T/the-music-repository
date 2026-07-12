import { FlagKeys } from '@TheY2T/tmr-flags';
import { Body, Controller, Delete, Get, HttpCode, Param, Post } from '@nestjs/common';
import { RequireFlagsEnabled } from '@openfeature/nestjs-sdk';
import { CurrentUser } from '../auth/application/current-user';
import { RequireAuth } from '../auth/require-permissions.decorator';
import {
  ArchiveClassroomUseCase,
  AssignContentUseCase,
  CreateClassroomUseCase,
  GetAssignmentsUseCase,
  GetClassProgressUseCase,
  GetClassroomUseCase,
  GrantClassroomPremiumUseCase,
  JoinClassroomUseCase,
  LeaveClassroomUseCase,
  ListClassroomsUseCase,
  RemoveMemberUseCase,
  TransferOwnershipUseCase,
  UnassignContentUseCase,
} from './application/classrooms.use-cases';
import {
  AssignContentDto,
  CreateClassroomDto,
  JoinClassroomDto,
  TransferOwnershipDto,
} from './dto/classrooms.dto';

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
    private readonly leaveClassroom: LeaveClassroomUseCase,
    private readonly removeMember: RemoveMemberUseCase,
    private readonly archiveClassroom: ArchiveClassroomUseCase,
    private readonly transferOwnership: TransferOwnershipUseCase,
    private readonly assignContent: AssignContentUseCase,
    private readonly unassignContent: UnassignContentUseCase,
    private readonly getAssignments: GetAssignmentsUseCase,
    private readonly getClassProgress: GetClassProgressUseCase,
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

  @Post('classrooms/:id/leave')
  @HttpCode(204)
  @RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.Classrooms }] })
  @RequireAuth()
  leave(@Param('id') id: string) {
    return this.leaveClassroom.execute(id, this.currentUser.require().id);
  }

  @Delete('classrooms/:id/members/:memberId')
  @HttpCode(204)
  @RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.Classrooms }] })
  @RequireAuth()
  remove(@Param('id') id: string, @Param('memberId') memberId: string) {
    return this.removeMember.execute(id, this.currentUser.require().id, memberId);
  }

  @Post('classrooms/:id/archive')
  @HttpCode(204)
  @RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.Classrooms }] })
  @RequireAuth()
  archive(@Param('id') id: string) {
    return this.archiveClassroom.execute(id, this.currentUser.require().id);
  }

  @Post('classrooms/:id/transfer')
  @HttpCode(204)
  @RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.Classrooms }] })
  @RequireAuth()
  transfer(@Param('id') id: string, @Body() body: TransferOwnershipDto) {
    return this.transferOwnership.execute(id, this.currentUser.require().id, body.memberId);
  }

  @Get('classrooms/:id/assignments')
  @RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.Classrooms }] })
  @RequireAuth()
  async assignments(@Param('id') id: string) {
    return { items: await this.getAssignments.execute(id, this.currentUser.require().id) };
  }

  @Post('classrooms/:id/assignments')
  @HttpCode(201)
  @RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.Classrooms }] })
  @RequireAuth()
  async assign(@Param('id') id: string, @Body() body: AssignContentDto) {
    return {
      items: await this.assignContent.execute(id, this.currentUser.require().id, body.contentSlug),
    };
  }

  @Delete('classrooms/:id/assignments/:slug')
  @HttpCode(204)
  @RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.Classrooms }] })
  @RequireAuth()
  unassign(@Param('id') id: string, @Param('slug') slug: string) {
    return this.unassignContent.execute(id, this.currentUser.require().id, slug);
  }

  @Get('classrooms/:id/progress')
  @RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.Classrooms }] })
  @RequireAuth()
  progress(@Param('id') id: string) {
    return this.getClassProgress.execute(id, this.currentUser.require().id);
  }
}
