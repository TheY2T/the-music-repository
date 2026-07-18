import { Injectable } from '@nestjs/common';
import { currentStreakDays } from '../../reviews/domain/streak';
import { type SkillMastery, summarizeDeck } from '../domain/mastery';
import { AttemptLog, type StoredAttempt } from './ports/attempt-log';

export interface DrillStatsSummary {
  skills: SkillMastery[];
  streakDays: number;
  attemptsToday: number;
}

function groupByDeck(attempts: StoredAttempt[]): Map<string, StoredAttempt[]> {
  const byDeck = new Map<string, StoredAttempt[]>();
  for (const a of attempts) {
    const list = byDeck.get(a.deck) ?? [];
    list.push(a);
    byDeck.set(a.deck, list);
  }
  return byDeck;
}

@Injectable()
export class GetDrillStatsUseCase {
  constructor(private readonly attempts: AttemptLog) {}

  async execute(userId: string): Promise<DrillStatsSummary> {
    const now = new Date();
    const [all, dateKeys, attemptsToday] = await Promise.all([
      this.attempts.listAll(userId),
      this.attempts.activityDateKeys(userId),
      this.attempts.attemptsToday(userId, now),
    ]);
    const skills = [...groupByDeck(all).entries()].map(([deck, outcomes]) =>
      summarizeDeck(deck, outcomes),
    );
    return { skills, streakDays: currentStreakDays(dateKeys, now), attemptsToday };
  }
}

@Injectable()
export class GetDeckMasteryUseCase {
  constructor(private readonly attempts: AttemptLog) {}

  async execute(userId: string, deck: string): Promise<SkillMastery> {
    const outcomes = await this.attempts.listDeck(userId, deck);
    return summarizeDeck(deck, outcomes);
  }
}
