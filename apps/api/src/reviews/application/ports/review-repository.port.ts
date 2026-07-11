import type { ReviewState } from '../../domain/sm2';

export interface StoredCard extends ReviewState {
  card: string;
}

export interface DeckCount {
  deck: string;
  learned: number;
  due: number;
}

/** ReviewRepository — the trainer's requirement: persist per-user SM-2 state for deck cards. */
export abstract class ReviewRepository {
  /** Current state for a card, or null if never reviewed. */
  abstract get(userId: string, deck: string, card: string): Promise<ReviewState | null>;
  abstract save(userId: string, deck: string, card: string, state: ReviewState): Promise<void>;
  /** All stored states for a deck. */
  abstract listDeck(userId: string, deck: string): Promise<StoredCard[]>;
  /** Per-deck learned (stored) + due (dueAt ≤ now) counts. */
  abstract summary(userId: string, now: Date): Promise<DeckCount[]>;
}
