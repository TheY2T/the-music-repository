/** Progress read models (POJO, no framework/db imports). */

export interface CollectionProgressView {
  slug: string;
  title: string;
  totalItems: number;
  completedItems: number;
}

export interface ProgressSummaryView {
  completedCount: number;
  completedSlugs: string[];
  currentStreakDays: number;
  totalPracticeMinutes: number;
  collections: CollectionProgressView[];
}

/** UTC date key (`YYYY-MM-DD`) for a timestamp — the unit a streak counts in. */
export function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Consecutive days (ending today, or yesterday as a grace day) with at least one activity.
 * `activityDateKeys` is any set of `YYYY-MM-DD` strings; order/duplicates don't matter.
 */
export function currentStreakDays(activityDateKeys: string[], today: Date): number {
  const days = new Set(activityDateKeys);
  const cursor = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
  );

  // Allow the streak to still count if the user was active yesterday but not yet today.
  if (!days.has(toDateKey(cursor))) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
    if (!days.has(toDateKey(cursor))) {
      return 0;
    }
  }

  let streak = 0;
  while (days.has(toDateKey(cursor))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}
