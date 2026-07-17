import { logPractice } from '@TheY2T/tmr-web-data/progress-api';
import { useEffect } from 'react';

const MINUTE_MS = 60_000;

/**
 * Invisible island that logs **active** tool usage as practice minutes, feeding the Phase-2 progress
 * dashboard (streak + total practice time). Rendered only when signed in and the
 * `learning.tool-practice` flag is on (the page decides). Counts only time the tab is visible, and
 * flushes accumulated whole minutes every minute + on unmount, so navigating away still records
 * partial practice.
 */
export default function ToolPracticeLogger({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    if (!enabled) {
      return;
    }
    let activeMs = 0;
    let lastTick = Date.now();
    let flushed = 0;

    const accrue = () => {
      const now = Date.now();
      if (document.visibilityState === 'visible') {
        activeMs += now - lastTick;
      }
      lastTick = now;
    };

    const flush = () => {
      accrue();
      const wholeMinutes = Math.floor(activeMs / MINUTE_MS) - flushed;
      if (wholeMinutes >= 1) {
        flushed += wholeMinutes;
        void logPractice(wholeMinutes);
      }
    };

    // Re-baseline the tick clock across tab hide/show so hidden time isn't counted.
    const onVisibility = () => {
      lastTick = Date.now();
    };
    document.addEventListener('visibilitychange', onVisibility);
    const timer = window.setInterval(flush, MINUTE_MS);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
      flush();
    };
  }, [enabled]);

  return null;
}
