import { PixiCanvas } from '@/components/PixiCanvas';

/**
 * Decorative ambient particle backdrop (e.g. behind the home hero). Purely visual — renders the
 * WebGL drift when available and nothing otherwise. Place inside a `relative` container and let the
 * foreground content sit above it. See docs/features/pixi-visualization.md.
 */
export default function AmbientBackground({ className }: { className?: string }) {
  return (
    <PixiCanvas
      ariaLabel="Ambient background animation"
      loader={() => import('@/lib/pixi/ambient-scene')}
      sceneProps={{}}
      className={className}
      containerClassName="h-full w-full"
      fallback={<div aria-hidden className="size-full" />}
    />
  );
}
