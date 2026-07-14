/**
 * LearnerProgress (DDD) — the read the collections core needs to flag per-item completion + compute
 * "next up". A thin capability port (not the whole progress feature) so collections stays decoupled
 * from `ProgressModule` (which already imports collections — importing it back would cycle).
 */
export abstract class LearnerProgress {
  /** Content slugs the user has completed. */
  abstract completedSlugs(userId: string): Promise<string[]>;
}
