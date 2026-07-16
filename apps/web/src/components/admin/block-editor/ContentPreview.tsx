import { type Locale, t } from '@TheY2T/tmr-i18n';
import { marked } from 'marked';
import { useEffect, useState } from 'react';
import ContentBody from '@/components/content/ContentBody';
import type { Embed } from '@/components/content/ContentEmbeds';
import { isPreviewMessage, PREVIEW_READY, type PreviewPayload } from '@/lib/preview-protocol';

/**
 * Iframe-side of the live preview (ADR 0030). Renders the **real** article body — `marked` → `ContentBody`
 * (the same interleaved prose + interactive `EmbedCard`s the public page uses) — from a `postMessage`
 * payload rather than the API, so the author sees exactly the shipped result including the active theme.
 */
export default function ContentPreview({
  locale,
  interactive,
}: {
  locale: Locale;
  interactive: boolean;
}) {
  const [payload, setPayload] = useState<PreviewPayload | null>(null);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || !isPreviewMessage(event.data)) {
        return;
      }
      setPayload(event.data.payload);
    };
    window.addEventListener('message', onMessage);
    // Tell the parent we're ready to receive the current document.
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

  const bodyHtml = marked.parse(payload.bodyMdx || '', { async: false });

  return (
    <article className="mx-auto max-w-3xl px-6 py-8">
      <header className="mb-6 space-y-2">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
          {payload.title || t(locale, 'blockEditor.previewUntitled')}
        </h1>
        {payload.summary ? (
          <p className="text-lg text-muted-foreground">{payload.summary}</p>
        ) : null}
      </header>
      <ContentBody
        bodyHtml={bodyHtml}
        embeds={payload.embeds as unknown as Embed[]}
        locale={locale}
        interactive={interactive}
      />
    </article>
  );
}
