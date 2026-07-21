import type { Locale, MessageKey } from '@TheY2T/tmr-i18n';
import type { IconName } from '@TheY2T/tmr-ui';
import { lazy, type ReactNode } from 'react';
import NoteWidget from './NoteWidget';

// Tool widgets lazy-load their islands so a space only ships the code for the widgets it actually
// renders (the same split as content embeds), and so the audio/WebGL tool modules stay out of any
// bundle — or test — that doesn't render them.
const Metronome = lazy(() => import('@TheY2T/tmr-musickit-ui/Metronome'));
const CircleOfFifths = lazy(() => import('@TheY2T/tmr-musickit-ui/CircleOfFifths'));
const EarTrainer = lazy(() => import('@TheY2T/tmr-musickit-ui/EarTrainer'));

/** The widget types a practice space can host. Extended per phase as more widgets are adapted. */
export type WidgetType = 'metronome' | 'circle-of-fifths' | 'ear-trainer' | 'note';

/** Ambient context every widget render gets (locale now; user/flags join as widgets need them). */
export interface WidgetContext {
  locale: Locale;
}

export interface WidgetDefinition {
  type: WidgetType;
  /** i18n key for the widget's card title. */
  titleKey: MessageKey;
  /** Design-system icon shown in the card header + palette. */
  icon: IconName;
  /** Default grid footprint (columns × rows) when a widget is first dropped. */
  defaultSize: { w: number; h: number };
  /** Minimum grid footprint enforced by the editor. */
  minSize: { w: number; h: number };
  /** Render the widget body from its stored config + context. */
  render: (config: Record<string, unknown>, ctx: WidgetContext) => ReactNode;
}

export const WIDGET_REGISTRY: Record<WidgetType, WidgetDefinition> = {
  metronome: {
    type: 'metronome',
    titleKey: 'spaces.widget.metronome',
    icon: 'gauge',
    defaultSize: { w: 4, h: 4 },
    minSize: { w: 3, h: 3 },
    render: () => <Metronome />,
  },
  'circle-of-fifths': {
    type: 'circle-of-fifths',
    titleKey: 'spaces.widget.circleOfFifths',
    icon: 'circle',
    defaultSize: { w: 4, h: 6 },
    minSize: { w: 3, h: 5 },
    render: () => <CircleOfFifths />,
  },
  'ear-trainer': {
    type: 'ear-trainer',
    titleKey: 'spaces.widget.earTrainer',
    icon: 'headphones',
    defaultSize: { w: 4, h: 5 },
    minSize: { w: 3, h: 4 },
    render: () => <EarTrainer />,
  },
  note: {
    type: 'note',
    titleKey: 'spaces.widget.note',
    icon: 'pencil',
    defaultSize: { w: 3, h: 3 },
    minSize: { w: 2, h: 2 },
    render: (config, ctx) => (
      <NoteWidget
        text={typeof config.text === 'string' ? config.text : undefined}
        locale={ctx.locale}
      />
    ),
  },
};

/** The widget types offerable to a viewer (extended with flag/auth gating as more widgets land). */
export const WIDGET_TYPES = Object.keys(WIDGET_REGISTRY) as WidgetType[];

/** Type guard for a stored widget type string. */
export function isWidgetType(value: string): value is WidgetType {
  return value in WIDGET_REGISTRY;
}
