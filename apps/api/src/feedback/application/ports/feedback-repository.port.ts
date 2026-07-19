import type {
  FeedbackBoardItemView,
  FeedbackStatus,
  FeedbackSubmissionView,
  FeedbackType,
  FeedbackUpdateData,
  FeedbackWriteData,
} from '../../domain/feedback-submission';

export interface FeedbackListFilter {
  type?: FeedbackType;
  status?: FeedbackStatus;
  page: number;
  pageSize: number;
}

export interface FeedbackPage {
  items: FeedbackSubmissionView[];
  total: number;
}

export interface BoardListOptions {
  sort: 'top' | 'new';
  page: number;
  pageSize: number;
  /** The viewer, so each item reports whether they have voted; null for anonymous. */
  viewerId: string | null;
}

export interface BoardPage {
  items: FeedbackBoardItemView[];
  total: number;
}

/** FeedbackRepository (DDD) — persist/read feedback submissions and their board votes. */
export abstract class FeedbackRepository {
  abstract create(data: FeedbackWriteData): Promise<FeedbackSubmissionView>;
  abstract list(filter: FeedbackListFilter): Promise<FeedbackPage>;
  abstract getById(id: string): Promise<FeedbackSubmissionView | null>;
  abstract update(id: string, data: FeedbackUpdateData): Promise<FeedbackSubmissionView | null>;
  abstract delete(id: string): Promise<void>;

  /** Public board — submissions marked `isPublic`, with the viewer's vote state. */
  abstract listBoard(options: BoardListOptions): Promise<BoardPage>;
  /** Add a vote (idempotent); returns the refreshed board item, or null if the item is not votable. */
  abstract addVote(id: string, userId: string): Promise<FeedbackBoardItemView | null>;
  /** Remove a vote (idempotent); returns the refreshed board item, or null if not votable. */
  abstract removeVote(id: string, userId: string): Promise<FeedbackBoardItemView | null>;
}
