import type { ContactMessageInput, ContactMessageResult } from '@TheY2T/tmr-api-client';

const API_BASE = import.meta.env.PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

/** Send a contact-form submission to the API, surfacing problem+json errors. */
export async function submitContact(body: ContactMessageInput): Promise<ContactMessageResult> {
  const response = await fetch(`${API_BASE}/contact`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`;
    try {
      const problem = (await response.json()) as { detail?: string; title?: string };
      message = problem.detail ?? problem.title ?? message;
    } catch {
      // keep the status line
    }
    throw new Error(message);
  }
  return (await response.json()) as ContactMessageResult;
}

export type { ContactMessageInput, ContactMessageResult };
