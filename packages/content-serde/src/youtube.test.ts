import { describe, expect, it } from 'vitest';
import { parseYouTubeId, youTubeThumbnailUrl } from './youtube';

describe('parseYouTubeId', () => {
  it('extracts the id from every common URL form', () => {
    const cases = [
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://youtube.com/watch?v=dQw4w9WgXcQ&t=30s',
      'https://youtu.be/dQw4w9WgXcQ',
      'https://www.youtube.com/embed/dQw4w9WgXcQ',
      'https://www.youtube.com/shorts/dQw4w9WgXcQ',
      'https://www.youtube.com/live/dQw4w9WgXcQ',
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
      'https://m.youtube.com/watch?v=dQw4w9WgXcQ',
    ];
    for (const url of cases) {
      expect(parseYouTubeId(url)).toBe('dQw4w9WgXcQ');
    }
  });

  it('accepts a bare 11-char id', () => {
    expect(parseYouTubeId('dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('returns null for non-YouTube or malformed input', () => {
    expect(parseYouTubeId('https://vimeo.com/12345')).toBeNull();
    expect(parseYouTubeId('not a url')).toBeNull();
    expect(parseYouTubeId('https://youtu.be/tooShort')).toBeNull();
    expect(parseYouTubeId('')).toBeNull();
    expect(parseYouTubeId(undefined)).toBeNull();
  });
});

describe('youTubeThumbnailUrl', () => {
  it('builds the deterministic thumbnail URL', () => {
    expect(youTubeThumbnailUrl('dQw4w9WgXcQ')).toBe(
      'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    );
    expect(youTubeThumbnailUrl('dQw4w9WgXcQ', 'maxresdefault')).toBe(
      'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    );
  });
});
