import { CoverArt, type CoverArtProps, cn } from '@TheY2T/tmr-ui';
import { PixiCanvas } from '@/components/PixiCanvas';

/**
 * A {@link CoverArt} with a subtle animated sparkle layer over it. The SVG art is the SSR/first-paint
 * base (deterministic, accessible); the Pixi sparkle is a decorative client-only enhancement that
 * no-ops without WebGL.
 *
 * IMPORTANT: use this for ONE prominent cover at a time (e.g. the catalogue detail hero) — each
 * instance owns a WebGL context, and browsers cap live contexts (~16), so the catalogue grid must
 * keep using the plain `CoverArt`. See docs/features/pixi-visualization.md and ADR 0022.
 */
export default function AnimatedCoverArt({ className, ...props }: CoverArtProps) {
  return (
    <div className={cn('relative overflow-hidden rounded-lg', className)}>
      <CoverArt {...props} />
      <PixiCanvas
        decorative
        loader={() => import('@/lib/pixi/cover-sparkle-scene')}
        sceneProps={{ seed: props.seed }}
        className="pointer-events-none absolute inset-0"
        containerClassName="h-full w-full"
        fallback={<div aria-hidden />}
      />
    </div>
  );
}
