import { type Locale, type MessageKey, t } from '@TheY2T/tmr-i18n';
import { Button, Card } from '@TheY2T/tmr-ui';
import { useEffect, useState } from 'react';
import { completeMockCheckout } from '@/lib/subscription-api';

interface CheckoutParams {
  session: string;
  plan: string;
  success: string;
  cancel: string;
}

const PLAN_PRICE: Record<string, string> = {
  premium: '$8.00',
  pro: '$16.00',
  institution: '$40.00',
};

/** Localized plan name for the given plan id (`premium`/`pro`/`institution`). */
function planLabel(locale: Locale, plan: string): string {
  const key: MessageKey =
    plan === 'pro' ? 'tier.pro' : plan === 'institution' ? 'tier.institution' : 'tier.premium';
  return t(locale, key);
}

/**
 * Dev-only stand-in for a Stripe-hosted checkout page. Reads the session + return URLs from the query
 * string (built by the mock gateway), and on "Pay" simulates the provider firing the
 * `checkout.session.completed` webhook (which grants premium) before redirecting back. With real
 * Stripe keys this page is never reached — the checkout URL points at Stripe instead.
 */
export default function MockCheckout({ locale }: { locale: Locale }) {
  const [params, setParams] = useState<CheckoutParams | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setParams({
      session: p.get('session') ?? '',
      plan: p.get('plan') ?? 'premium',
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

  const price = PLAN_PRICE[params.plan] ?? '$8.00';

  return (
    <Card className="space-y-6 p-6">
      <div>
        <p className="text-sm font-medium text-muted-foreground">
          {t(locale, 'checkout.provider')}
        </p>
        <p className="text-lg font-semibold">
          {t(locale, 'checkout.planLine', { plan: planLabel(locale, params.plan) })}
        </p>
        <p className="text-sm text-muted-foreground">
          {t(locale, 'checkout.priceLine', { price })}
        </p>
      </div>
      <div className="flex gap-3">
        <Button
          type="button"
          onClick={() => pay(params)}
          disabled={busy || !params.session}
          className="px-6"
        >
          {busy ? t(locale, 'checkout.processing') : t(locale, 'checkout.pay', { price })}
        </Button>
        <a
          href={params.cancel}
          className="rounded-md border border-border px-4 py-2 text-sm font-medium"
        >
          {t(locale, 'checkout.cancel')}
        </a>
      </div>
      <p className="text-xs text-muted-foreground">{t(locale, 'checkout.webhookNote')}</p>
    </Card>
  );
}
