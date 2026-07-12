import { randomInt } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { CurrentUser } from '../../auth/application/current-user';
import { Entitlements } from '../../entitlements/application/ports/entitlements.port';
import { InvalidRedeemCodeError, NotStaffError } from '../domain/errors/redemption-errors';
import { RedeemCodeStore } from './ports/redeem-code-store.port';

const STAFF_ROLES = ['admin', 'editor'];
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateCode(): string {
  let code = '';
  for (let i = 0; i < 10; i += 1) {
    code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  }
  return code;
}

@Injectable()
export class CreateRedeemCodeUseCase {
  constructor(
    private readonly currentUser: CurrentUser,
    private readonly store: RedeemCodeStore,
  ) {}

  /** Mint a gift code (staff only). `durationDays` null = the grant never expires; `uses` defaults to 1. */
  async execute(input: { durationDays?: number | null; uses?: number }): Promise<{ code: string }> {
    const user = this.currentUser.require();
    if (!user.roles.some((role) => STAFF_ROLES.includes(role))) {
      throw new NotStaffError();
    }
    const code = generateCode();
    await this.store.create({
      code,
      key: 'premium',
      source: 'redeem',
      durationDays: input.durationDays ?? null,
      usesRemaining: Math.max(1, input.uses ?? 1),
      createdBy: user.id,
    });
    return { code };
  }
}

@Injectable()
export class RedeemCodeUseCase {
  constructor(
    private readonly currentUser: CurrentUser,
    private readonly store: RedeemCodeStore,
    private readonly entitlements: Entitlements,
  ) {}

  /** Redeem a code for the acting user → grants the entitlement (idempotent per remaining use). */
  async execute(rawCode: string): Promise<{ redeemed: true; expiresAt: string | null }> {
    const consumed = await this.store.consume(rawCode.trim().toUpperCase());
    if (!consumed) {
      throw new InvalidRedeemCodeError(rawCode);
    }
    const expiresAt = consumed.durationDays
      ? new Date(Date.now() + consumed.durationDays * 24 * 60 * 60 * 1000)
      : null;
    await this.entitlements.grantPremium(this.currentUser.require().id, consumed.source, expiresAt);
    return { redeemed: true, expiresAt: expiresAt?.toISOString() ?? null };
  }
}
