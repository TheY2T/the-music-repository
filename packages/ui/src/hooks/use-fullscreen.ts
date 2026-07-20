import { type RefObject, useCallback, useEffect, useRef, useState } from 'react';

export interface UseFullscreenResult {
  /** Attach to the element that should fill the screen. */
  ref: RefObject<HTMLDivElement | null>;
  isFullscreen: boolean;
  /** Whether the browser exposes the Fullscreen API (false → hide the control). */
  supported: boolean;
  toggle: () => void;
  enter: () => void;
  exit: () => void;
}

/**
 * Drives the browser's native Fullscreen API for a single element. Tracks whether that element is the
 * current fullscreen element and whether the API is available at all (e.g. iOS Safari on iPhone exposes
 * no element-level fullscreen, so `supported` is false and callers hide the control).
 */
export function useFullscreen(): UseFullscreenResult {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    setSupported(Boolean(document.fullscreenEnabled));
    const onChange = () => setIsFullscreen(document.fullscreenElement === ref.current);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const enter = useCallback(() => {
    const el = ref.current;
    if (el && !document.fullscreenElement) void el.requestFullscreen?.();
  }, []);

  const exit = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen?.();
  }, []);

  const toggle = useCallback(() => {
    if (document.fullscreenElement === ref.current) exit();
    else enter();
  }, [enter, exit]);

  return { ref, isFullscreen, supported, toggle, enter, exit };
}
