import { EMBED_TOOLS } from '@TheY2T/tmr-content-serde';
import { describe, expect, it } from 'vitest';
import { defaultConfig, fieldsForTool, TOOL_LABEL_KEY, TOOL_ORDER } from './embed-fields';

describe('block-editor embed field schemas', () => {
  it('covers every embed tool in the insert menu + label map', () => {
    expect([...TOOL_ORDER].sort()).toEqual([...EMBED_TOOLS].sort());
    for (const tool of EMBED_TOOLS) {
      expect(TOOL_LABEL_KEY[tool]).toBeTruthy();
    }
  });

  it('always appends title + caption fields for every tool', () => {
    for (const tool of EMBED_TOOLS) {
      const keys = fieldsForTool(tool).map((f) => f.key);
      expect(keys).toContain('title');
      expect(keys).toContain('caption');
    }
  });

  it('exposes the expected tool-specific fields', () => {
    expect(fieldsForTool('progression').map((f) => f.key)).toEqual([
      'chords',
      'key',
      'tempo',
      'title',
      'caption',
    ]);
    expect(fieldsForTool('circle-of-fifths').map((f) => f.key)).toEqual(['title', 'caption']);
  });

  it('produces a config whose tool matches the requested tool', () => {
    for (const tool of EMBED_TOOLS) {
      expect(defaultConfig(tool).tool).toBe(tool);
    }
  });

  it('gives sensible non-empty defaults for the chord tools', () => {
    expect(defaultConfig('chord-diagrams').chords).toEqual(['C', 'G', 'Am', 'F']);
    expect(defaultConfig('progression').tempo).toBe(90);
  });
});
