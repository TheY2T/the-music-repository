import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { EntitlementsModule } from '../entitlements/entitlements.module';
import { MailModule } from '../mail/mail.module';
import {
  AcceptInvitationUseCase,
  ArchiveClassroomUseCase,
  AssignContentUseCase,
  CreateClassroomUseCase,
  GetAssignmentsUseCase,
  GetClassProgressUseCase,
  GetClassroomUseCase,
  GrantClassroomPremiumUseCase,
  InviteToClassroomUseCase,
  JoinClassroomUseCase,
  LeaveClassroomUseCase,
  ListClassroomsUseCase,
  ListInvitationsUseCase,
  RemoveMemberUseCase,
  TransferOwnershipUseCase,
  UnassignContentUseCase,
} from './application/classrooms.use-cases';
import { ClassroomsRepository } from './application/ports/classrooms-repository.port';
import { ClassroomsController } from './classrooms.controller';
import { DrizzleClassrooms } from './infrastructure/drizzle-classrooms.repository';

/**
 * Classrooms feature (hexagonal). Imports AuthModule for `CurrentUser` and EntitlementsModule for the
 * `Entitlements` port (granting premium to a class = seat entitlements).
 */
@Module({
  imports: [AuthModule, EntitlementsModule, MailModule],
  controllers: [ClassroomsController],
  providers: [
    CreateClassroomUseCase,
    ListClassroomsUseCase,
    JoinClassroomUseCase,
    GetClassroomUseCase,
    GrantClassroomPremiumUseCase,
    LeaveClassroomUseCase,
    RemoveMemberUseCase,
    ArchiveClassroomUseCase,
    TransferOwnershipUseCase,
    AssignContentUseCase,
    UnassignContentUseCase,
    GetAssignmentsUseCase,
    GetClassProgressUseCase,
    InviteToClassroomUseCase,
    ListInvitationsUseCase,
    AcceptInvitationUseCase,
    { provide: ClassroomsRepository, useClass: DrizzleClassrooms },
  ],
})
export class ClassroomsModule {}
