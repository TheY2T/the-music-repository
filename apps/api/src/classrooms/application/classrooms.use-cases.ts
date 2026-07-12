import { randomInt } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { Entitlements } from '../../entitlements/application/ports/entitlements.port';
import type {
  AssignmentView,
  ClassProgressView,
  ClassroomDetailView,
  ClassroomView,
} from '../domain/classroom';
import {
  ClassroomNotFoundError,
  InvalidJoinCodeError,
  MemberNotFoundError,
  NotClassroomOwnerError,
  OwnerCannotLeaveError,
} from '../domain/errors/classroom-errors';
import { type ClassroomRow, ClassroomsRepository } from './ports/classrooms-repository.port';

// Unambiguous alphabet (no 0/O/1/I) for readable join codes.
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateJoinCode(): string {
  let code = '';
  for (let i = 0; i < 6; i += 1) {
    code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  }
  return code;
}

function toView(row: ClassroomRow, viewerId: string, memberCount: number): ClassroomView {
  return {
    id: row.id,
    name: row.name,
    joinCode: row.joinCode,
    memberCount,
    role: row.ownerId === viewerId ? 'owner' : 'member',
    premiumGranted: row.premiumGranted,
  };
}

@Injectable()
export class CreateClassroomUseCase {
  constructor(private readonly repository: ClassroomsRepository) {}

  async execute(ownerId: string, name: string): Promise<ClassroomView> {
    // Retry a couple of times on the (rare) join-code collision.
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const code = generateJoinCode();
      if (!(await this.repository.findByCode(code))) {
        const row = await this.repository.create(ownerId, name.trim(), code);
        return toView(row, ownerId, 0);
      }
    }
    throw new Error('Could not allocate a unique join code.');
  }
}

@Injectable()
export class ListClassroomsUseCase {
  constructor(private readonly repository: ClassroomsRepository) {}

  async execute(userId: string): Promise<ClassroomView[]> {
    const rows = await this.repository.listForUser(userId);
    return rows.map(({ row, memberCount }) => toView(row, userId, memberCount));
  }
}

@Injectable()
export class JoinClassroomUseCase {
  constructor(
    private readonly repository: ClassroomsRepository,
    private readonly entitlements: Entitlements,
  ) {}

  async execute(userId: string, code: string): Promise<ClassroomView> {
    const row = await this.repository.findByCode(code.trim().toUpperCase());
    if (!row) {
      throw new InvalidJoinCodeError(code);
    }
    if (row.ownerId !== userId) {
      await this.repository.addMember(row.id, userId);
      // Auto-grant: if the class already has premium, a new member inherits it on join.
      if (row.premiumGranted) {
        await this.entitlements.grantPremium(userId, 'classroom');
      }
    }
    const memberCount = (await this.repository.memberIds(row.id)).length;
    return toView(row, userId, memberCount);
  }
}

@Injectable()
export class LeaveClassroomUseCase {
  constructor(private readonly repository: ClassroomsRepository) {}

  async execute(id: string, userId: string): Promise<void> {
    const row = await this.repository.findById(id);
    if (!row) {
      throw new ClassroomNotFoundError(id);
    }
    if (row.ownerId === userId) {
      throw new OwnerCannotLeaveError(id);
    }
    await this.repository.removeMember(id, userId);
  }
}

@Injectable()
export class RemoveMemberUseCase {
  constructor(private readonly repository: ClassroomsRepository) {}

  async execute(id: string, ownerId: string, memberId: string): Promise<void> {
    const row = await this.repository.findById(id);
    if (!row) {
      throw new ClassroomNotFoundError(id);
    }
    if (row.ownerId !== ownerId) {
      throw new NotClassroomOwnerError(id);
    }
    await this.repository.removeMember(id, memberId);
  }
}

@Injectable()
export class ArchiveClassroomUseCase {
  constructor(private readonly repository: ClassroomsRepository) {}

  async execute(id: string, ownerId: string): Promise<void> {
    const row = await this.repository.findById(id);
    if (!row) {
      throw new ClassroomNotFoundError(id);
    }
    if (row.ownerId !== ownerId) {
      throw new NotClassroomOwnerError(id);
    }
    await this.repository.archive(id);
  }
}

