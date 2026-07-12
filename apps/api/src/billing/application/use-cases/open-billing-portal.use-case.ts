import { Injectable } from '@nestjs/common';
import { CheckoutGateway } from '../ports/checkout-gateway.port';

@Injectable()
export class OpenBillingPortalUseCase {
  constructor(private readonly gateway: CheckoutGateway) {}

  execute(userId: string): Promise<{ url: string }> {
    return this.gateway.createBillingPortalSession(userId);
  }
}
