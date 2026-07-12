import { useEffect, useState } from 'react';
import { completeMockCheckout } from '@/lib/subscription-api';

interface CheckoutParams {
  session: string;
  success: string;
  cancel: string;
}

/**
 * Dev-only stand-in for a Stripe-hosted checkout page. Reads the session + return URLs from the query
 * string (built by the mock gateway), and on "Pay" simulates the provider firing the
 * `checkout.session.completed` webhook (which grants premium) before redirecting back. With real
 * Stripe keys this page is never reached — the checkout URL points at Stripe instead.
 */
export default function MockCheckout() {
  const [params, setParams] = useState<CheckoutParams | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setParams({
      session: p.get('session') ?? '',
      success: p.get('success') ?? '/upgrade?status=success',
      cancel: p.get('cancel') ?? '/upgrade?status=cancel',
    });
  }, []);

  if (!params) {
    return null;
  }

  async function pay(p: CheckoutParams) {
    setBusy(true);
    await completeMockCheckout(p.session);
    window.location.href = p.success;
  }

  return (
    <div className="space-y-6 rounded-lg border border-border p-6">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Mock payment provider</p>
        <p className="text-lg font-semibold">The Music Repository — Premium</p>
        <p className="text-sm text-muted-foreground">$8.00 / month · test mode, no card required</p>
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => pay(params)}
          disabled={busy || !params.session}
          className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground disabled:opacity-40"
        >
          {busy ? 'Processing…' : 'Pay $8.00'}
        </button>
        <a
          href={params.cancel}
          className="rounded-md border border-border px-4 py-2 text-sm font-medium"
        >
          Cancel
        </a>
      </div>
      <p className="text-xs text-muted-foreground">
        Clicking Pay simulates the provider firing its <strong>checkout.session.completed</strong>{' '}
        webhook to the API, which grants your premium entitlement — then returns you to the app.
      </p>
    </div>
  );
}
