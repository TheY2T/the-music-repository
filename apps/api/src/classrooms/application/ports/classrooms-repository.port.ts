import type { AssignmentView, ClassroomMemberView } from '../../domain/classroom';

export interface ClassroomRow {
  id: string;
  name: string;
  joinCode: string;
  ownerId: string;
  premiumGranted: boolean;
}

/**
 * ClassroomsRepository (DDD) — persistence for teacher classrooms + memberships. Data access only;
 * use-cases own the rules (ownership, join validity) and build the domain views.
 */
export abstract class ClassroomsRepository {
  abstract create(ownerId: string, name: string, joinCode: string): Promise<ClassroomRow>;
  abstract findById(id: string): Promise<ClassroomRow | null>;
  abstract findByCode(code: string): Promise<ClassroomRow | null>;
  /** Idempotent. */
  abstract addMember(classroomId: string, userId: string): Promise<void>;
  /** Remove a member (idempotent). */
  abstract removeMember(classroomId: string, userId: string): Promise<void>;
  /** Soft-delete: hide the classroom from all rosters. */
  abstract archive(classroomId: string): Promise<void>;
  abstract isOwnerOrMember(classroomId: string, userId: string): Promise<boolean>;
  /** Classrooms the user owns or has joined, each with its member count. */
  abstract listForUser(userId: string): Promise<{ row: ClassroomRow; memberCount: number }[]>;
  abstract members(classroomId: string): Promise<ClassroomMemberView[]>;
  abstract memberIds(classroomId: string): Promise<string[]>;
  abstract markPremiumGranted(classroomId: string): Promise<void>;
  /** Transfer ownership: `newOwnerId` (a current member) becomes owner; the old owner joins as a member. */
  abstract transferOwnership(
    classroomId: string,
    newOwnerId: string,
    oldOwnerId: string,
  ): Promise<void>;

  // --- Assignments (6C) ---
  /** Assign content by slug (idempotent). Throws ContentNotFoundError if the slug doesn't exist. */
  abstract assignContent(classroomId: string, slug: string): Promise<void>;
  abstract unassignContent(classroomId: string, slug: string): Promise<void>;
  /** Assigned content (slug + title), in assignment order. */
  abstract assignments(classroomId: string): Promise<AssignmentView[]>;
  /** Completed (memberId, contentSlug) pairs among the class's assigned content. */
  abstract completedAssignments(classroomId: string): Promise<{ memberId: string; slug: string }[]>;

  // --- Invitations (6C) ---
  abstract createInvitation(classroomId: string, email: string, token: string): Promise<void>;
  abstract findInvitationByToken(
    token: string,
  ): Promise<{ classroomId: string; email: string; acceptedAt: Date | null } | null>;
  abstract markInvitationAccepted(token: string): Promise<void>;
  abstract listInvitations(classroomId: string): Promise<{ email: string; accepted: boolean }[]>;
}
