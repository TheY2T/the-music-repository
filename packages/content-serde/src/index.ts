/**
 * @TheY2T/tmr-content-serde — converts the block editor's ProseMirror/TipTap document to/from the
 * stored render fields (`body_mdx` with embed markers + the flat `embeds` array). Used by the web editor
 * (save/open) and the seed importer. See ADR 0030.
 */
export { type DocToMdxResult, docToMdx } from './doc-to-mdx';
export { mdxToDoc } from './mdx-to-doc';
export {
  EMBED_MARKER,
  EMBED_NODE,
  EMBED_TOOLS,
  type EmbedConfig,
  type EmbedTool,
  isEmbedTool,
  type PMDoc,
  type PMMark,
  type PMNode,
} from './types';
