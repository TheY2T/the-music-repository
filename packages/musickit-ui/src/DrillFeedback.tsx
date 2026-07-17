import type { DrillPulse } from '@TheY2T/tmr-music-core/pixi/drill-feedback-scene';
import { PixiCanvas } from '@TheY2T/tmr-music-core/pixi/PixiCanvas';
import { useEffect, useState } from 'react';

/**
 * Drop-in gamified feedback for the ear-training / quiz tools. Pass the current answer result;
 * each transition to `'correct'`/`'wrong'` fires a fixed, pointer-events-none particle burst over
 * the viewport (celebration vs. muted scatter). Purely decorative — WebGL only, no-ops otherwise
 * and under reduced motion. See docs/features/pixi-visualization.md.
 *
 * Usage: `<DrillFeedback result={answered == null ? null : isCorrect ? 'correct' : 'wrong'} />`
 */
export default function DrillFeedback({ result }: { result: 'correct' | 'wrong' | null }) {
  const [pulse, setPulse] = useState<DrillPulse | null>(null);

  useEffect(() => {
    if (result) {
      setPulse((prev) => ({ n: (prev?.n ?? 0) + 1, kind: result }));
    }
  }, [result]);

  return (
    <PixiCanvas
      decorative
      loader={() => import('@TheY2T/tmr-music-core/pixi/drill-feedback-scene')}
      sceneProps={{ pulse }}
      className="pointer-events-none fixed inset-0 z-50"
      containerClassName="h-full w-full"
      fallback={<div aria-hidden />}
    />
  );
}
