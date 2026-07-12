import { type Locale, t } from '@TheY2T/tmr-i18n';
import { useEffect, useState } from 'react';
import {
  cancelPremium,
  getSubscription,
  type SubscriptionStatus,
  startCheckout,
} from '@/lib/subscription-api';

export default function UpgradePanel({ locale }: { locale: Locale }) {
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

  async function onSubscribe(plan: string) {
    setBusy(true);
    const session = await startCheckout(plan);
    if (session?.url) {
      window.location.href = session.url; // → provider checkout (Stripe, or the mock page in dev)
      return;
    }
    setBusy(false);
  }

  async function onCancel() {
    setBusy(true);
    await cancelPremium();
    await refresh();
    setBusy(false);
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">{t(locale, 'common.loading')}</p>;
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
        <p className="text-lg font-semibold">
          {premium ? t(locale, 'upgrade.premiumActive') : t(locale, 'upgrade.freePlan')}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {isStaff
            ? t(locale, 'upgrade.staffMsg')
            : premium
              ? t(locale, 'upgrade.activeMsg')
              : t(locale, 'upgrade.lockedMsg')}
        </p>
      </div>

      <ul className="space-y-1 text-sm text-muted-foreground">
        <li>• {t(locale, 'upgrade.benefit1')}</li>
        <li>• {t(locale, 'upgrade.benefit2')}</li>
        <li>• {t(locale, 'upgrade.benefit3')}</li>
      </ul>

      {isStaff ? null : premium ? (
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="rounded-md border border-border px-4 py-2 text-sm font-medium"
        >
          {busy ? t(locale, 'upgrade.working') : t(locale, 'upgrade.cancel')}
        </button>
      ) : (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => onSubscribe('premium')}
            disabled={busy}
            className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {busy ? t(locale, 'upgrade.redirecting') : t(locale, 'upgrade.subscribePremium')}
          </button>
          <button
            type="button"
            onClick={() => onSubscribe('pro')}
            disabled={busy}
            className="rounded-md border border-primary px-6 py-2 text-sm font-medium text-primary disabled:opacity-50"
          >
            {busy ? t(locale, 'upgrade.redirecting') : t(locale, 'upgrade.subscribePro')}
          </button>
          <button
            type="button"
            onClick={() => onSubscribe('institution')}
            disabled={busy}
            className="rounded-md border border-border px-6 py-2 text-sm font-medium disabled:opacity-50"
          >
            {busy ? t(locale, 'upgrade.redirecting') : t(locale, 'upgrade.subscribeInstitution')}
          </button>
        </div>
      )}

      <p className="text-xs text-muted-foreground">{t(locale, 'upgrade.note')}</p>
    </div>
  );
}
