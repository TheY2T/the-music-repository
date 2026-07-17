import { type Locale, t } from '@TheY2T/tmr-i18n';
import { cn, Icon } from '@TheY2T/tmr-ui';
import { useEffect, useRef, useState } from 'react';
import { type AnyPreviewPayload, isPreviewReady, PREVIEW_MESSAGE } from '@/lib/preview-protocol';

/**
 * Parent side of the live preview (ADR 0030): an iframe pointing at the authenticated draft route, fed
 * the live document over `postMessage` (debounced) once the frame signals it's ready. Full fidelity — the
 * frame renders the real page components + theme. Generic over the payload/route so content, collections
 * and help topics all reuse it (each `route` has its own iframe renderer).
 */
export function PreviewPane({
  payload,
  slug,
  locale,
  route = '/admin/preview',
}: {
  payload: AnyPreviewPayload;
  slug: string;
  locale: Locale;
  /** Base path of the draft preview route; `{route}/{slug}` is the iframe src. */
  route?: string;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const src = `${route}/${encodeURIComponent(slug)}`;

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
        // Fill the grid cell (which stretches to the editor's height) so the preview matches it
        // instead of cutting off at a fixed height.
        expanded ? 'fixed inset-0 z-50' : 'h-full rounded-lg',
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
        className={cn('w-full flex-1 bg-background', expanded ? 'min-h-0' : 'min-h-[36rem]')}
      />
    </div>
  );
}
