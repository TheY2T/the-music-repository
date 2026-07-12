import { Injectable } from '@nestjs/common';
import { CurrentUser } from '../../auth/application/current-user';
import type { AuthenticatedUser } from '../../auth/domain/authenticated-user';
import { Entitlements } from './ports/entitlements.port';

/** Staff always have full access to premium content (they author/manage it). */
const STAFF_ROLES = ['admin', 'editor'];

export interface SubscriptionStatusView {
  premium: boolean;
  /** `subscription` (mock checkout) | `staff` | `none`. */
  source: string;
  since?: string;
}

/**
 * Premium-access rule for the current request. Combines the `CurrentUser` (identity/roles) with the
 * `Entitlements` store: a user is entitled when they are staff OR hold an active premium grant.
 * Request-scoped (depends on the request-scoped CurrentUser). Used by the subscription controller and
 * — via a plain boolean the controller passes down — by the catalogue gating.
 */
@Injectable()
export class PremiumAccessService {
  constructor(
    private readonly currentUser: CurrentUser,
    private readonly entitlements: Entitlements,
  ) {}

  private isStaff(user: AuthenticatedUser): boolean {
    return user.roles.some((role) => STAFF_ROLES.includes(role));
  }

  /** Entitlement for the current request; false when anonymous. Never throws. */
  async isEntitled(): Promise<boolean> {
    const user = this.currentUser.optional();
    if (!user) {
      return false;
    }
    if (this.isStaff(user)) {
      return true;
    }
    return (await this.entitlements.getPremium(user.id)) !== null;
  }

  /** The acting user's subscription status (requires authentication). */
  async status(): Promise<SubscriptionStatusView> {
    const user = this.currentUser.require();
    if (this.isStaff(user)) {
      return { premium: true, source: 'staff' };
    }
    const grant = await this.entitlements.getPremium(user.id);
    return grant
      ? { premium: true, source: grant.source, since: grant.grantedAt.toISOString() }
      : { premium: false, source: 'none' };
  }

  /** Activate premium (mock checkout). Staff already have access, so it's a no-op for them. */
  async activate(): Promise<SubscriptionStatusView> {
    const user = this.currentUser.require();
    if (!this.isStaff(user)) {
      await this.entitlements.grantPremium(user.id, 'subscription');
    }
    return this.status();
  }

  /** Cancel premium. */
  async cancel(): Promise<void> {
    await this.entitlements.revokePremium(this.currentUser.require().id);
  }
}
