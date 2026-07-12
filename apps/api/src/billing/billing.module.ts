import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import { EntitlementsModule } from '../entitlements/entitlements.module';
import { CheckoutGateway } from './application/ports/checkout-gateway.port';
import { CheckoutSessionStore } from './application/ports/checkout-session-store.port';
import { WebhookLedger } from './application/ports/webhook-ledger.port';
import { HandleBillingWebhookUseCase } from './application/use-cases/handle-billing-webhook.use-case';
import { OpenBillingPortalUseCase } from './application/use-cases/open-billing-portal.use-case';
import { StartCheckoutUseCase } from './application/use-cases/start-checkout.use-case';
import { BillingController } from './billing.controller';
import { DrizzleCheckoutSessionStore } from './infrastructure/drizzle-checkout-session-store';
import { DrizzleWebhookLedger } from './infrastructure/drizzle-webhook-ledger';
import { MockCheckoutGateway } from './infrastructure/mock-checkout.gateway';
import { StripeCheckoutGateway } from './infrastructure/stripe-checkout.gateway';

/**
 * Billing feature (hexagonal). The `CheckoutGateway` port binds to the **Stripe** adapter when
 * `STRIPE_SECRET_KEY` is configured, else the **mock** adapter (dev/CI) — app code never depends on
 * Stripe, only on the port. Imports EntitlementsModule so the webhook grants/revokes premium through
 * the existing `Entitlements` port; AuthModule for `CurrentUser`.
 */
@Module({
  imports: [AuthModule, EntitlementsModule],
  controllers: [BillingController],
  providers: [
    StartCheckoutUseCase,
    HandleBillingWebhookUseCase,
    OpenBillingPortalUseCase,
    { provide: CheckoutSessionStore, useClass: DrizzleCheckoutSessionStore },
    { provide: WebhookLedger, useClass: DrizzleWebhookLedger },
    {
      provide: CheckoutGateway,
      useFactory: (config: ConfigService, sessions: CheckoutSessionStore) =>
        config.get<string>('STRIPE_SECRET_KEY')
          ? new StripeCheckoutGateway(config, sessions)
          : new MockCheckoutGateway(config, sessions),
      inject: [ConfigService, CheckoutSessionStore],
    },
  ],
})
export class BillingModule {}
