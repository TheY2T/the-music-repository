import { z } from 'zod';
import type { KofiDonation } from '../domain/kofi-donation';

/**
 * Ko-fi's webhook payload (the JSON string carried in the form-encoded `data` field). Only the fields
 * we read are typed; `passthrough()` keeps everything else so `raw` stays complete. Booleans/strings
 * are lenient because Ko-fi omits fields per event type.
 */
export const kofiPayloadSchema = z
  .object({
    verification_token: z.string(),
    message_id: z.string(),
    timestamp: z.string(),
    type: z.string(),
    is_public: z.boolean().optional().default(true),
    from_name: z.string().nullish(),
    message: z.string().nullish(),
    amount: z.string().nullish(),
    email: z.string().nullish(),
    currency: z.string().nullish(),
    is_subscription_payment: z.boolean().optional().default(false),
    is_first_subscription_payment: z.boolean().optional().default(false),
    kofi_transaction_id: z.string().nullish(),
    tier_name: z.string().nullish(),
  })
  .passthrough();

export type KofiPayload = z.infer<typeof kofiPayloadSchema>;

/** Parse the JSON string Ko-fi sends in `data`. Throws a `ZodError` on a malformed/foreign payload. */
export function parseKofiPayload(data: string): KofiPayload {
  return kofiPayloadSchema.parse(JSON.parse(data));
}

/** Normalize a verified Ko-fi payload into the record we persist. */
export function toKofiDonation(payload: KofiPayload): KofiDonation {
  return {
    messageId: payload.message_id,
    kofiTransactionId: payload.kofi_transaction_id ?? null,
    type: payload.type,
    fromName: payload.from_name ?? null,
    email: payload.email ?? null,
    amount: payload.amount ?? null,
    currency: payload.currency ?? null,
    message: payload.message ?? null,
    isPublic: payload.is_public,
    isSubscriptionPayment: payload.is_subscription_payment,
    tierName: payload.tier_name ?? null,
    timestamp: payload.timestamp,
    raw: payload,
  };
}
