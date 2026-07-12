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
  name: string;
  email: string;
}
export interface ClassroomDetail extends Classroom {
  members: ClassroomMember[];
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
