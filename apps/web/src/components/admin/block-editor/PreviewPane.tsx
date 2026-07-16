import { type Locale, t } from '@TheY2T/tmr-i18n';
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
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const src = `/admin/preview/${encodeURIComponent(slug)}`;

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
    <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-card">
      <div className="border-b border-border p-2 text-sm font-medium text-muted-foreground">
        {t(locale, 'blockEditor.preview')}
      </div>
      <iframe
        ref={iframeRef}
        src={src}
        title={t(locale, 'blockEditor.previewFrameTitle')}
        sandbox="allow-scripts allow-same-origin"
        className="h-[36rem] w-full bg-background"
      />
    </div>
  );
}
