import { describe, expect, it } from 'vitest';
import { htmlToMarkdown, prefersMarkdown } from './markdown';

describe('prefersMarkdown', () => {
  it('is true when the client explicitly asks for markdown', () => {
    expect(prefersMarkdown('text/markdown')).toBe(true);
    expect(prefersMarkdown('text/markdown,text/html;q=0.9')).toBe(true);
    expect(prefersMarkdown('text/x-markdown')).toBe(true);
  });

  it('is false for a normal browser Accept header', () => {
    expect(
      prefersMarkdown('text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'),
    ).toBe(false);
  });

  it('is false when markdown ranks below html', () => {
    expect(prefersMarkdown('text/html,text/markdown;q=0.5')).toBe(false);
  });

  it('is false for null or empty', () => {
    expect(prefersMarkdown(null)).toBe(false);
    expect(prefersMarkdown('')).toBe(false);
  });
});

describe('htmlToMarkdown', () => {
  it('extracts the <main> region and converts it, dropping chrome', () => {
    const html =
      '<html><body><header><a href="/">Nav</a></header>' +
      '<main><h1>Title</h1><p>Hello <strong>world</strong>.</p></main>' +
      '<footer>Footer</footer></body></html>';
    const md = htmlToMarkdown(html);
    expect(md).toContain('# Title');
    expect(md).toContain('Hello **world**');
    expect(md).not.toContain('Nav');
    expect(md).not.toContain('Footer');
  });

  it('returns null when there is no <main>', () => {
    expect(htmlToMarkdown('<div>no main here</div>')).toBeNull();
  });
});
