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

/** Start a checkout for a plan (`premium` | `pro`) — returns the provider URL to redirect to (Stripe,
 * or the mock checkout page in dev). The entitlement is granted by the webhook on completion, not here. */
export async function startCheckout(plan = 'premium'): Promise<{ url: string } | null> {
  const response = await fetch(`${API_BASE}/me/checkout`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan }),
  });
  if (!response.ok) {
    return null;
  }
  return (await response.json()) as { url: string };
}

/** Dev/mock only: the mock checkout page calls this to simulate the provider firing the
 * `checkout.session.completed` webhook (real Stripe fires it server-side, never the browser). */
export async function completeMockCheckout(sessionId: string): Promise<void> {
  await fetch(`${API_BASE}/billing/webhook`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: `evt_${sessionId}`,
      type: 'checkout.session.completed',
      data: { object: { id: sessionId } },
    }),
  });
}
