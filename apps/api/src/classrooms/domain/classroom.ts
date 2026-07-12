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
