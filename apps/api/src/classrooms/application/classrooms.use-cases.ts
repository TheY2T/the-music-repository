import { randomInt } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { Entitlements } from '../../entitlements/application/ports/entitlements.port';
import type { ClassroomDetailView, ClassroomView } from '../domain/classroom';
import {
  ClassroomNotFoundError,
  InvalidJoinCodeError,
  NotClassroomOwnerError,
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
  constructor(private readonly repository: ClassroomsRepository) {}

  async execute(userId: string, code: string): Promise<ClassroomView> {
    const row = await this.repository.findByCode(code.trim().toUpperCase());
    if (!row) {
      throw new InvalidJoinCodeError(code);
    }
    if (row.ownerId !== userId) {
      await this.repository.addMember(row.id, userId);
    }
    const memberCount = (await this.repository.memberIds(row.id)).length;
    return toView(row, userId, memberCount);
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
