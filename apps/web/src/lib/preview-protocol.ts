import type { EmbedConfig } from '@TheY2T/tmr-content-serde';

/**
 * postMessage contract between the block-editor pane (parent) and the draft preview route (iframe).
 * Both sides verify `event.origin === window.location.origin` before trusting a message. See ADR 0030.
 */
export const PREVIEW_MESSAGE = 'tmr:preview';
export const PREVIEW_READY = 'tmr:preview-ready';

/** The live document the content preview renders — mirrors the public detail page below the header. */
export interface PreviewPayload {
  title: string;
  summary?: string;
  bodyMdx: string;
  embeds: EmbedConfig[];
}

/** A collection item resolved for preview (title/type come from the catalogue). */
export interface CollectionPreviewItem {
  slug: string;
  title: string;
  type: string;
  curatorNote?: string;
  focusSkills?: string[];
}

export interface CollectionPreviewSection {
  title: string;
  description?: string;
  items: CollectionPreviewItem[];
}

/** The live collection the collection preview renders (mirrors CollectionDetail). */
export interface CollectionPreviewPayload {
  title: string;
  summary?: string;
  bodyMdx: string;
  kind: string;
  featured: boolean;
  curatorName?: string;
  difficultyMin?: number;
  difficultyMax?: number;
  estMinutes?: number;
  outcomes: string[];
  ungrouped: CollectionPreviewItem[];
  sections: CollectionPreviewSection[];
}

/** The live help topic the help preview renders (as shown in the Info View panel). */
export interface HelpPreviewPayload {
  term: string;
  body: string;
}

/** Any preview payload — the pane forwards it opaquely; each renderer narrows its own shape. */
export type AnyPreviewPayload = PreviewPayload | CollectionPreviewPayload | HelpPreviewPayload;

export interface PreviewMessage {
  type: typeof PREVIEW_MESSAGE;
  payload: AnyPreviewPayload;
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
