import { Inject, Injectable } from '@nestjs/common';
import { and, asc, count, desc, eq, inArray, isNull } from 'drizzle-orm';
import { user } from '../../auth/auth-schema';
import { ContentNotFoundError } from '../../catalogue/domain/errors/content-not-found.error';
import { DATABASE, type Database } from '../../infrastructure/database/database.module';
import {
  classroomAssignments,
  classroomInvitations,
  classroomMembers,
  classrooms,
  contentItems,
  contentProgress,
} from '../../infrastructure/database/schema';
import {
  type ClassroomRow,
  ClassroomsRepository,
} from '../application/ports/classrooms-repository.port';
import type { AssignmentView, ClassroomMemberView } from '../domain/classroom';

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

  async transferOwnership(
    classroomId: string,
    newOwnerId: string,
    oldOwnerId: string,
  ): Promise<void> {
    await this.db
      .update(classrooms)
      .set({ ownerId: newOwnerId })
      .where(eq(classrooms.id, classroomId));
    // New owner is no longer a plain member; the old owner becomes one.
    await this.removeMember(classroomId, newOwnerId);
    await this.addMember(classroomId, oldOwnerId);
  }

  async assignContent(classroomId: string, slug: string): Promise<void> {
    const contentId = await this.contentIdBySlug(slug);
    if (!contentId) {
      throw new ContentNotFoundError(slug);
    }
    const [existing] = await this.db
      .select({ n: count() })
      .from(classroomAssignments)
      .where(eq(classroomAssignments.classroomId, classroomId));
    await this.db
      .insert(classroomAssignments)
      .values({ classroomId, contentId, position: existing?.n ?? 0 })
      .onConflictDoNothing();
  }

  async unassignContent(classroomId: string, slug: string): Promise<void> {
    const contentId = await this.contentIdBySlug(slug);
    if (!contentId) {
      return;
    }
    await this.db
      .delete(classroomAssignments)
      .where(
        and(
          eq(classroomAssignments.classroomId, classroomId),
          eq(classroomAssignments.contentId, contentId),
        ),
      );
  }

  async assignments(classroomId: string): Promise<AssignmentView[]> {
    const rows = await this.db
      .select({ slug: contentItems.slug, title: contentItems.title })
      .from(classroomAssignments)
      .innerJoin(contentItems, eq(classroomAssignments.contentId, contentItems.id))
      .where(eq(classroomAssignments.classroomId, classroomId))
      .orderBy(asc(classroomAssignments.position));
    return rows.map((r) => ({ slug: r.slug, title: r.title }));
  }

  async completedAssignments(classroomId: string): Promise<{ memberId: string; slug: string }[]> {
    const memberIds = await this.memberIds(classroomId);
    if (memberIds.length === 0) {
      return [];
    }
    const rows = await this.db
      .select({ memberId: contentProgress.userId, slug: contentItems.slug })
      .from(classroomAssignments)
      .innerJoin(contentItems, eq(classroomAssignments.contentId, contentItems.id))
      .innerJoin(contentProgress, eq(contentProgress.contentId, classroomAssignments.contentId))
      .where(
        and(
          eq(classroomAssignments.classroomId, classroomId),
          inArray(contentProgress.userId, memberIds),
        ),
      );
    return rows.map((r) => ({ memberId: r.memberId, slug: r.slug }));
  }

  async createInvitation(classroomId: string, email: string, token: string): Promise<void> {
    await this.db.insert(classroomInvitations).values({ classroomId, email, token });
  }

  async findInvitationByToken(
    token: string,
  ): Promise<{ classroomId: string; email: string; acceptedAt: Date | null } | null> {
    const [row] = await this.db
      .select({
        classroomId: classroomInvitations.classroomId,
        email: classroomInvitations.email,
        acceptedAt: classroomInvitations.acceptedAt,
      })
      .from(classroomInvitations)
      .where(eq(classroomInvitations.token, token))
      .limit(1);
    return row ?? null;
  }

  async markInvitationAccepted(token: string): Promise<void> {
    await this.db
      .update(classroomInvitations)
      .set({ acceptedAt: new Date() })
      .where(eq(classroomInvitations.token, token));
  }

  async listInvitations(classroomId: string): Promise<{ email: string; accepted: boolean }[]> {
    const rows = await this.db
      .select({ email: classroomInvitations.email, acceptedAt: classroomInvitations.acceptedAt })
      .from(classroomInvitations)
      .where(eq(classroomInvitations.classroomId, classroomId))
      .orderBy(desc(classroomInvitations.createdAt));
    return rows.map((r) => ({ email: r.email, accepted: r.acceptedAt !== null }));
  }

  private async contentIdBySlug(slug: string): Promise<string | null> {
    const [row] = await this.db
      .select({ id: contentItems.id })
      .from(contentItems)
      .where(eq(contentItems.slug, slug))
      .limit(1);
    return row?.id ?? null;
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
