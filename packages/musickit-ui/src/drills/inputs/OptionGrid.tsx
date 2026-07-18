import type { DrillOption } from '@TheY2T/tmr-music-core/drills/drill-types';
import { Button, cn } from '@TheY2T/tmr-ui';

/**
 * The shared answer surface for multiple-choice + ear-identify drills. Before answering, every option
 * is live; after, the grid locks and marks the correct option (success) and, if wrong, the chosen one
 * (destructive) — objective feedback the old self-grade session never had.
 */
export default function OptionGrid({
  options,
  expected,
  answered,
  onAnswer,
}: {
  options: DrillOption[];
  expected: string;
  answered: string | null;
  onAnswer: (value: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {options.map((opt) => {
        const isCorrect = opt.value === expected;
        const isChosen = answered === opt.value;
        const revealCorrect = answered != null && isCorrect;
        const revealWrong = answered != null && isChosen && !isCorrect;
        return (
          <Button
            key={opt.value}
            variant="outline"
            disabled={answered != null}
            onClick={() => onAnswer(opt.value)}
            className={cn(
              'h-auto py-3',
              revealCorrect && 'border-success text-success disabled:opacity-100',
              revealWrong && 'border-destructive text-destructive disabled:opacity-100',
            )}
          >
            {opt.label}
          </Button>
        );
      })}
    </div>
  );
}
