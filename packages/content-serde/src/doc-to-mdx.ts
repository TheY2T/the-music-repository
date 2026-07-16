import { EMBED_NODE, type EmbedConfig, type PMDoc, type PMMark, type PMNode } from './types';

export interface DocToMdxResult {
  /** Markdown body with `<div data-tmr-embed="N"></div>` markers where embeds sit. */
  bodyMdx: string;
  /** Flat embed configs, indexed by the marker `N`, in document order. */
  embeds: EmbedConfig[];
}

/**
 * Serialize a ProseMirror/TipTap document back to the stored render fields: a markdown `body_mdx` that
 * (via `marked`) renders identically to hand-authored content, plus the flat `embeds` array. Each
 * `tmrEmbed` node emits a `<div data-tmr-embed="N"></div>` marker (byte-matching the seed build's
 * format) and pushes its config to `embeds[N]`, so the runtime `ContentBody` interleaves it in place.
 * See ADR 0030.
 */
export function docToMdx(doc: PMDoc): DocToMdxResult {
  const embeds: EmbedConfig[] = [];
  const bodyMdx = serializeBlocks(doc.content ?? [], embeds, '').trim();
  return { bodyMdx, embeds };
}

/** Join block nodes with blank lines, honouring an indent prefix (for nested list content). */
function serializeBlocks(nodes: PMNode[], embeds: EmbedConfig[], indent: string): string {
  return nodes
    .map((node) => serializeBlock(node, embeds, indent))
    .filter((s) => s.length > 0)
    .join('\n\n');
}

function serializeBlock(node: PMNode, embeds: EmbedConfig[], indent: string): string {
  switch (node.type) {
    case 'paragraph':
      return indentLines(serializeInline(node.content ?? []), indent);
    case 'heading': {
      const level = Number(node.attrs?.level) || 1;
      return `${indent}${'#'.repeat(level)} ${serializeInline(node.content ?? [])}`;
    }
    case 'bulletList':
      return serializeList(node, embeds, indent, () => '- ');
    case 'orderedList': {
      const start = Number(node.attrs?.start) || 1;
      return serializeList(node, embeds, indent, (i) => `${start + i}. `);
    }
    case 'blockquote': {
      const inner = serializeBlocks(node.content ?? [], embeds, '');
      return inner
        .split('\n')
        .map((line) => `${indent}> ${line}`.trimEnd())
        .join('\n');
    }
    case 'codeBlock': {
      const lang = typeof node.attrs?.language === 'string' ? node.attrs.language : '';
      const text = (node.content ?? []).map((c) => c.text ?? '').join('');
      return `${indent}\`\`\`${lang}\n${text}\n${indent}\`\`\``;
    }
    case 'horizontalRule':
      return `${indent}---`;
    case 'table':
      return serializeTable(node);
    case EMBED_NODE: {
      const config = node.attrs?.config as EmbedConfig | undefined;
      const n = embeds.length;
      if (config) {
        embeds.push(config);
      }
      return `${indent}<div data-tmr-embed="${n}"></div>`;
    }
    case 'htmlBlock':
      return typeof node.attrs?.html === 'string' ? indentLines(node.attrs.html, indent) : '';
    default:
      return '';
  }
}

function serializeList(
  node: PMNode,
  embeds: EmbedConfig[],
  indent: string,
  marker: (index: number) => string,
): string {
  const items = node.content ?? [];
  const loose = node.attrs?.loose === true;
  return (
    items
      .map((item, i) => {
        const bullet = marker(i);
        const childIndent = indent + ' '.repeat(bullet.length);
        const blocks = item.content ?? [];
        const rendered = blocks
          .map((block, bi) => {
            const body = serializeBlock(block, embeds, bi === 0 ? '' : childIndent);
            return bi === 0 ? `${indent}${bullet}${body}` : body;
          })
          .join('\n\n');
        return rendered;
      })
      // Loose lists keep a blank line between items so `marked` re-wraps each item in <p> (HTML parity).
      .join(loose ? '\n\n' : '\n')
  );
}