/** Shared: load a classroom the caller owns, or throw. */
async function requireOwned(
  repository: ClassroomsRepository,
  id: string,
  ownerId: string,
): Promise<void> {
  const row = await repository.findById(id);
  if (!row) {
    throw new ClassroomNotFoundError(id);
  }
  if (row.ownerId !== ownerId) {
    throw new NotClassroomOwnerError(id);
  }
}

@Injectable()
export class TransferOwnershipUseCase {
  constructor(private readonly repository: ClassroomsRepository) {}

  async execute(id: string, ownerId: string, newOwnerId: string): Promise<void> {
    await requireOwned(this.repository, id, ownerId);
    const members = await this.repository.memberIds(id);
    if (!members.includes(newOwnerId)) {
      throw new MemberNotFoundError(newOwnerId);
    }
    await this.repository.transferOwnership(id, newOwnerId, ownerId);
  }
}

@Injectable()
export class AssignContentUseCase {
  constructor(private readonly repository: ClassroomsRepository) {}

  async execute(id: string, ownerId: string, slug: string): Promise<AssignmentView[]> {
    await requireOwned(this.repository, id, ownerId);
    await this.repository.assignContent(id, slug.trim());
    return this.repository.assignments(id);
  }
}

@Injectable()
export class UnassignContentUseCase {
  constructor(private readonly repository: ClassroomsRepository) {}

  async execute(id: string, ownerId: string, slug: string): Promise<void> {
    await requireOwned(this.repository, id, ownerId);
    await this.repository.unassignContent(id, slug);
  }
}

@Injectable()
export class GetAssignmentsUseCase {
  constructor(private readonly repository: ClassroomsRepository) {}

  /** Any owner or member can see the assignment list. */
  async execute(id: string, viewerId: string): Promise<AssignmentView[]> {
    if (!(await this.repository.isOwnerOrMember(id, viewerId))) {
      throw new ClassroomNotFoundError(id);
    }
    return this.repository.assignments(id);
  }
}

@Injectable()
export class GetClassProgressUseCase {
  constructor(private readonly repository: ClassroomsRepository) {}

  /** Per-student completion across the class's assigned content (owner only). */
  async execute(id: string, ownerId: string): Promise<ClassProgressView> {
    await requireOwned(this.repository, id, ownerId);
    const [assignments, members, completed] = await Promise.all([
      this.repository.assignments(id),
      this.repository.members(id),
      this.repository.completedAssignments(id),
    ]);
    const doneByMember = new Map<string, Set<string>>();
    for (const { memberId, slug } of completed) {
      const set = doneByMember.get(memberId) ?? new Set<string>();
      set.add(slug);
      doneByMember.set(memberId, set);
    }
    return {
      assignments,
      members: members.map((m) => {
        const done = doneByMember.get(m.id) ?? new Set<string>();
        return {
          id: m.id,
          name: m.name,
          email: m.email,
          completedCount: assignments.filter((a) => done.has(a.slug)).length,
          total: assignments.length,
        };
      }),
    };
  }
}

@Injectable()
export class GetClassroomUseCase {
  constructor(private readonly repository: ClassroomsRepository) {}

  async execute(id: string, viewerId: string): Promise<ClassroomDetailView> {
    const row = await this.repository.findById(id);
    if (!row || !(await this.repository.isOwnerOrMember(id, viewerId))) {
      throw new ClassroomNotFoundError(id);
    }
    const members = await this.repository.members(id);
    return { ...toView(row, viewerId, members.length), members };
  }
}

@Injectable()
export class GrantClassroomPremiumUseCase {
  constructor(
    private readonly repository: ClassroomsRepository,
    private readonly getClassroom: GetClassroomUseCase,
    private readonly entitlements: Entitlements,
  ) {}

  async execute(id: string, ownerId: string): Promise<ClassroomDetailView> {
    const row = await this.repository.findById(id);
    if (!row) {
      throw new ClassroomNotFoundError(id);
    }
    if (row.ownerId !== ownerId) {
      throw new NotClassroomOwnerError(id);
    }
    for (const memberId of await this.repository.memberIds(id)) {
      await this.entitlements.grantPremium(memberId, 'classroom');
    }
    await this.repository.markPremiumGranted(id);
    return this.getClassroom.execute(id, ownerId);
  }
}
