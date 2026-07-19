import { type Locale, t } from '@TheY2T/tmr-i18n';
import {
  type HelpPreviewPayload,
  isPreviewMessage,
  PREVIEW_READY,
} from '@TheY2T/tmr-web-acl/preview-protocol';
import { marked } from 'marked';
import { useEffect, useState } from 'react';

/**
 * Iframe-side of the help-topic live preview (Phase C): renders the term + body exactly as the Info
 * View panel shows them (bold term over prose body), from a `postMessage` payload.
 */
export default function HelpPreview({ locale }: { locale: Locale }) {
  const [payload, setPayload] = useState<HelpPreviewPayload | null>(null);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || !isPreviewMessage(event.data)) {
        return;
      }
      setPayload(event.data.payload as HelpPreviewPayload);
    };
    window.addEventListener('message', onMessage);
    window.parent?.postMessage({ type: PREVIEW_READY }, window.location.origin);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  if (!payload) {
    return (
      <p className="p-8 text-center text-sm text-muted-foreground">
        {t(locale, 'blockEditor.previewWaiting')}
      </p>
    );
  }

  const bodyHtml = marked.parse(payload.body || '', { async: false });

  return (
    <div className="mx-auto max-w-3xl p-6">
      {/* Mirrors the Info View panel: bold term over a prose body. */}
      <div className="rounded-lg border border-border bg-background p-4">
        <div className="text-sm font-semibold text-foreground">
          {payload.term || t(locale, 'blockEditor.previewUntitled')}
        </div>
        <div
          className="prose prose-sm mt-1 max-w-none prose-headings:font-display dark:prose-invert"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: admin-authored markdown preview.
          dangerouslySetInnerHTML={{ __html: bodyHtml }}
        />
      </div>
    </div>
  );
}
