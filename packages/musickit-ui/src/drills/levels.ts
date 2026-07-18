import type { MessageKey } from '@TheY2T/tmr-i18n';

/** Mastery-level → its localized name key. Shared by the hub, session summary, and fanfare. */
export const LEVEL_MESSAGE_KEY: Record<string, MessageKey> = {
  beginner: 'drill.level.beginner',
  intermediate: 'drill.level.intermediate',
  advanced: 'drill.level.advanced',
  expert: 'drill.level.expert',
};

/** Milestone streak lengths that earn a celebration. */
export const STREAK_MILESTONES = [7, 30, 100, 365];
