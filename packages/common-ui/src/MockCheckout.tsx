import { type Locale, type MessageKey, t } from '@TheY2T/tmr-i18n';
import { Button, buttonVariants, Card, cn, Icon } from '@TheY2T/tmr-ui';
import { completeMockCheckout } from '@TheY2T/tmr-web-data/subscription-api';
import { useEffect, useState } from 'react';

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
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent/15 text-accent">
          <Icon name="crown" className="size-5" />
        </span>
        <div className="min-w-0 space-y-0.5">
          <p className="text-sm font-medium text-muted-foreground">
            {t(locale, 'checkout.provider')}
          </p>
          <p className="font-display text-lg font-semibold tracking-tight">
            {t(locale, 'checkout.planLine', { plan: planLabel(locale, params.plan) })}
          </p>
          <p className="text-sm text-muted-foreground">
            {t(locale, 'checkout.priceLine', { price })}
          </p>
        </div>
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
        <a href={params.cancel} className={cn(buttonVariants({ variant: 'outline' }))}>
          {t(locale, 'checkout.cancel')}
        </a>
      </div>
      <p className="text-xs text-muted-foreground">{t(locale, 'checkout.webhookNote')}</p>
    </Card>
  );
}
