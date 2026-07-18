import { usePrefersReducedMotion } from '@TheY2T/tmr-music-core/pixi/use-webgl';
import { useEffect, useState } from 'react';

/**
 * Tier-1 micro-reward: a small "+N" that pops up and fades on each correct answer. Transform/opacity
 * only (60fps), semantic tokens so it re-themes, and a static-then-clear fallback under reduced motion.
 * Driven by a `trigger` nonce so the same points value re-fires.
 */
export default function ScorePop({
  points,
  trigger,
  label,
}: {
  points: number | null;
  trigger: number;
  /** Localized "+{points}" template, e.g. `t(locale, 'drill.scorePop', { points })`. */
  label: (points: number) => string;
}) {
  const reduced = usePrefersReducedMotion();
  const [shown, setShown] = useState<{ points: number; id: number } | null>(null);

  useEffect(() => {
    if (points == null || trigger === 0) {
      return;
    }
    setShown({ points, id: trigger });
    const timeout = window.setTimeout(() => setShown(null), reduced ? 700 : 900);
    return () => window.clearTimeout(timeout);
    // Only re-run when a new answer is graded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  if (!shown) {
    return null;
  }

  return (
    <div
      key={shown.id}
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-2 -translate-x-1/2 select-none font-display text-2xl font-semibold text-success"
      style={
        reduced
          ? undefined
          : { animation: 'tmr-score-pop 0.9s cubic-bezier(0.2, 0.8, 0.2, 1) forwards' }
      }
    >
      {label(shown.points)}
      <style>{`@keyframes tmr-score-pop {
        0% { transform: translate(-50%, 8px) scale(0.8); opacity: 0; }
        25% { transform: translate(-50%, 0) scale(1.1); opacity: 1; }
        100% { transform: translate(-50%, -22px) scale(1); opacity: 0; }
      }`}</style>
    </div>
  );
}
