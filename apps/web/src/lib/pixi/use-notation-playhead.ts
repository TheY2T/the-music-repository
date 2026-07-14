/**
 * Notation play-head overlay (ADR 0022, Phase 3). A transparent PixiJS canvas laid over the Verovio
 * SVG that draws a soft glow around the sounding notes plus a sweeping play-head bar — driven
 * imperatively by the caller's existing rAF loop (`paint(activeNoteIds)`), synced to the real note
 * positions via `getBoundingClientRect`. Additive: the SVG note highlight keeps working, and this
 * layer is a decorative enhancement that no-ops when WebGL is unavailable.
 *
 * Uses a raw Pixi `Application` (not `@pixi/react`) because the overlay is externally driven and
 * mounted as a sibling canvas — simpler than the declarative reconciler here. Client-only; Pixi is
 * dynamically imported so it stays out of the SSR path + initial bundle. See
 * docs/features/pixi-visualization.md.
 */
import { type RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { readThemeColors, type ThemeColors } from './use-theme-colors';
import { supportsWebGL } from './use-webgl';

// Minimal shapes of the Pixi bits we use (kept loose — Pixi is dynamically imported).
interface GraphicsLike {
  clear(): GraphicsLike;
  rect(x: number, y: number, w: number, h: number): GraphicsLike;
  roundRect(x: number, y: number, w: number, h: number, r: number): GraphicsLike;
  fill(style: { color: number; alpha?: number }): GraphicsLike;
}
interface AppLike {
  init(options: Record<string, unknown>): Promise<void>;
  canvas: HTMLCanvasElement;
  stage: { addChild(child: unknown): void };
  destroy(rendererDestroy?: boolean, options?: Record<string, unknown>): void;
}

/**
 * Returns `{ overlayRef, paint }`. Attach `overlayRef` (a callback ref) to an empty element
 * positioned over the notation; call `paint(ids)` each animation frame with the currently-sounding
 * note element ids (the same ids the SVG highlight uses). `containerRef` is the scroll container
 * holding the Verovio SVG (used for hit-testing). The callback ref sets up the Pixi canvas when the
 * overlay element mounts (i.e. once the SVG has rendered) and tears it down when it unmounts.
 */
export function useNotationPlayhead(containerRef: RefObject<HTMLDivElement | null>) {
  const appRef = useRef<AppLike | null>(null);
  const layerRef = useRef<GraphicsLike | null>(null);
  const colorsRef = useRef<ThemeColors>(readThemeColors());
  const [overlayEl, setOverlayEl] = useState<HTMLDivElement | null>(null);
  const overlayRef = useCallback((el: HTMLDivElement | null) => setOverlayEl(el), []);

  useEffect(() => {
    if (!supportsWebGL() || !overlayEl) {
      return;
    }
    const overlay = overlayEl;
    let cancelled = false;
    let app: AppLike | null = null;

    (async () => {
      const pixi = (await import('pixi.js')) as unknown as {
        Application: new () => AppLike;
        Graphics: new () => GraphicsLike;
      };
      if (cancelled) {
        return;
      }
      app = new pixi.Application();
      await app.init({
        backgroundAlpha: 0,
        resizeTo: overlay,
        autoDensity: true,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
        antialias: true,
      });
      if (cancelled) {
        app.destroy(true, { children: true });
        return;
      }
      const canvas = app.canvas;
      canvas.style.position = 'absolute';
      canvas.style.inset = '0';
      canvas.style.pointerEvents = 'none';
      overlay.appendChild(canvas);
      const layer = new pixi.Graphics();
      app.stage.addChild(layer);
      appRef.current = app;
      layerRef.current = layer;
    })();

    // Keep colours current without reading getComputedStyle every frame.
    colorsRef.current = readThemeColors();
    const observer = new MutationObserver(() => {
      colorsRef.current = readThemeColors();
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'class'],
    });

    return () => {
      cancelled = true;
      observer.disconnect();
      appRef.current = null;
      layerRef.current = null;
      app?.destroy(true, { children: true });
    };
  }, [overlayEl]);

  const paint = useCallback(
    (ids: string[]) => {
      const container = containerRef.current;
      const layer = layerRef.current;
      if (!container || !layer) {
        return;
      }
      const colors = colorsRef.current;
      const base = container.getBoundingClientRect();
      layer.clear();
      let sumX = 0;
      let count = 0;
      let top = Number.POSITIVE_INFINITY;
      let bottom = Number.NEGATIVE_INFINITY;
      for (const id of ids) {
        const el = container.querySelector(`#${CSS.escape(id)}`) as SVGGraphicsElement | null;
        if (!el) {
          continue;
        }
        const r = el.getBoundingClientRect();
        const x = r.left - base.left;
        const y = r.top - base.top;
        const pad = 4;
        // Soft glow halo around the note head.
        layer
          .roundRect(x - pad, y - pad, r.width + pad * 2, r.height + pad * 2, 4)
          .fill({ color: colors.accent, alpha: 0.35 });
        sumX += x + r.width / 2;
        count += 1;
        top = Math.min(top, y);
        bottom = Math.max(bottom, y + r.height);
      }
      // Sweeping play-head bar at the mean x of the sounding notes.
      if (count > 0) {
        const cx = sumX / count;
        const barTop = Math.max(0, top - 16);
        const barBottom = Math.min(base.height, bottom + 16);
        layer
          .rect(cx - 1, barTop, 2, barBottom - barTop)
          .fill({ color: colors.primary, alpha: 0.7 });
      }
    },
    [containerRef],
  );

  return { overlayRef, paint };
}
