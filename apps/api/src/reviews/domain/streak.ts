/** UTC date key (`YYYY-MM-DD`) for a timestamp. */
export function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Consecutive days (ending today, or yesterday as a grace day) with at least one review.
 * `activityDateKeys` is any set of `YYYY-MM-DD` strings.
 */
export function currentStreakDays(activityDateKeys: string[], today: Date): number {
  const days = new Set(activityDateKeys);
  const cursor = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
  );
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
