import type { DashboardSpace } from '@TheY2T/tmr-web-acl/dto';

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
