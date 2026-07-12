import { FlagKeys } from '@TheY2T/tmr-flags';
import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { RequireFlagsEnabled } from '@openfeature/nestjs-sdk';
import { RequireAuth } from '../auth/require-permissions.decorator';
import { CreateRedeemCodeUseCase, RedeemCodeUseCase } from './application/redemption.use-cases';
import { CreateRedeemCodeDto, RedeemCodeDto } from './dto/redemption.dto';

/**
 * Gift / redeem codes (Phase 6, 6B). Minting is staff-only (enforced in the use-case via `CurrentUser`
 * roles → 403 `NOT_STAFF`); redeeming grants premium to the acting user. Gated on `monetization.premium`
 * (method-level).
 */
@Controller()
export class RedemptionController {
  constructor(
    private readonly createCode: CreateRedeemCodeUseCase,
    private readonly redeem: RedeemCodeUseCase,
  ) {}

  @Post('admin/redeem-codes')
  @HttpCode(201)
  @RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.Premium }] })
  @RequireAuth()
  create(@Body() body: CreateRedeemCodeDto) {
    return this.createCode.execute({ durationDays: body.durationDays, uses: body.uses });
  }

  @Post('me/redeem')
  @RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.Premium }] })
  @RequireAuth()
  redeemCode(@Body() body: RedeemCodeDto) {
    return this.redeem.execute(body.code);
  }
}
