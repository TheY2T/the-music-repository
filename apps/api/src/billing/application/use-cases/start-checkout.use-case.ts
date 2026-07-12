import { Injectable } from '@nestjs/common';
import { CheckoutGateway } from '../ports/checkout-gateway.port';
import { CheckoutSessionStore } from '../ports/checkout-session-store.port';

@Injectable()
export class StartCheckoutUseCase {
  constructor(
    private readonly gateway: CheckoutGateway,
    private readonly sessions: CheckoutSessionStore,
  ) {}

  /** Start a checkout for the user + plan (`premium` | `pro`); returns the URL to redirect to. The
   * entitlement is granted later by the provider webhook, not here. */
  async execute(
    userId: string,
    plan: string,
    successUrl: string,
    cancelUrl: string,
  ): Promise<{ url: string }> {
    const { url, sessionId } = await this.gateway.createCheckoutSession({
      userId,
      plan,
      successUrl,
      cancelUrl,
    });
    await this.sessions.create({
      id: sessionId,
      userId,
      provider: this.gateway.provider,
      entitlementKey: plan,
    });
    return { url };
  }
}
