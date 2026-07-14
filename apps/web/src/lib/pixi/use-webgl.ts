/**
 * Client-only capability probes for the Pixi layer: WebGL availability and the user's
 * reduced-motion preference. Both are read on the client (Pixi islands are `client:only`), with
 * SSR-safe guards so they can also be imported in unit tests. See docs/features/pixi-visualization.md.
 */
import { useEffect, useState } from 'react';

/** True if the browser can give us a WebGL(2) context — the gate for rendering a Pixi canvas. */
export function supportsWebGL(): boolean {
  if (typeof document === 'undefined') {
    return false;
  }
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      canvas.getContext('webgl2') ||
        canvas.getContext('webgl') ||
        canvas.getContext('experimental-webgl'),
    );
  } catch {
    return false;
  }
}

/** True if the user asked for reduced motion (`prefers-reduced-motion: reduce`). */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/** Reactive `prefers-reduced-motion`, updating if the user flips the OS setting mid-session. */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(prefersReducedMotion);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(query.matches);
    onChange();
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  return reduced;
}
