/** Net Promoter Score domain types + pure scoring helpers. Framework-free, no db imports. */

export type NpsBucket = 'promoter' | 'passive' | 'detractor';

/** Classify a 0–10 score into its NPS bucket (promoter 9–10, passive 7–8, detractor 0–6). */
export function npsBucket(score: number): NpsBucket {
  if (score >= 9) return 'promoter';
  if (score >= 7) return 'passive';
  return 'detractor';
}

/** An NPS response as seen by an admin. */
export interface NpsResponseView {
  id: string;
  userId: string;
  userEmail: string | null;
  score: number;
  bucket: NpsBucket;
  comment: string | null;
  source: string | null;
  createdAt: string;
}

/** The minimal shape the analytics use-case needs per response. */
export interface NpsScorePoint {
  score: number;
  createdAt: string;
}

export interface NpsTrendPoint {
  /** ISO year-month, e.g. "2026-07". */
  period: string;
  score: number;
  responseCount: number;
}

export interface NpsAnalyticsView {
  score: number;
  promoters: number;
  passives: number;
  detractors: number;
  responseCount: number;
  trend: NpsTrendPoint[];
}

/** One user's NPS prompt throttle bookkeeping. */
export interface NpsPromptState {
  lastShownAt: Date | null;
  lastDismissedAt: Date | null;
  lastRespondedAt: Date | null;
}

/**
 * The NPS score for a set of responses: `%promoters − %detractors`, rounded to a whole number in
 * the range −100..100. Returns 0 for an empty set.
 */
export function computeNpsScore(points: readonly NpsScorePoint[]): number {
  if (points.length === 0) return 0;
  let promoters = 0;
  let detractors = 0;
  for (const p of points) {
    const bucket = npsBucket(p.score);
    if (bucket === 'promoter') promoters++;
    else if (bucket === 'detractor') detractors++;
  }
  return Math.round(((promoters - detractors) / points.length) * 100);
}

/** Aggregate responses into the dashboard view: totals, segment counts, and a per-month trend. */
export function computeNpsAnalytics(points: readonly NpsScorePoint[]): NpsAnalyticsView {
  let promoters = 0;
  let passives = 0;
  let detractors = 0;
  const byMonth = new Map<string, NpsScorePoint[]>();
  for (const p of points) {
    const bucket = npsBucket(p.score);
    if (bucket === 'promoter') promoters++;
    else if (bucket === 'passive') passives++;
    else detractors++;
    const period = p.createdAt.slice(0, 7); // "YYYY-MM"
    const bucketList = byMonth.get(period);
    if (bucketList) bucketList.push(p);
    else byMonth.set(period, [p]);
  }
  const trend: NpsTrendPoint[] = [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, monthPoints]) => ({
      period,
      score: computeNpsScore(monthPoints),
      responseCount: monthPoints.length,
    }));
  return {
    score: computeNpsScore(points),
    promoters,
    passives,
    detractors,
    responseCount: points.length,
    trend,
  };
}
