import type { Locale } from '@TheY2T/tmr-i18n';
import type { DrillItem } from '@TheY2T/tmr-music-core/drills/drill-types';

/** Props shared by every answer-input widget. `answered` is the chosen value once submitted. */
export interface DrillInputProps {
  item: DrillItem<string>;
  answered: string | null;
  onAnswer: (value: string) => void;
  locale: Locale;
}
