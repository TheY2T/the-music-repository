const API_BASE = import.meta.env.PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

export interface SubscriptionStatus {
  premium: boolean;
  /** `subscription` | `staff` | `none`. */
  source: string;
  since?: string;
}

/** The current user's premium status; null when unauthenticated / the flag is off / on error. */
export async function getSubscription(): Promise<SubscriptionStatus | null> {
  const response = await fetch(`${API_BASE}/me/subscription`, { credentials: 'include' });
  if (!response.ok) {
    return null;
  }
  return (await response.json()) as SubscriptionStatus;
}

/** Activate premium (mock checkout). Returns the new status, or null on failure. */
export async function activatePremium(): Promise<SubscriptionStatus | null> {
  const response = await fetch(`${API_BASE}/me/subscription/activate`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!response.ok) {
    return null;
  }
  return (await response.json()) as SubscriptionStatus;
}

export async function cancelPremium(): Promise<void> {
  await fetch(`${API_BASE}/me/subscription`, { method: 'DELETE', credentials: 'include' });
}
