import { useEffect, useState } from 'react';
import {
  activatePremium,
  cancelPremium,
  getSubscription,
  type SubscriptionStatus,
} from '@/lib/subscription-api';

export default function UpgradePanel() {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    setStatus(await getSubscription());
    setLoading(false);
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function onActivate() {
    setBusy(true);
    await activatePremium();
    await refresh();
    setBusy(false);
  }

  async function onCancel() {
    setBusy(true);
    await cancelPremium();
    await refresh();
    setBusy(false);
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  const premium = status?.premium ?? false;
  const isStaff = status?.source === 'staff';

  return (
    <div className="space-y-6">
      <div
        className={`rounded-lg border p-6 ${
          premium ? 'border-green-600/40 bg-green-600/10' : 'border-border'
        }`}
      >
        <p className="text-lg font-semibold">{premium ? '✓ Premium active' : 'Free plan'}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {isStaff
            ? 'You have full access as a staff member (editor/admin).'
            : premium
              ? 'You can access all premium scores, recordings, and lessons.'
              : 'Premium content is locked. Subscribe to unlock every premium item.'}
        </p>
      </div>

      <ul className="space-y-1 text-sm text-muted-foreground">
        <li>• Full scores & PDF downloads for premium repertoire</li>
        <li>• Premium recordings and play-along backing tracks</li>
        <li>• In-depth theory & technique lessons</li>
      </ul>

      {isStaff ? null : premium ? (
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="rounded-md border border-border px-4 py-2 text-sm font-medium"
        >
          {busy ? 'Working…' : 'Cancel premium'}
        </button>
      ) : (
        <button
          type="button"
          onClick={onActivate}
          disabled={busy}
          className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground"
        >
          {busy ? 'Working…' : 'Activate premium'}
        </button>
      )}

      <p className="text-xs text-muted-foreground">
        This is a <strong>mock checkout</strong> for local development — it grants the entitlement
        directly, standing in for a payment provider's subscription. No card, no charge.
      </p>
    </div>
  );
}
