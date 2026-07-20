import type { EmbedConfig, EmbedTool } from '@TheY2T/tmr-content-serde';
import type { MessageKey } from '@TheY2T/tmr-i18n';

/** One editable field in the embed inspector. `list` = comma-separated tokens ↔ string[]. */
export interface EmbedFieldDef {
  key: string;
  type: 'text' | 'number' | 'textarea' | 'select' | 'list';
  labelKey: MessageKey;
  /** Enum options for `select` — values stay as technical tokens (guitar/tab/…), shown verbatim. */
  options?: string[];
}

const FIELD: Record<string, EmbedFieldDef> = {
  title: { key: 'title', type: 'text', labelKey: 'blockEditor.field.title' },
  caption: { key: 'caption', type: 'text', labelKey: 'blockEditor.field.caption' },
  tex: { key: 'tex', type: 'textarea', labelKey: 'blockEditor.field.tex' },
  scoreSlug: { key: 'scoreSlug', type: 'text', labelKey: 'blockEditor.field.scoreSlug' },
  mode: {
    key: 'mode',
    type: 'select',
    labelKey: 'blockEditor.field.mode',
    options: ['standard', 'tab'],
  },
  instrument: {
    key: 'instrument',
    type: 'select',
    labelKey: 'blockEditor.field.instrument',
    options: ['guitar', 'ukulele', 'bass', 'piano'],
  },
  root: { key: 'root', type: 'text', labelKey: 'blockEditor.field.root' },
  scale: { key: 'scale', type: 'text', labelKey: 'blockEditor.field.scale' },
  key: { key: 'key', type: 'text', labelKey: 'blockEditor.field.key' },
  size: { key: 'size', type: 'number', labelKey: 'blockEditor.field.size' },
  tempo: { key: 'tempo', type: 'number', labelKey: 'blockEditor.field.tempo' },
  chords: { key: 'chords', type: 'list', labelKey: 'blockEditor.field.chords' },
  labels: { key: 'labels', type: 'list', labelKey: 'blockEditor.field.labels' },
  pattern: { key: 'pattern', type: 'list', labelKey: 'blockEditor.field.pattern' },
  tuning: { key: 'tuning', type: 'list', labelKey: 'blockEditor.field.tuning' },
  videoUrl: { key: 'videoUrl', type: 'text', labelKey: 'blockEditor.field.videoUrl' },
  start: { key: 'start', type: 'number', labelKey: 'blockEditor.field.start' },
};

/** Which config fields each tool exposes (title/caption are appended to all). */
const TOOL_FIELDS: Record<EmbedTool, string[]> = {
  score: ['tex', 'scoreSlug', 'mode', 'instrument'],
  keyboard: ['root', 'scale', 'size'],
  'scale-boxes': ['root', 'scale', 'mode'],
  'chord-diagrams': ['chords', 'instrument'],
  progression: ['chords', 'key', 'tempo'],
  'circle-of-fifths': [],
  strum: ['pattern', 'chords', 'tempo'],
  rhythm: ['pattern', 'tempo'],
  'chord-board': ['chords', 'labels'],
  intervals: ['root'],
  fingering: ['instrument', 'tuning', 'root', 'scale'],
  youtube: ['videoUrl', 'start'],
};

/** Fields shown for a tool, in order (tool-specific first, then the shared title + caption). */
export function fieldsForTool(tool: EmbedTool): EmbedFieldDef[] {
  const keys = TOOL_FIELDS[tool] ?? [];
  return [...keys, 'title', 'caption'].map((k) => FIELD[k] as EmbedFieldDef);
}

/** A sensible starting config when a tool is first inserted. */
export function defaultConfig(tool: EmbedTool): EmbedConfig {
  switch (tool) {
    case 'score':
      return { tool, tex: '\\title "Example"\n.\n:4 c d e f | g a b c5' };
    case 'keyboard':
      return { tool, root: 'C', scale: 'major', size: 61 };
    case 'scale-boxes':
      return { tool, root: 'A', scale: 'minor-pentatonic' };
    case 'chord-diagrams':
      return { tool, chords: ['C', 'G', 'Am', 'F'], instrument: 'guitar' };
    case 'progression':
      return { tool, chords: ['C', 'G', 'Am', 'F'], key: 'C', tempo: 90 };
    case 'circle-of-fifths':
      return { tool };
    case 'strum':
      return { tool, pattern: ['D', '-', 'D', 'U', '-', 'U', 'D', 'U'], chords: ['C'], tempo: 90 };
    case 'rhythm':
      return { tool, pattern: ['quarter', 'quarter', 'eighth', 'eighth', 'quarter'] };
    case 'chord-board':
      return { tool, chords: ['C', 'G', 'Am', 'F'], labels: ['I', 'V', 'vi', 'IV'] };
    case 'intervals':
      return { tool, root: 'C' };
    case 'fingering':
      return { tool, instrument: 'guitar', root: 'A', scale: 'minor-pentatonic' };
    case 'youtube':
      return { tool, videoUrl: '' };
    default:
      return { tool };
  }
}

/** The tools, for the insert menu. Label + a short description live under `blockEditor.tool.*`. */
export const TOOL_ORDER: EmbedTool[] = [
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
  'youtube',
];

export const TOOL_LABEL_KEY: Record<EmbedTool, MessageKey> = {
  score: 'blockEditor.tool.score',
  keyboard: 'blockEditor.tool.keyboard',
  'scale-boxes': 'blockEditor.tool.scaleBoxes',
  'chord-diagrams': 'blockEditor.tool.chordDiagrams',
  progression: 'blockEditor.tool.progression',
  'circle-of-fifths': 'blockEditor.tool.circleOfFifths',
  strum: 'blockEditor.tool.strum',
  rhythm: 'blockEditor.tool.rhythm',
  'chord-board': 'blockEditor.tool.chordBoard',
  intervals: 'blockEditor.tool.intervals',
  fingering: 'blockEditor.tool.fingering',
  youtube: 'blockEditor.tool.youtube',
};