function serializeTable(node: PMNode): string {
  const rows = node.content ?? [];
  if (rows.length === 0) {
    return '';
  }
  const [header, ...body] = rows;
  if (!header) {
    return '';
  }
  const headerCells = (header.content ?? []).map((c) => serializeInline(cellInline(c)));
  const aligns = (header.content ?? []).map((c) => alignToken(c.attrs?.align));
  const lines = [
    `| ${headerCells.join(' | ')} |`,
    `| ${aligns.join(' | ')} |`,
    ...body.map(
      (row) => `| ${(row.content ?? []).map((c) => serializeInline(cellInline(c))).join(' | ')} |`,
    ),
  ];
  return lines.join('\n');
}

/** A table cell wraps its inline content in a paragraph; unwrap it for single-line rendering. */
function cellInline(cell: PMNode): PMNode[] {
  const first = cell.content?.[0];
  return first?.type === 'paragraph' ? (first.content ?? []) : (cell.content ?? []);
}

function alignToken(align: unknown): string {
  switch (align) {
    case 'left':
      return ':---';
    case 'right':
      return '---:';
    case 'center':
      return ':---:';
    default:
      return '---';
  }
}

/** Prefix every line of a block with `indent` (first line included). */
function indentLines(text: string, indent: string): string {
  if (!indent) {
    return text;
  }
  return text
    .split('\n')
    .map((line) => `${indent}${line}`)
    .join('\n');
}

// --- Inline ---

// Nesting order, outermost → innermost. A mark spanning several text nodes is emitted as one
// wrapping (open once, close once) via a delimiter stack — emitting per-node would produce runs like
// `**a****b**` that a Markdown renderer re-nests into doubled tags.
const MARK_ORDER: PMMark['type'][] = ['link', 'bold', 'italic', 'strike', 'code'];

function orderMarks(marks: PMMark[] | undefined): PMMark[] {
  if (!marks?.length) {
    return [];
  }
  return [...marks].sort((a, b) => MARK_ORDER.indexOf(a.type) - MARK_ORDER.indexOf(b.type));
}

function sameMark(a: PMMark, b: PMMark): boolean {
  return a.type === b.type && a.attrs?.href === b.attrs?.href && a.attrs?.title === b.attrs?.title;
}

function openDelim(mark: PMMark): string {
  switch (mark.type) {
    case 'link':
      return '[';
    case 'bold':
      return '**';
    case 'italic':
      return '*';
    case 'strike':
      return '~~';
    case 'code':
      return '`';
  }
}

function closeDelim(mark: PMMark): string {
  switch (mark.type) {
    case 'link':
      return `](${mark.attrs?.href ?? ''}${linkTitle(mark)})`;
    case 'bold':
      return '**';
    case 'italic':
      return '*';
    case 'strike':
      return '~~';
    case 'code':
      return '`';
  }
}

function linkTitle(link: PMMark): string {
  const title = link.attrs?.title;
  return typeof title === 'string' && title ? ` "${title}"` : '';
}

function serializeInline(nodes: PMNode[]): string {
  let out = '';
  const open: PMMark[] = [];
  const closeFrom = (from: number) => {
    for (let k = open.length - 1; k >= from; k--) {
      out += closeDelim(open[k] as PMMark);
    }
    open.length = from;
  };
  for (const node of nodes) {
    if (node.type !== 'text') {
      // Atoms (image, hardBreak) can't carry inline marks — close everything, then emit.
      closeFrom(0);
      out += serializeAtom(node);
      continue;
    }
    const marks = orderMarks(node.marks);
    let common = 0;
    while (
      common < open.length &&
      common < marks.length &&
      sameMark(open[common] as PMMark, marks[common] as PMMark)
    ) {
      common++;
    }
    closeFrom(common);
    for (let k = common; k < marks.length; k++) {
      const mark = marks[k] as PMMark;
      out += openDelim(mark);
      open.push(mark);
    }
    out += node.text ?? '';
  }
  closeFrom(0);
  return out;
}

function serializeAtom(node: PMNode): string {
  if (node.type === 'hardBreak') {
    return '\\\n';
  }
  if (node.type === 'image') {
    const alt = String(node.attrs?.alt ?? '');
    const src = String(node.attrs?.src ?? '');
    const title =
      typeof node.attrs?.title === 'string' && node.attrs.title ? ` "${node.attrs.title}"` : '';
    return `![${alt}](${src}${title})`;
  }
  return '';
}
