import type { MessageKey } from '@TheY2T/tmr-i18n';

/**
 * Engine-only decks — those beyond the four legacy self-grade decks (which the hub still lists from
 * `drill-decks`). Each is gated by a per-modality flag and rendered by the drill engine's generators.
 * Kept as metadata (no generation logic) so the hub can list them without importing music-core.
 */
export interface EngineDeckMeta {
  key: string;
  titleKey: MessageKey;
  descKey: MessageKey;
  /** Number of cards in the deck (for the "new" badge before any are learned). */
  cardCount: number;
  /** The `Astro.locals.flags` key that gates this deck. */
  flag: 'drillPlay' | 'drillEar';
  helpSlug: string;
}

export const ENGINE_DECKS: EngineDeckMeta[] = [
  {
    key: 'build-interval',
    titleKey: 'drill.deck.buildInterval.title',
    descKey: 'drill.deck.buildInterval.desc',
    cardCount: 12,
    flag: 'drillPlay',
    helpSlug: 'ear-training',
  },
  {
    key: 'fretboard-note',
    titleKey: 'drill.deck.fretboardNote.title',
    descKey: 'drill.deck.fretboardNote.desc',
    cardCount: 7,
    flag: 'drillPlay',
    helpSlug: 'ear-training',
  },
  {
    key: 'progression-ear',
    titleKey: 'drill.deck.progressionEar.title',
    descKey: 'drill.deck.progressionEar.desc',
    cardCount: 5,
    flag: 'drillEar',
    helpSlug: 'ear-training',
  },
  {
    key: 'cadence-ear',
    titleKey: 'drill.deck.cadenceEar.title',
    descKey: 'drill.deck.cadenceEar.desc',
    cardCount: 4,
    flag: 'drillEar',
    helpSlug: 'ear-training',
  },
];
