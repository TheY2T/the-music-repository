import { cn } from '@TheY2T/tmr-ui';
import {
  type ComponentType,
  lazy,
  type ReactNode,
  Suspense,
  useEffect,
  useRef,
  useState,
} from 'react';
import { supportsWebGL, usePrefersReducedMotion } from './use-webgl';

/**
 * Client-only boundary that hosts a lazily-loaded PixiJS scene, with graceful degradation.
 *
 * PixiJS is a heavy, WebGL-only, browser-only dependency, so every Pixi surface goes through this
 * wrapper. Mount it with `client:only="react"` — it must never run during SSR. It:
 *   - lazy-`import()`s the scene module so Pixi's bundle + `extend()` calls stay out of the initial
 *     payload and only load when a canvas actually renders;
 *   - probes for WebGL and renders the accessible DOM `fallback` instead of a broken canvas when
 *     unavailable;
 *   - keeps the same `fallback` controls in the DOM (visually hidden) even when the canvas is up, so
 *     keyboard/AT users always have a real, operable control surface (the canvas is `role="img"`);
 *   - passes the container ref (for `resizeTo`) and the reduced-motion preference down to the scene.
 *
 * See docs/features/pixi-visualization.md and ADR 0022.
 */

/** Props every Pixi scene receives from {@link PixiCanvas}. */
export interface PixiSceneBaseProps {
  /** Ref to the sizing container — pass to `<Application resizeTo={resizeTo}>`. */
  resizeTo: React.RefObject<HTMLDivElement | null>;
  /** When true, scenes should skip `useTick` animation work and render a static frame. */
  reducedMotion: boolean;
  /** devicePixelRatio (capped) — pass to `<Application resolution={resolution} autoDensity>`. */
  resolution: number;
}

export interface PixiCanvasProps<P extends object> {
  /** Accessible name for the canvas region (`role="img"` aria-label). Ignored when `decorative`. */
  ariaLabel?: string;
  /**
   * Stable loader for the scene module (e.g. `() => import('./piano-scene')`). Keep it a
   * module-level or inline arrow — it is captured once on first render.
   */
  loader: () => Promise<{ default: ComponentType<P & PixiSceneBaseProps> }>;
  /** Extra props forwarded to the scene. */
  sceneProps: P;
  /**
   * Accessible DOM control set — the real interaction surface. Shown when WebGL is unavailable;
   * kept visually hidden (but operable) when the canvas renders.
   */
  fallback: ReactNode;
  /**
   * Purely decorative canvas (ambient, feedback bursts, sparkle): the region is `aria-hidden`
   * instead of a labelled `role="img"`, and no sr-only fallback is exposed to assistive tech.
   */
  decorative?: boolean;
  /** Class for the outer wrapper. */
  className?: string;
  /** Class for the canvas container (size it here, e.g. `h-48 w-full`). */
  containerClassName?: string;
}

/** Recommended crispness cap — retina sharpness without paying for 3×+ backing stores. */
function pixelRatio(): number {
  return typeof window === 'undefined' ? 1 : Math.min(window.devicePixelRatio || 1, 2);
}

export function PixiCanvas<P extends object>({
  ariaLabel,
  loader,
  sceneProps,
  fallback,
  decorative,
  className,
  containerClassName,
}: PixiCanvasProps<P>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const [Scene] = useState(() => lazy(loader));
  // Render the accessible fallback during SSR and the first client render (so hydration matches),
  // then upgrade to the WebGL canvas after mount. `webgl` is only meaningful post-mount.
  const [mounted, setMounted] = useState(false);
  const [webgl, setWebgl] = useState(false);
  useEffect(() => {
    setWebgl(supportsWebGL());
    setMounted(true);
  }, []);

  if (!mounted || !webgl) {
    return <div className={className}>{fallback}</div>;
  }

  return (
    <div className={className}>
      <div
        ref={containerRef}
        {...(decorative ? { 'aria-hidden': true } : { role: 'img', 'aria-label': ariaLabel })}
        className={cn('relative overflow-hidden', containerClassName)}
      >
        <Suspense
          fallback={
            // A decorative overlay (feedback burst, ambient/sparkle) must stay invisible while its
            // scene lazy-loads — a muted skeleton would flash over whatever it covers (e.g. the
            // full-viewport DrillFeedback). Inline canvases keep the loading skeleton.
            decorative ? null : (
              <div className="size-full animate-pulse rounded-lg bg-muted" aria-hidden />
            )
          }
        >
          <Scene
            resizeTo={containerRef}
            reducedMotion={reducedMotion}
            resolution={pixelRatio()}
            {...sceneProps}
          />
        </Suspense>
      </div>
      {/* Real, operable controls for keyboard / assistive tech while the canvas is the visual.
          Omitted for decorative canvases (nothing to expose). */}
      {decorative ? null : <div className="sr-only">{fallback}</div>}
    </div>
  );
}
