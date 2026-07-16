import { describe, expect, it } from 'vitest';
import { docToMdx } from './doc-to-mdx';
import { mdxToDoc } from './mdx-to-doc';
import type { EmbedConfig } from './types';

/** Round-trip a body through doc→…→doc and assert the derived markdown is stable + embeds preserved. */
function roundTrip(bodyMdx: string, embeds: EmbedConfig[] = []) {
  const doc = mdxToDoc(bodyMdx, embeds);
  const first = docToMdx(doc);
  const second = docToMdx(mdxToDoc(first.bodyMdx, first.embeds));
  return { doc, first, second };
}

describe('content-serde round-trip', () => {
  it('preserves headings, paragraphs and inline marks', () => {
    const md = '## Overview\n\nA **bold** and *italic* and `code` and ~~gone~~ line.';
    const { first, second } = roundTrip(md);
    expect(first.bodyMdx).toBe(md);
    expect(second.bodyMdx).toBe(first.bodyMdx);
  });

  it('preserves bullet and ordered lists', () => {
    const md = '- one\n- two\n- three';
    const { first } = roundTrip(md);
    expect(first.bodyMdx).toBe(md);

    const ol = '1. first\n2. second';
    expect(roundTrip(ol).first.bodyMdx).toBe(ol);
  });

  it('preserves links', () => {
    const md = 'See [the docs](https://example.com) for more.';
    expect(roundTrip(md).first.bodyMdx).toBe(md);
  });

  it('preserves GFM tables', () => {
    const md = ['| Degree | Chord |', '| --- | --- |', '| I | A7 |', '| IV | D7 |'].join('\n');
    const { first, second } = roundTrip(md);
    expect(first.bodyMdx).toBe(md);
    expect(second.bodyMdx).toBe(first.bodyMdx);
  });

  it('extracts embeds from markers and re-emits them in order', () => {
    const embeds: EmbedConfig[] = [
      { tool: 'chord-diagrams', chords: ['C', 'G'] },
      { tool: 'progression', chords: ['I', 'IV', 'V'], tempo: 90 },
    ];
    const md = [
      'Intro prose.',
      '',
      '<div data-tmr-embed="0"></div>',
      '',
      'Middle prose.',
      '',
      '<div data-tmr-embed="1"></div>',
      '',
      'Outro.',
    ].join('\n');

    const { first } = roundTrip(md, embeds);
    expect(first.embeds).toEqual(embeds);
    // Markers survive at both positions.
    expect(first.bodyMdx).toContain('<div data-tmr-embed="0"></div>');
    expect(first.bodyMdx).toContain('<div data-tmr-embed="1"></div>');
    // Prose order preserved.
    expect(first.bodyMdx.indexOf('Intro')).toBeLessThan(
      first.bodyMdx.indexOf('data-tmr-embed="0"'),
    );
    expect(first.bodyMdx.indexOf('data-tmr-embed="0"')).toBeLessThan(
      first.bodyMdx.indexOf('Middle'),
    );
  });

  it('handles two adjacent markers in one HTML block', () => {
    const embeds: EmbedConfig[] = [{ tool: 'keyboard', root: 'C' }, { tool: 'circle-of-fifths' }];
    const md = 'Prose.\n\n<div data-tmr-embed="0"></div>\n<div data-tmr-embed="1"></div>\n\nMore.';
    const { first } = roundTrip(md, embeds);
    expect(first.embeds).toEqual(embeds);
  });

  it('preserves HTML comments', () => {
    const md = 'Text.\n\n<!-- editorial note -->';
    const doc = mdxToDoc(md);
    expect(doc.content.some((n) => n.type === 'htmlBlock')).toBe(true);
    expect(docToMdx(doc).bodyMdx).toContain('<!-- editorial note -->');
  });

  it('produces an empty body for an empty doc', () => {
    expect(docToMdx({ type: 'doc', content: [] }).bodyMdx).toBe('');
  });
});
