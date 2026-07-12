/** Classrooms domain — pure view shapes matching the API contract. */

export interface ClassroomView {
  id: string;
  name: string;
  joinCode: string;
  memberCount: number;
  role: 'owner' | 'member';
  premiumGranted: boolean;
}

export interface ClassroomMemberView {
  id: string;
  name: string;
  email: string;
}

export interface ClassroomDetailView extends ClassroomView {
  members: ClassroomMemberView[];
}

/** A content item assigned to a classroom. */
export interface AssignmentView {
  slug: string;
  title: string;
}

/** A member's completion across the class's assigned content. */
export interface MemberProgressView {
  id: string;
  name: string;
  email: string;
  completedCount: number;
  total: number;
}

/** The teacher's class-progress overview. */
export interface ClassProgressView {
  assignments: AssignmentView[];
  members: MemberProgressView[];
}

/** A created invitation (returned to the owner so they can also share the link directly). */
export interface InvitationView {
  email: string;
  acceptUrl: string;
}

/** One pending/accepted invitation in the owner's list. */
export interface InvitationListItem {
  email: string;
  accepted: boolean;
}
