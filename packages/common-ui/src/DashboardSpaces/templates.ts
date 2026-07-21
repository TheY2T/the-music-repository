import type { MessageKey } from '@TheY2T/tmr-i18n';
import type { IconName } from '@TheY2T/tmr-ui';
import type { DashboardSpace } from '@TheY2T/tmr-web-acl/dto';
import type { WidgetType } from './widget-registry';

/** A widget placement within a template (ids are assigned when the space is created). */
export interface TemplateWidget {
  type: WidgetType;
  x: number;
  y: number;
  w: number;
  h: number;
  config?: Record<string, unknown>;
}

/** A starter space a learner can create from — a named, pre-arranged set of widgets. */
export interface SpaceTemplate {
  key: string;
  nameKey: MessageKey;
  icon: IconName;
  widgets: TemplateWidget[];
}

/** The built-in templates offered when creating a space (Blank first). */
export const SPACE_TEMPLATES: SpaceTemplate[] = [
  { key: 'blank', nameKey: 'spaces.template.blank', icon: 'plus', widgets: [] },
  {
    key: 'warmup',
    nameKey: 'spaces.template.warmup',
    icon: 'flame',
    widgets: [
      { type: 'metronome', x: 0, y: 0, w: 4, h: 4 },
      { type: 'ear-trainer', x: 4, y: 0, w: 4, h: 5 },
      { type: 'note', x: 8, y: 0, w: 4, h: 3, config: { text: '' } },
    ],
  },
  {
    key: 'theory',
    nameKey: 'spaces.template.theory',
    icon: 'circle',
    widgets: [
      { type: 'circle-of-fifths', x: 0, y: 0, w: 6, h: 6 },
      { type: 'note', x: 6, y: 0, w: 4, h: 3, config: { text: '' } },
    ],
  },
  {
    key: 'courses',
    nameKey: 'spaces.template.courses',
    icon: 'graduation-cap',
    widgets: [
      { type: 'collections', x: 0, y: 0, w: 6, h: 5 },
      { type: 'note', x: 6, y: 0, w: 4, h: 3, config: { text: '' } },
    ],
  },
];

/**
 * The starter space a learner sees before they have saved anything — a balanced first workspace
 * (tempo, ear training, theory reference, and a note) they can immediately use and later rearrange.
 */
export function defaultSpace(name: string): DashboardSpace {
  return {
    id: 'starter',
    name,
    icon: 'music',
    background: { style: 'waves', intensity: 55 },
    widgets: [
      { id: 'starter-metronome', type: 'metronome', x: 0, y: 0, w: 4, h: 4, config: {} },
      { id: 'starter-ear', type: 'ear-trainer', x: 4, y: 0, w: 4, h: 5, config: {} },
      { id: 'starter-cof', type: 'circle-of-fifths', x: 8, y: 0, w: 4, h: 6, config: {} },
      { id: 'starter-note', type: 'note', x: 0, y: 4, w: 4, h: 3, config: { text: '' } },
    ],
  };
}
