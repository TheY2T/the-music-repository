import { type Locale, t } from '@TheY2T/tmr-i18n';
import { Button, Card } from '@TheY2T/tmr-ui';
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
      <Card className={`p-6 ${premium ? 'border-green-600/40 bg-green-600/10' : ''}`}>
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
      </Card>

      <ul className="space-y-1 text-sm text-muted-foreground">
        <li>• {t(locale, 'upgrade.benefit1')}</li>
        <li>• {t(locale, 'upgrade.benefit2')}</li>
        <li>• {t(locale, 'upgrade.benefit3')}</li>
      </ul>

      {isStaff ? null : premium ? (
        <Button type="button" variant="outline" onClick={onCancel} disabled={busy}>
          {busy ? t(locale, 'upgrade.working') : t(locale, 'upgrade.cancel')}
        </Button>
      ) : (
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            onClick={() => onSubscribe('premium')}
            disabled={busy}
            className="px-6"
          >
            {busy ? t(locale, 'upgrade.redirecting') : t(locale, 'upgrade.subscribePremium')}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onSubscribe('pro')}
            disabled={busy}
            className="border-primary px-6 text-primary"
          >
            {busy ? t(locale, 'upgrade.redirecting') : t(locale, 'upgrade.subscribePro')}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onSubscribe('institution')}
            disabled={busy}
            className="px-6"
          >
            {busy ? t(locale, 'upgrade.redirecting') : t(locale, 'upgrade.subscribeInstitution')}
          </Button>
        </div>
      )}

      <p className="text-xs text-muted-foreground">{t(locale, 'upgrade.note')}</p>
    </div>
  );
}
