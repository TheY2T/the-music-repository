import { type Locale, t } from '@TheY2T/tmr-i18n';
import { cn, Icon } from '@TheY2T/tmr-ui';
import { useEffect, useRef, useState } from 'react';
import { isPreviewReady, PREVIEW_MESSAGE, type PreviewPayload } from '@/lib/preview-protocol';

/**
 * Parent side of the live preview (ADR 0030): an iframe pointing at the authenticated draft route, fed
 * the live document over `postMessage` (debounced) once the frame signals it's ready. Full fidelity — the
 * frame renders the real page components + theme.
 */
export function PreviewPane({
  payload,
  slug,
  locale,
}: {
  payload: PreviewPayload;
  slug: string;
  locale: Locale;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const src = `/admin/preview/${encodeURIComponent(slug)}`;

  // Exit full-screen on Escape.
  useEffect(() => {
    if (!expanded) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setExpanded(false);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [expanded]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin === window.location.origin && isPreviewReady(event.data)) {
        setReady(true);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }
    if (timer.current) {
      clearTimeout(timer.current);
    }
    timer.current = setTimeout(() => {
      iframeRef.current?.contentWindow?.postMessage(
        { type: PREVIEW_MESSAGE, payload },
        window.location.origin,
      );
    }, 300);
    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    };
  }, [ready, payload]);

  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden border border-border bg-card',
        expanded ? 'fixed inset-0 z-50' : 'rounded-lg',
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-border p-2 text-sm font-medium text-muted-foreground">
        <span>{t(locale, 'blockEditor.preview')}</span>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-label={t(
            locale,
            expanded ? 'blockEditor.collapsePreview' : 'blockEditor.expandPreview',
          )}
          aria-pressed={expanded}
          className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Icon name={expanded ? 'minimize' : 'maximize'} className="size-4" />
        </button>
      </div>
      <iframe
        ref={iframeRef}
        src={src}
        title={t(locale, 'blockEditor.previewFrameTitle')}
        sandbox="allow-scripts allow-same-origin"
        className={cn('w-full bg-background', expanded ? 'min-h-0 flex-1' : 'h-[36rem]')}
      />
    </div>
  );
}
