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
  name: string;
  email: string;
}

export interface ClassroomDetailView extends ClassroomView {
  members: ClassroomMemberView[];
}
