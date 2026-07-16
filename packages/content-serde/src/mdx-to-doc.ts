import { marked, type Token, type Tokens } from 'marked';
import {
  EMBED_MARKER,
  EMBED_NODE,
  type EmbedConfig,
  type PMDoc,
  type PMMark,
  type PMNode,
} from './types';

/**
 * Parse stored `body_mdx` (markdown carrying `<div data-tmr-embed="N"></div>` markers) plus the flat
 * `embeds` array into a ProseMirror/TipTap document. Each marker becomes a `tmrEmbed` node hydrated
 * from `embeds[N]`, positioned exactly where it sat in the prose. Best-effort by design: it reconstructs
 * the editor state for legacy/file-authored content the first time it is opened; from then on the editor
 * owns the canonical `body_doc`. See ADR 0030.
 */
export function mdxToDoc(bodyMdx: string, embeds: readonly EmbedConfig[] = []): PMDoc {
  const tokens = marked.lexer(bodyMdx ?? '');
  const content = blocksFromTokens(tokens, embeds);
  return { type: 'doc', content };
}

function blocksFromTokens(tokens: Token[], embeds: readonly EmbedConfig[]): PMNode[] {
  const nodes: PMNode[] = [];
  for (const token of tokens) {
    pushBlock(nodes, token, embeds);
  }
  return nodes;
}

function pushBlock(out: PMNode[], token: Token, embeds: readonly EmbedConfig[]): void {
  switch (token.type) {
    case 'space':
      return;
    case 'heading': {
      const t = token as Tokens.Heading;
      out.push({ type: 'heading', attrs: { level: t.depth }, content: inline(t.tokens) });
      return;
    }
    case 'paragraph': {
      const t = token as Tokens.Paragraph;
      out.push({ type: 'paragraph', content: inline(t.tokens) });
      return;
    }
    case 'text': {
      // A bare top-level text token (e.g. inside a tight list item) → wrap as a paragraph.
      const t = token as Tokens.Text;
      out.push({
        type: 'paragraph',
        content: inline(t.tokens ?? ([{ type: 'text', raw: t.raw, text: t.text }] as Token[])),
      });
      return;
    }
    case 'list': {
      const t = token as Tokens.List;
      const attrs: Record<string, unknown> = { loose: Boolean(t.loose) };
      if (t.ordered && t.start !== 1) {
        attrs.start = Number(t.start) || 1;
      }
      out.push({
        type: t.ordered ? 'orderedList' : 'bulletList',
        attrs,
        content: t.items.map((item) => ({
          type: 'listItem',
          content: listItemBlocks(item, embeds),
        })),
      });
      return;
    }
    case 'blockquote': {
      const t = token as Tokens.Blockquote;
      out.push({ type: 'blockquote', content: blocksFromTokens(t.tokens, embeds) });
      return;
    }
    case 'code': {
      const t = token as Tokens.Code;
      out.push({
        type: 'codeBlock',
        attrs: { language: t.lang?.trim() || null },
        content: t.text ? [{ type: 'text', text: t.text }] : [],
      });
      return;
    }
    case 'hr':
      out.push({ type: 'horizontalRule' });
      return;
    case 'table':
      out.push(tableNode(token as Tokens.Table));
      return;
    case 'html':
      pushHtml(out, (token as Tokens.HTML).raw ?? (token as Tokens.HTML).text, embeds);
      return;
    default:
      // Unknown block: preserve its source verbatim so it survives the round-trip.
      if ('raw' in token && typeof token.raw === 'string' && token.raw.trim()) {
        out.push({ type: 'htmlBlock', attrs: { html: token.raw.trim() } });
      }
  }
}

/** A list item's children: unwrap bare `text` tokens into paragraphs; recurse for nested blocks. */
function listItemBlocks(item: Tokens.ListItem, embeds: readonly EmbedConfig[]): PMNode[] {
  const blocks: PMNode[] = [];
  for (const child of item.tokens) {
    if (child.type === 'text') {
      const t = child as Tokens.Text;
      blocks.push({
        type: 'paragraph',
        content: inline(t.tokens ?? ([{ type: 'text', raw: t.raw, text: t.text }] as Token[])),
      });
    } else {
      pushBlock(blocks, child, embeds);
    }
  }
  if (blocks.length === 0) {
    blocks.push({ type: 'paragraph' });
  }
  return blocks;
}

