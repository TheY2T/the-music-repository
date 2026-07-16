import type { EmbedConfig } from '@TheY2T/tmr-content-serde';

/**
 * postMessage contract between the block-editor pane (parent) and the draft preview route (iframe).
 * Both sides verify `event.origin === window.location.origin` before trusting a message. See ADR 0030.
 */
export const PREVIEW_MESSAGE = 'tmr:preview';
export const PREVIEW_READY = 'tmr:preview-ready';

/** The live document the preview renders — mirrors what the public detail page shows below the header. */
export interface PreviewPayload {
  title: string;
  summary?: string;
  bodyMdx: string;
  embeds: EmbedConfig[];
}

export interface PreviewMessage {
  type: typeof PREVIEW_MESSAGE;
  payload: PreviewPayload;
}

export interface PreviewReadyMessage {
  type: typeof PREVIEW_READY;
}

/** Narrow a raw `MessageEvent.data` to a preview payload message. */
export function isPreviewMessage(data: unknown): data is PreviewMessage {
  return (
    typeof data === 'object' &&
    data !== null &&
    (data as { type?: unknown }).type === PREVIEW_MESSAGE &&
    typeof (data as { payload?: unknown }).payload === 'object'
  );
}

/** Narrow a raw `MessageEvent.data` to the iframe's ready handshake. */
export function isPreviewReady(data: unknown): data is PreviewReadyMessage {
  return (
    typeof data === 'object' && data !== null && (data as { type?: unknown }).type === PREVIEW_READY
  );
}
