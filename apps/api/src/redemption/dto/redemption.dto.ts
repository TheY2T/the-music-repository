import { CreateRedeemCodeBody, RedeemCodeBody } from '@TheY2T/tmr-contracts';
import { createZodDto } from 'nestjs-zod';

export class CreateRedeemCodeDto extends createZodDto(CreateRedeemCodeBody) {}
export class RedeemCodeDto extends createZodDto(RedeemCodeBody) {}
