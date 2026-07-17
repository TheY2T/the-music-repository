const API_BASE = import.meta.env.PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

export interface Classroom {
  id: string;
  name: string;
  joinCode: string;
  memberCount: number;
  role: 'owner' | 'member';
  premiumGranted: boolean;
}
export interface ClassroomMember {
  id: string;
  name: string;
  email: string;
}
export interface ClassroomDetail extends Classroom {
  members: ClassroomMember[];
}
export interface Assignment {
  slug: string;
  title: string;
}
export interface MemberProgress {
  id: string;
  name: string;
  email: string;
  completedCount: number;
  total: number;
}
export interface ClassProgress {
  assignments: Assignment[];
  members: MemberProgress[];
}

export async function listClassrooms(): Promise<Classroom[]> {
  const response = await fetch(`${API_BASE}/me/classrooms`, { credentials: 'include' });
  if (!response.ok) {
    return [];
  }
  return ((await response.json()) as { items: Classroom[] }).items;
}

export async function createClassroom(name: string): Promise<Classroom | null> {
  const response = await fetch(`${API_BASE}/me/classrooms`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  return response.ok ? ((await response.json()) as Classroom) : null;
}

/** Returns the joined classroom, or an error message on failure (e.g. bad code). */
export async function joinClassroom(
  code: string,
): Promise<{ classroom?: Classroom; error?: string }> {
  const response = await fetch(`${API_BASE}/classrooms/join`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ code }),
  });
  if (response.ok) {
    return { classroom: (await response.json()) as Classroom };
  }
  return {
    error: response.status === 404 ? 'No classroom found for that code.' : 'Could not join.',
  };
}

export async function getClassroom(id: string): Promise<ClassroomDetail | null> {
  const response = await fetch(`${API_BASE}/classrooms/${id}`, { credentials: 'include' });
  return response.ok ? ((await response.json()) as ClassroomDetail) : null;
}

export async function grantClassroomPremium(id: string): Promise<ClassroomDetail | null> {
  const response = await fetch(`${API_BASE}/classrooms/${id}/grant-premium`, {
    method: 'POST',
    credentials: 'include',
  });
  return response.ok ? ((await response.json()) as ClassroomDetail) : null;
}

async function send(path: string, method: string, body?: unknown): Promise<boolean> {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: 'include',
    headers: body ? { 'content-type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  return response.ok;
}

export async function listAssignments(id: string): Promise<Assignment[]> {
  const response = await fetch(`${API_BASE}/classrooms/${id}/assignments`, {
    credentials: 'include',
  });
  return response.ok ? ((await response.json()) as { items: Assignment[] }).items : [];
}

/** Assign content by slug; returns the new list, or an error message (e.g. unknown slug). */
export async function assignContent(
  id: string,
  contentSlug: string,
): Promise<{ items?: Assignment[]; error?: string }> {
  const response = await fetch(`${API_BASE}/classrooms/${id}/assignments`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ contentSlug }),
  });
  if (response.ok) {
    return { items: ((await response.json()) as { items: Assignment[] }).items };
  }
  return { error: response.status === 404 ? 'No content with that slug.' : 'Could not assign.' };
}

export const unassignContent = (id: string, slug: string) =>
  send(`/classrooms/${id}/assignments/${encodeURIComponent(slug)}`, 'DELETE');

export async function getClassProgress(id: string): Promise<ClassProgress | null> {
  const response = await fetch(`${API_BASE}/classrooms/${id}/progress`, { credentials: 'include' });
  return response.ok ? ((await response.json()) as ClassProgress) : null;
}

export const removeMember = (id: string, memberId: string) =>
  send(`/classrooms/${id}/members/${memberId}`, 'DELETE');
export const transferOwnership = (id: string, memberId: string) =>
  send(`/classrooms/${id}/transfer`, 'POST', { memberId });
export const leaveClassroom = (id: string) => send(`/classrooms/${id}/leave`, 'POST');
export const archiveClassroom = (id: string) => send(`/classrooms/${id}/archive`, 'POST');

export interface InvitationItem {
  email: string;
  accepted: boolean;
}

/** Invite an email to a class; returns the accept URL (also emailed) or an error. */
export async function inviteToClassroom(
  id: string,
  email: string,
): Promise<{ acceptUrl?: string; error?: string }> {
  const response = await fetch(`${API_BASE}/classrooms/${id}/invitations`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (response.ok) {
    return { acceptUrl: ((await response.json()) as { acceptUrl: string }).acceptUrl };
  }
  return { error: 'Could not send the invitation.' };
}

export async function listInvitations(id: string): Promise<InvitationItem[]> {
  const response = await fetch(`${API_BASE}/classrooms/${id}/invitations`, {
    credentials: 'include',
  });
  return response.ok ? ((await response.json()) as { items: InvitationItem[] }).items : [];
}

/** Accept an invitation token → join the class. Returns ok. */
export const acceptInvitation = (token: string) =>
  send(`/classrooms/invitations/${encodeURIComponent(token)}/accept`, 'POST');
