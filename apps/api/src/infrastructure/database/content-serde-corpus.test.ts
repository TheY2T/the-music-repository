import { docToMdx, type EmbedConfig, mdxToDoc } from '@TheY2T/tmr-content-serde';
import { marked } from 'marked';
import { describe, expect, it } from 'vitest';
import { SEED_CONTENT } from './seed-content';

/**
 * Golden round-trip over the entire authored article corpus (ADR 0030, the highest-risk item). For every
 * seeded article it asserts that parsing the stored `body_mdx` into a ProseMirror doc and serializing it
 * back (a) reproduces the `details.embeds` exactly, (b) renders to equivalent HTML via `marked` (so the
 * public page is visually unchanged after an editor save), and (c) is idempotent. This must pass before
 * the Phase-3 editor flag flips.
 */

/** Collapse whitespace + inter-tag gaps so two equivalent HTML renderings compare equal. */
function normalizeHtml(html: string): string {
  return html.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim();
}

const render = (md: string) => normalizeHtml(marked.parse(md, { async: false }));

describe('content-serde over the article corpus', () => {
  const entries = Object.entries(SEED_CONTENT);

  it('covers a non-trivial corpus', () => {
    expect(entries.length).toBeGreaterThan(50);
  });

  it.each(entries)('round-trips %s losslessly', (_slug, extra) => {
    const bodyMdx = extra.bodyMdx;
    const embeds = (extra.details?.embeds ?? []) as EmbedConfig[];

    const doc = mdxToDoc(bodyMdx, embeds);
    const { bodyMdx: derived, embeds: derivedEmbeds } = docToMdx(doc);

    // (a) embeds preserved exactly, in order.
    expect(derivedEmbeds).toEqual(embeds);

    // (b) rendered HTML is equivalent to the original.
    expect(render(derived)).toBe(render(bodyMdx));

    // (c) idempotent: a second pass produces identical markdown.
    const derivedAgain = docToMdx(mdxToDoc(derived, derivedEmbeds)).bodyMdx;
    expect(derivedAgain).toBe(derived);
  });
});
