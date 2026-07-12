import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { user } from '../../auth/auth-schema';
import { DATABASE, type Database } from '../../infrastructure/database/database.module';
import { classroomMembers, classrooms } from '../../infrastructure/database/schema';
import {
  type ClassroomRow,
  ClassroomsRepository,
} from '../application/ports/classrooms-repository.port';
import type { ClassroomMemberView } from '../domain/classroom';

@Injectable()
export class DrizzleClassrooms extends ClassroomsRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {
    super();
  }

  async create(ownerId: string, name: string, joinCode: string): Promise<ClassroomRow> {
    const [row] = await this.db.insert(classrooms).values({ ownerId, name, joinCode }).returning();
    if (!row) {
      throw new Error('Failed to create classroom.');
    }
    return this.toRow(row);
  }

  async findById(id: string): Promise<ClassroomRow | null> {
    const [row] = await this.db.select().from(classrooms).where(eq(classrooms.id, id)).limit(1);
    return row ? this.toRow(row) : null;
  }

  async findByCode(code: string): Promise<ClassroomRow | null> {
    const [row] = await this.db
      .select()
      .from(classrooms)
      .where(and(eq(classrooms.joinCode, code), isNull(classrooms.archivedAt)))
      .limit(1);
    return row ? this.toRow(row) : null;
  }

  async addMember(classroomId: string, userId: string): Promise<void> {
    await this.db.insert(classroomMembers).values({ classroomId, userId }).onConflictDoNothing();
  }

  async removeMember(classroomId: string, userId: string): Promise<void> {
    await this.db
      .delete(classroomMembers)
      .where(
        and(eq(classroomMembers.classroomId, classroomId), eq(classroomMembers.userId, userId)),
      );
  }

  async archive(classroomId: string): Promise<void> {
    await this.db
      .update(classrooms)
      .set({ archivedAt: new Date() })
      .where(eq(classrooms.id, classroomId));
  }

  async isOwnerOrMember(classroomId: string, userId: string): Promise<boolean> {
    const [owned] = await this.db
      .select({ id: classrooms.id })
      .from(classrooms)
      .where(and(eq(classrooms.id, classroomId), eq(classrooms.ownerId, userId)))
      .limit(1);
    if (owned) {
      return true;
    }
    const [member] = await this.db
      .select({ userId: classroomMembers.userId })
      .from(classroomMembers)
      .where(
        and(eq(classroomMembers.classroomId, classroomId), eq(classroomMembers.userId, userId)),
      )
      .limit(1);
    return Boolean(member);
  }

  async listForUser(userId: string): Promise<{ row: ClassroomRow; memberCount: number }[]> {
    const owned = await this.db
      .select()
      .from(classrooms)
      .where(and(eq(classrooms.ownerId, userId), isNull(classrooms.archivedAt)))
      .orderBy(desc(classrooms.createdAt));
    const joinedRows = await this.db
      .select({ classroom: classrooms })
      .from(classroomMembers)
      .innerJoin(classrooms, eq(classroomMembers.classroomId, classrooms.id))
      .where(and(eq(classroomMembers.userId, userId), isNull(classrooms.archivedAt)))
      .orderBy(desc(classrooms.createdAt));
    const all = [...owned, ...joinedRows.map((r) => r.classroom)];
    return Promise.all(
      all.map(async (row) => ({
        row: this.toRow(row),
        memberCount: (await this.memberIds(row.id)).length,
      })),
    );
  }

  async members(classroomId: string): Promise<ClassroomMemberView[]> {
    const rows = await this.db
      .select({ id: user.id, name: user.name, email: user.email })
      .from(classroomMembers)
      .innerJoin(user, eq(classroomMembers.userId, user.id))
      .where(eq(classroomMembers.classroomId, classroomId));
    return rows.map((r) => ({ id: r.id, name: r.name, email: r.email }));
  }

  async memberIds(classroomId: string): Promise<string[]> {
    const rows = await this.db
      .select({ userId: classroomMembers.userId })
      .from(classroomMembers)
      .where(eq(classroomMembers.classroomId, classroomId));
    return rows.map((r) => r.userId);
  }

  async markPremiumGranted(classroomId: string): Promise<void> {
    await this.db
      .update(classrooms)
      .set({ premiumGranted: true })
      .where(eq(classrooms.id, classroomId));
  }

  private toRow(row: typeof classrooms.$inferSelect): ClassroomRow {
    return {
      id: row.id,
      name: row.name,
      joinCode: row.joinCode,
      ownerId: row.ownerId,
      premiumGranted: row.premiumGranted,
    };
  }
}