function tableNode(t: Tokens.Table): PMNode {
  const align = t.align ?? [];
  const headerRow: PMNode = {
    type: 'tableRow',
    content: t.header.map((cell, i) => ({
      type: 'tableHeader',
      attrs: { align: align[i] ?? null },
      content: [{ type: 'paragraph', content: inline(cell.tokens) }],
    })),
  };
  const bodyRows: PMNode[] = t.rows.map((row) => ({
    type: 'tableRow',
    content: row.map((cell, i) => ({
      type: 'tableCell',
      attrs: { align: align[i] ?? null },
      content: [{ type: 'paragraph', content: inline(cell.tokens) }],
    })),
  }));
  return { type: 'table', content: [headerRow, ...bodyRows] };
}

/** Turn an HTML block into embed nodes (for each `data-tmr-embed` marker) and/or a raw htmlBlock. */
function pushHtml(out: PMNode[], html: string, embeds: readonly EmbedConfig[]): void {
  EMBED_MARKER.lastIndex = 0;
  let lastIndex = 0;
  let match = EMBED_MARKER.exec(html);
  if (!match) {
    const trimmed = html.trim();
    if (trimmed) {
      out.push({ type: 'htmlBlock', attrs: { html: trimmed } });
    }
    return;
  }
  while (match !== null) {
    const before = html.slice(lastIndex, match.index).trim();
    if (before) {
      out.push({ type: 'htmlBlock', attrs: { html: before } });
    }
    const idx = Number(match[1]);
    const config = embeds[idx];
    if (config) {
      out.push({ type: EMBED_NODE, attrs: { config } });
    }
    lastIndex = match.index + match[0].length;
    match = EMBED_MARKER.exec(html);
  }
  const after = html.slice(lastIndex).trim();
  if (after) {
    out.push({ type: 'htmlBlock', attrs: { html: after } });
  }
}

// --- Inline ---

function inline(tokens: Token[] | undefined, marks: PMMark[] = []): PMNode[] {
  if (!tokens) {
    return [];
  }
  const out: PMNode[] = [];
  for (const token of tokens) {
    inlineToken(out, token, marks);
  }
  return out;
}

function withMark(marks: PMMark[], mark: PMMark): PMMark[] {
  return [...marks, mark];
}

function textNode(text: string, marks: PMMark[]): PMNode {
  return marks.length ? { type: 'text', text, marks } : { type: 'text', text };
}

function inlineToken(out: PMNode[], token: Token, marks: PMMark[]): void {
  switch (token.type) {
    case 'text': {
      const t = token as Tokens.Text;
      if (t.tokens?.length) {
        out.push(...inline(t.tokens, marks));
      } else if (t.raw) {
        out.push(textNode(t.raw, marks));
      }
      return;
    }
    case 'escape': {
      // `\*` etc. — keep the source verbatim so it re-serializes unchanged.
      out.push(textNode((token as Tokens.Escape).raw, marks));
      return;
    }
    case 'strong':
      out.push(...inline((token as Tokens.Strong).tokens, withMark(marks, { type: 'bold' })));
      return;
    case 'em':
      out.push(...inline((token as Tokens.Em).tokens, withMark(marks, { type: 'italic' })));
      return;
    case 'del':
      out.push(...inline((token as Tokens.Del).tokens, withMark(marks, { type: 'strike' })));
      return;
    case 'codespan':
      out.push(textNode((token as Tokens.Codespan).text, withMark(marks, { type: 'code' })));
      return;
    case 'link': {
      const t = token as Tokens.Link;
      const linkMark: PMMark = {
        type: 'link',
        attrs: { href: t.href, ...(t.title ? { title: t.title } : {}) },
      };
      out.push(...inline(t.tokens, withMark(marks, linkMark)));
      return;
    }
    case 'image': {
      const t = token as Tokens.Image;
      out.push({
        type: 'image',
        attrs: { src: t.href, alt: t.text ?? '', ...(t.title ? { title: t.title } : {}) },
      });
      return;
    }
    case 'br':
      out.push({ type: 'hardBreak' });
      return;
    case 'html':
      out.push(textNode((token as Tokens.HTML).raw, marks));
      return;
    default:
      if ('raw' in token && typeof token.raw === 'string') {
        out.push(textNode(token.raw, marks));
      }
  }
}
