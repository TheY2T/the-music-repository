/**
 * Content serialization types — the bridge between the block editor's ProseMirror/TipTap document and
 * the stored render fields (`body_mdx` + `details.embeds`). See ADR 0030.
 */

/**
 * Canonical list of embeddable interactive tools. **Single runtime source of truth** — the seed
 * build-validator imports this instead of keeping its own copy. The authoritative *schema* (per-tool
 * config fields) lives in the TypeSpec `ContentEmbed` model (`packages/api-spec/main.tsp`); serde only
 * needs the `tool` discriminator because it carries the rest of the config through opaquely.
 */
export const EMBED_TOOLS = [
  'score',
  'keyboard',
  'scale-boxes',
  'chord-diagrams',
  'progression',
  'circle-of-fifths',
  'strum',
  'rhythm',
  'chord-board',
  'intervals',
  'fingering',
] as const;

export type EmbedTool = (typeof EMBED_TOOLS)[number];

const EMBED_TOOL_SET: ReadonlySet<string> = new Set(EMBED_TOOLS);

/** True when `tool` is one of the known embed tools. */
export function isEmbedTool(tool: unknown): tool is EmbedTool {
  return typeof tool === 'string' && EMBED_TOOL_SET.has(tool);
}

/**
 * A preconfigured embed's config — an opaque carrier: serde never interprets fields beyond `tool`, so
 * this mirrors the TypeSpec `ContentEmbed` shape structurally without duplicating its field list.
 */
export interface EmbedConfig {
  tool: EmbedTool;
  [key: string]: unknown;
}

// --- ProseMirror / TipTap document model (node names align with StarterKit + Table + our tmrEmbed) ---

export interface PMMark {
  type: 'bold' | 'italic' | 'strike' | 'code' | 'link';
  attrs?: Record<string, unknown>;
}

export interface PMNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: PMNode[];
  marks?: PMMark[];
  text?: string;
}

export interface PMDoc {
  type: 'doc';
  content: PMNode[];
}

/** The embed node's type name in the document. */
export const EMBED_NODE = 'tmrEmbed';

/** Regex matching one stored embed marker `<div data-tmr-embed="N"></div>`. Global for scanning. */
export const EMBED_MARKER = /<div data-tmr-embed="(\d+)"><\/div>/g;
