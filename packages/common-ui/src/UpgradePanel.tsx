import { type Locale, type MessageKey, t } from '@TheY2T/tmr-i18n';
import { Button, Card, cn, Icon } from '@TheY2T/tmr-ui';
import {
  cancelPremium,
  getSubscription,
  type SubscriptionStatus,
  startCheckout,
} from '@TheY2T/tmr-web-acl/subscription-api';
import { useEffect, useState } from 'react';

/** Localized plan name for the given plan id (`premium`/`pro`/`institution`). */
function tierLabel(locale: Locale, plan: string): string {
  const key: MessageKey =
    plan === 'pro' ? 'tier.pro' : plan === 'institution' ? 'tier.institution' : 'tier.premium';
  return t(locale, key);
}

interface Plan {
  id: string;
  price: string;
  ctaKey: MessageKey;
  featured?: boolean;
}

/** Selectable plans (mirrors the mock-checkout price table). `featured` gets the filled CTA. */
const PLANS: readonly Plan[] = [
  { id: 'premium', price: '$8.00', ctaKey: 'upgrade.subscribePremium', featured: true },
  { id: 'pro', price: '$16.00', ctaKey: 'upgrade.subscribePro' },
  { id: 'institution', price: '$40.00', ctaKey: 'upgrade.subscribeInstitution' },
];

const BENEFIT_KEYS: MessageKey[] = ['upgrade.benefit1', 'upgrade.benefit2', 'upgrade.benefit3'];

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
      <Card
        className={cn('flex items-start gap-3 p-6', premium && 'border-success/40 bg-success/10')}
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent/15 text-accent">
          <Icon name={premium ? 'circle-check' : 'crown'} className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="font-display text-lg font-semibold tracking-tight">
            {premium ? t(locale, 'upgrade.premiumActive') : t(locale, 'upgrade.freePlan')}
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {isStaff
              ? t(locale, 'upgrade.staffMsg')
              : premium
                ? t(locale, 'upgrade.activeMsg')
                : t(locale, 'upgrade.lockedMsg')}
          </p>
        </div>
      </Card>

      <Card className="p-6">
        <ul className="space-y-2 text-sm">
          {BENEFIT_KEYS.map((key) => (
            <li key={key} className="flex items-start gap-2">
              <Icon name="circle-check" className="mt-0.5 size-4 shrink-0 text-success" />
              <span>{t(locale, key)}</span>
            </li>
          ))}
        </ul>
      </Card>

      {isStaff ? null : premium ? (
        <Button type="button" variant="outline" onClick={onCancel} disabled={busy}>
          {busy ? t(locale, 'upgrade.working') : t(locale, 'upgrade.cancel')}
        </Button>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          {PLANS.map((plan) => (
            <Card
              key={plan.id}
              className={cn(
                'flex flex-col gap-3 p-6',
                plan.featured && 'border-accent/50 ring-1 ring-accent/20',
              )}
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-accent/15 text-accent">
                <Icon name="crown" className="size-5" />
              </span>
              <div>
                <p className="font-display text-lg font-semibold tracking-tight">
                  {tierLabel(locale, plan.id)}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {t(locale, 'upgrade.perMonth', { price: plan.price })}
                </p>
              </div>
              <Button
                type="button"
                variant={plan.featured ? 'default' : 'outline'}
                onClick={() => onSubscribe(plan.id)}
                disabled={busy}
                className="mt-auto w-full"
              >
                {busy ? t(locale, 'upgrade.redirecting') : t(locale, plan.ctaKey)}
              </Button>
            </Card>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">{t(locale, 'upgrade.note')}</p>
    </div>
  );
}
