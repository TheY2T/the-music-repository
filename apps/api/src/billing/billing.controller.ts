import { FlagKeys } from '@TheY2T/tmr-flags';
import { Controller, Headers, HttpCode, Post, Req } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RequireFlagsEnabled } from '@openfeature/nestjs-sdk';
import { CurrentUser } from '../auth/application/current-user';
import { RequireAuth } from '../auth/require-permissions.decorator';
import { HandleBillingWebhookUseCase } from './application/use-cases/handle-billing-webhook.use-case';
import { OpenBillingPortalUseCase } from './application/use-cases/open-billing-portal.use-case';
import { StartCheckoutUseCase } from './application/use-cases/start-checkout.use-case';

/** The bits of the inbound request we read for the webhook. `rawBody` is present only when raw-body
 * capture is enabled (Phase-6 hardening); otherwise we re-serialize the parsed `body` (mock path). */
interface WebhookRequest {
  rawBody?: Buffer;
  body?: unknown;
}

/**
 * Billing surface. `POST /me/checkout` (client-facing, in TypeSpec) starts a checkout; premium is
 * granted by the provider callback `POST /billing/webhook` — an **inbound provider endpoint** kept
 * out of the client contract (like Better Auth's routes), unauthenticated, verified by signature.
 */
@Controller()
export class BillingController {
  constructor(
    private readonly config: ConfigService,
    private readonly currentUser: CurrentUser,
    private readonly startCheckout: StartCheckoutUseCase,
    private readonly handleWebhook: HandleBillingWebhookUseCase,
    private readonly openPortal: OpenBillingPortalUseCase,
  ) {}

  @Post('me/checkout')
  @RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.Premium }] })
  @RequireAuth()
  checkout(): Promise<{ url: string }> {
    const webBase = this.config.get<string>('WEB_BASE_URL') ?? 'http://localhost:4321';
    return this.startCheckout.execute(
      this.currentUser.require().id,
      `${webBase}/upgrade?status=success`,
      `${webBase}/upgrade?status=cancel`,
    );
  }

  @Post('me/billing-portal')
  @RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.Premium }] })
  @RequireAuth()
  billingPortal(): Promise<{ url: string }> {
    return this.openPortal.execute(this.currentUser.require().id);
  }

  @Post('billing/webhook')
  @HttpCode(200)
  async webhook(
    @Req() req: WebhookRequest,
    @Headers('stripe-signature') signature?: string,
  ): Promise<{ received: true }> {
    // Stripe verification needs the exact bytes; `req.rawBody` is populated when raw-body capture is
    // enabled (a Phase-6 hardening step, once real keys land). The mock gateway ignores the signature
    // and parses JSON, so re-serializing the parsed body is sufficient in dev/CI.
    const rawBody = req.rawBody?.toString('utf8') ?? JSON.stringify(req.body ?? {});
    await this.handleWebhook.execute(rawBody, signature);
    return { received: true };
  }
}
