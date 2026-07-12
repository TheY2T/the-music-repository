export interface RedeemCodeRecord {
  code: string;
  key: string;
  source: string;
  durationDays: number | null;
  usesRemaining: number;
}

/** RedeemCodeStore (ADR 0012) — persist and atomically consume one-time/multi-use gift codes. */
export abstract class RedeemCodeStore {
  abstract create(rec: {
    code: string;
    key: string;
    source: string;
    durationDays: number | null;
    usesRemaining: number;
    createdBy: string;
  }): Promise<void>;
  /** Atomically decrement a code's remaining uses if any remain; returns the record when consumed,
   * or null when the code is missing/exhausted. */
  abstract consume(code: string): Promise<RedeemCodeRecord | null>;
}
