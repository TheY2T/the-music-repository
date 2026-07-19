import { Inject, Injectable } from '@nestjs/common';
import { and, count, desc, eq, inArray } from 'drizzle-orm';
import { DATABASE, type Database } from '../../infrastructure/database/database.module';
import { feedbackSubmissions, feedbackVotes, user } from '../../infrastructure/database/schema';
import {
  type BoardListOptions,
  type BoardPage,
  type FeedbackListFilter,
  type FeedbackPage,
  FeedbackRepository,
} from '../application/ports/feedback-repository.port';
import type {
  FeedbackBoardItemView,
  FeedbackStatus,
  FeedbackSubmissionView,
  FeedbackType,
  FeedbackUpdateData,
  FeedbackWriteData,
} from '../domain/feedback-submission';

type SubmissionRow = typeof feedbackSubmissions.$inferSelect;

function toView(row: SubmissionRow, email: string | null): FeedbackSubmissionView {
  return {
    id: row.id,
    type: row.type as FeedbackType,
    title: row.title,
    message: row.message,
    status: row.status as FeedbackStatus,
    userId: row.userId,
    userEmail: email,
    locale: row.locale,
    pageUrl: row.pageUrl,
    userAgent: row.userAgent,
    isPublic: row.isPublic,
    upvoteCount: row.upvoteCount,
    adminNotes: row.adminNotes,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toBoardItem(row: SubmissionRow, hasVoted: boolean): FeedbackBoardItemView {
  return {
    id: row.id,
    type: row.type as FeedbackType,
    title: row.title,
    message: row.message,
    status: row.status as FeedbackStatus,
    upvoteCount: row.upvoteCount,
    hasVoted,
    createdAt: row.createdAt.toISOString(),
  };
}

@Injectable()
export class DrizzleFeedbackRepository extends FeedbackRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {
    super();
  }

  async create(data: FeedbackWriteData): Promise<FeedbackSubmissionView> {
    const [row] = await this.db
      .insert(feedbackSubmissions)
      .values({
        type: data.type,
        title: data.title,
        message: data.message,
        userId: data.userId,
        locale: data.locale,
        pageUrl: data.pageUrl,
        userAgent: data.userAgent,
      })
      .returning();
    return toView(row as SubmissionRow, null);
  }

  async list(filter: FeedbackListFilter): Promise<FeedbackPage> {
    const conditions = [];
    if (filter.type) conditions.push(eq(feedbackSubmissions.type, filter.type));
    if (filter.status) conditions.push(eq(feedbackSubmissions.status, filter.status));
    const where = conditions.length ? and(...conditions) : undefined;

    const [totals] = await this.db
      .select({ total: count() })
      .from(feedbackSubmissions)
      .where(where);

    const rows = await this.db
      .select({ submission: feedbackSubmissions, email: user.email })
      .from(feedbackSubmissions)
      .leftJoin(user, eq(feedbackSubmissions.userId, user.id))
      .where(where)
      .orderBy(desc(feedbackSubmissions.createdAt))
      .limit(filter.pageSize)
      .offset((filter.page - 1) * filter.pageSize);

    return {
      items: rows.map((r) => toView(r.submission, r.email)),
      total: Number(totals?.total ?? 0),
    };
  }

  async getById(id: string): Promise<FeedbackSubmissionView | null> {
    const [row] = await this.db
      .select({ submission: feedbackSubmissions, email: user.email })
      .from(feedbackSubmissions)
      .leftJoin(user, eq(feedbackSubmissions.userId, user.id))
      .where(eq(feedbackSubmissions.id, id))
      .limit(1);
    return row ? toView(row.submission, row.email) : null;
  }

  async update(id: string, data: FeedbackUpdateData): Promise<FeedbackSubmissionView | null> {
    const patch: Partial<SubmissionRow> = { updatedAt: new Date() };
    if (data.status !== undefined) patch.status = data.status;
    if (data.adminNotes !== undefined) patch.adminNotes = data.adminNotes;
    if (data.isPublic !== undefined) patch.isPublic = data.isPublic;
    const [row] = await this.db
      .update(feedbackSubmissions)
      .set(patch)
      .where(eq(feedbackSubmissions.id, id))
      .returning();
    return row ? this.getById((row as SubmissionRow).id) : null;
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(feedbackSubmissions).where(eq(feedbackSubmissions.id, id));
  }

  async listBoard(options: BoardListOptions): Promise<BoardPage> {
    const where = eq(feedbackSubmissions.isPublic, true);
    const [totals] = await this.db
      .select({ total: count() })
      .from(feedbackSubmissions)
      .where(where);

    const orderBy =
      options.sort === 'new'
        ? desc(feedbackSubmissions.createdAt)
        : desc(feedbackSubmissions.upvoteCount);
    const rows = await this.db
      .select()
      .from(feedbackSubmissions)
      .where(where)
      .orderBy(orderBy, desc(feedbackSubmissions.createdAt))
      .limit(options.pageSize)
      .offset((options.page - 1) * options.pageSize);

    const votedIds = await this.votedIdsFor(
      options.viewerId,
      rows.map((r) => r.id),
    );
    return {
      items: rows.map((row) => toBoardItem(row, votedIds.has(row.id))),
      total: Number(totals?.total ?? 0),
    };
  }

  async addVote(id: string, userId: string): Promise<FeedbackBoardItemView | null> {
    const submission = await this.votableSubmission(id);
    if (!submission) return null;
    await this.db.insert(feedbackVotes).values({ submissionId: id, userId }).onConflictDoNothing();
    return this.refreshVoteCount(id, true);
  }

  async removeVote(id: string, userId: string): Promise<FeedbackBoardItemView | null> {
    const submission = await this.votableSubmission(id);
    if (!submission) return null;
    await this.db
      .delete(feedbackVotes)
      .where(and(eq(feedbackVotes.submissionId, id), eq(feedbackVotes.userId, userId)));
    return this.refreshVoteCount(id, false);
  }

  /** The submission if it exists and is on the public board, else null. */
  private async votableSubmission(id: string): Promise<SubmissionRow | null> {
    const [row] = await this.db
      .select()
      .from(feedbackSubmissions)
      .where(and(eq(feedbackSubmissions.id, id), eq(feedbackSubmissions.isPublic, true)))
      .limit(1);
    return (row as SubmissionRow) ?? null;
  }

  /** Recompute the denormalised vote count from the votes table and return the refreshed board item. */
  private async refreshVoteCount(id: string, hasVoted: boolean): Promise<FeedbackBoardItemView> {
    const [totals] = await this.db
      .select({ total: count() })
      .from(feedbackVotes)
      .where(eq(feedbackVotes.submissionId, id));
    const [row] = await this.db
      .update(feedbackSubmissions)
      .set({ upvoteCount: Number(totals?.total ?? 0) })
      .where(eq(feedbackSubmissions.id, id))
      .returning();
    return toBoardItem(row as SubmissionRow, hasVoted);
  }

  private async votedIdsFor(
    viewerId: string | null,
    submissionIds: string[],
  ): Promise<Set<string>> {
    if (!viewerId || submissionIds.length === 0) {
      return new Set();
    }
    const rows = await this.db
      .select({ submissionId: feedbackVotes.submissionId })
      .from(feedbackVotes)
      .where(
        and(eq(feedbackVotes.userId, viewerId), inArray(feedbackVotes.submissionId, submissionIds)),
      );
    return new Set(rows.map((r) => r.submissionId));
  }
}
