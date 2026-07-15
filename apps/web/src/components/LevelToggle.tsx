import { SegmentedToggle } from '@TheY2T/tmr-ui';
import type { Level } from '@/lib/music-theory';

// Short pill labels + full titles for the four difficulty tiers.
const LEVEL_OPTIONS: { value: Level; label: string; title: string }[] = [
  { value: 'beginner', label: 'Beginner', title: 'Beginner — core scales & chords' },
  { value: 'intermediate', label: 'Intermediate', title: 'Intermediate — modes, 7ths & 6ths' },
  { value: 'advanced', label: 'Advanced', title: 'Advanced — extended & altered harmony' },
  { value: 'expert', label: 'Expert', title: 'Expert — everything' },
];

/**
 * The shared difficulty-tier selector. Presentational — pair with `useLevel` for persistence. Filters
 * a tool's scale/chord options so a beginner sees a focused set and advanced players unlock the full
 * vocabulary; the same tool, progressively disclosed.
 */
export default function LevelToggle({
  level,
  onChange,
}: {
  level: Level;
  onChange: (level: Level) => void;
}) {
  return (
    <div className="space-y-1 text-sm">
      <span className="block font-medium" data-help="level">
        Level
      </span>
      <SegmentedToggle
        options={LEVEL_OPTIONS}
        value={level}
        onValueChange={onChange}
        aria-label="Difficulty level"
      />
    </div>
  );
}
