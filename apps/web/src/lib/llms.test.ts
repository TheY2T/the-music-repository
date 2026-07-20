import { describe, expect, it } from 'vitest';
import { renderItemMarkdown, renderLlmsFull, renderLlmsIndex } from './llms';

const site = new URL('https://tmr.test');

describe('renderLlmsIndex', () => {
  it('emits an H1, blockquote summary, and ## sections of markdown links with absolute URLs', () => {
    const out = renderLlmsIndex({
      site,
      title: 'The Music Repository',
      summary: 'A summary.',
      sections: [
        {
          heading: 'Catalogue',
          links: [{ title: 'Für Elise', path: '/catalogue/fur-elise', description: 'A classic.' }],
        },
      ],
    });
    expect(out.startsWith('# The Music Repository\n')).toBe(true);
    expect(out).toContain('> A summary.');
    expect(out).toContain('## Catalogue');
    expect(out).toContain('- [Für Elise](https://tmr.test/catalogue/fur-elise): A classic.');
  });

  it('groups optional links under a trailing ## Optional section', () => {
    const out = renderLlmsIndex({
      site,
      sections: [{ heading: 'Pages', links: [{ title: 'About', path: '/about' }] }],
      optional: [{ title: 'Privacy Policy', path: '/privacy' }],
    });
    expect(out).toContain('## Optional');
    expect(out.indexOf('## Pages')).toBeLessThan(out.indexOf('## Optional'));
    expect(out).toContain('- [Privacy Policy](https://tmr.test/privacy)');
  });

  it('skips empty sections and collapses multi-line descriptions', () => {
    const out = renderLlmsIndex({
      site,
      sections: [
        { heading: 'Empty', links: [] },
        {
          heading: 'Tools',
          links: [{ title: 'Keyboard', path: '/tools/keyboard', description: 'Play\n  notes.' }],
        },
      ],
    });
    expect(out).not.toContain('## Empty');
    expect(out).toContain('- [Keyboard](https://tmr.test/tools/keyboard): Play notes.');
  });
});

describe('renderItemMarkdown', () => {
  it('renders title, source, summary, details, outcomes, and body', () => {
    const out = renderItemMarkdown(
      {
        title: 'Für Elise',
        path: '/catalogue/fur-elise',
        summary: 'A bagatelle.',
        details: [['Key', 'A minor']],
        outcomes: ['Left-hand arpeggios'],
        body: '## Section\n\nProse here.',
      },
      { site, headingLevel: 1 },
    );
    expect(out).toContain('# Für Elise');
    expect(out).toContain('*Source: https://tmr.test/catalogue/fur-elise*');
    expect(out).toContain('> A bagatelle.');
    expect(out).toContain('- **Key:** A minor');
    expect(out).toContain("**What you'll learn:**");
    expect(out).toContain('- Left-hand arpeggios');
    expect(out).toContain('Prose here.');
  });

  it('omits sections that have no data', () => {
    const out = renderItemMarkdown({ title: 'Bare' });
    expect(out).toBe('# Bare');
  });

  it('demotes body headings to nest below the item heading', () => {
    const out = renderItemMarkdown(
      { title: 'Song', body: '## About\n\nText.\n\n### Detail\n\nMore.' },
      { headingLevel: 3 },
    );
    expect(out).toContain('### Song');
    // `##`/`###` shift down by 2 so they sit below the `###` item heading.
    expect(out).toContain('#### About');
    expect(out).toContain('##### Detail');
    expect(out).not.toMatch(/^## About/m);
  });

  it('strips interactive-embed placeholder markers from the body', () => {
    const out = renderItemMarkdown({
      title: 'Song',
      body: 'Before.\n\n<div data-tmr-embed="0"></div>\n\nAfter.',
    });
    expect(out).not.toContain('data-tmr-embed');
    expect(out).toContain('Before.');
    expect(out).toContain('After.');
  });
});

describe('renderLlmsFull', () => {
  it('nests items as ### under ## section headings', () => {
    const out = renderLlmsFull({
      site,
      sections: [{ heading: 'Catalogue', items: [{ title: 'Song', body: 'Body.' }] }],
    });
    expect(out).toContain('## Catalogue');
    expect(out).toContain('### Song');
    expect(out).toContain('Body.');
  });
});
