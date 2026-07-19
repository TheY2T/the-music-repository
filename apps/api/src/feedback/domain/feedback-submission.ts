/** Feedback domain types — framework-free POJOs, no db imports. */

/** Submission category. */
export type FeedbackType = 'idea' | 'bug' | 'praise' | 'other';

/** Triage lifecycle state. */
export type FeedbackStatus =
  | 'new'
  | 'triaging'
  | 'planned'
  | 'in_progress'
  | 'shipped'
  | 'declined'
  | 'closed';

export const FEEDBACK_TYPES: readonly FeedbackType[] = ['idea', 'bug', 'praise', 'other'];
export const FEEDBACK_STATUSES: readonly FeedbackStatus[] = [
  'new',
  'triaging',
  'planned',
  'in_progress',
  'shipped',
  'declined',
  'closed',
];

/** A submission as seen by an admin during triage (carries the submitter's identity). */
export interface FeedbackSubmissionView {
  id: string;
  type: FeedbackType;
  title: string | null;
  message: string;
  status: FeedbackStatus;
  userId: string;
  userEmail: string | null;
  locale: string | null;
  pageUrl: string | null;
  userAgent: string | null;
  isPublic: boolean;
  upvoteCount: number;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

/** What the submit use-case persists after resolving the acting user. */
export interface FeedbackWriteData {
  type: FeedbackType;
  title: string | null;
  message: string;
  userId: string;
  locale: string | null;
  pageUrl: string | null;
  userAgent: string | null;
}

/** Admin triage mutation — every field optional (partial update). */
export interface FeedbackUpdateData {
  status?: FeedbackStatus;
  adminNotes?: string | null;
  isPublic?: boolean;
}

/** Public projection of a submission on the /roadmap board (no submitter identity). */
export interface FeedbackBoardItemView {
  id: string;
  type: FeedbackType;
  title: string | null;
  message: string;
  status: FeedbackStatus;
  upvoteCount: number;
  hasVoted: boolean;
  createdAt: string;
}
