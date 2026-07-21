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
const PianoKeyboard = lazy(() => import('@TheY2T/tmr-musickit-ui/PianoKeyboard'));
const ChordDictionary = lazy(() => import('@TheY2T/tmr-musickit-ui/ChordDictionary'));
const TuningReference = lazy(() => import('@TheY2T/tmr-musickit-ui/TuningReference'));
const BeatSequencer = lazy(() => import('@TheY2T/tmr-musickit-ui/BeatSequencer'));
const ScaleBoxes = lazy(() => import('@TheY2T/tmr-musickit-ui/ScaleBoxes'));
const GuitarFretboard = lazy(() => import('@TheY2T/tmr-musickit-ui/GuitarFretboard'));
const ChordDiagrams = lazy(() => import('@TheY2T/tmr-musickit-ui/ChordDiagrams'));
const Intervals = lazy(() => import('@TheY2T/tmr-musickit-ui/Intervals'));
const DrillsHub = lazy(() => import('@TheY2T/tmr-musickit-ui/DrillsHub'));
const CollectionsWidget = lazy(() => import('./CollectionsWidget'));
const ProgressWidget = lazy(() => import('./ProgressWidget'));
const AchievementsWidget = lazy(() => import('./AchievementsWidget'));

/** The widget types a practice space can host. */
export type WidgetType =
  | 'metronome'
  | 'circle-of-fifths'
  | 'keyboard'
  | 'chord-dictionary'
  | 'chord-diagrams'
  | 'fretboard'
  | 'scale-boxes'
  | 'intervals'
  | 'tuner'
  | 'sequencer'
  | 'ear-trainer'
  | 'drills'
  | 'progress'
  | 'collections'
  | 'achievements'
  | 'note';

/** The groups the widget picker organises widgets into. */
export type WidgetCategory = 'tools' | 'drills' | 'progress';

/** Picker category tabs, in display order, each with its i18n label. */
export const WIDGET_CATEGORIES: { category: WidgetCategory; labelKey: MessageKey }[] = [
  { category: 'tools', labelKey: 'spaces.category.tools' },
  { category: 'drills', labelKey: 'spaces.category.drills' },
  { category: 'progress', labelKey: 'spaces.category.progress' },
];

/** Ambient context every widget render gets (locale now; user/flags join as widgets need them). */
export interface WidgetContext {
  locale: Locale;
}

export interface WidgetDefinition {
  type: WidgetType;
  /** Which picker group the widget belongs to. */
  category: WidgetCategory;
  /** i18n key for the widget's card title. */
  titleKey: MessageKey;
  /** i18n key for the one-line description shown in the picker. */
  descKey: MessageKey;
  /** Design-system icon shown in the card header + picker. */
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
    category: 'tools',
    titleKey: 'spaces.widget.metronome',
    descKey: 'spaces.widget.metronomeDesc',
    icon: 'gauge',
    defaultSize: { w: 4, h: 4 },
    minSize: { w: 3, h: 3 },
    render: () => <Metronome />,
  },
  'circle-of-fifths': {
    type: 'circle-of-fifths',
    category: 'tools',
    titleKey: 'spaces.widget.circleOfFifths',
    descKey: 'spaces.widget.circleOfFifthsDesc',
    icon: 'circle',
    defaultSize: { w: 4, h: 6 },
    minSize: { w: 3, h: 5 },
    render: () => <CircleOfFifths />,
  },
  keyboard: {
    type: 'keyboard',
    category: 'tools',
    titleKey: 'spaces.widget.keyboard',
    descKey: 'spaces.widget.keyboardDesc',
    icon: 'piano',
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 4, h: 3 },
    render: (_config, ctx) => <PianoKeyboard scaleHighlight locale={ctx.locale} />,
  },
  'chord-dictionary': {
    type: 'chord-dictionary',
    category: 'tools',
    titleKey: 'spaces.widget.chordDictionary',
    descKey: 'spaces.widget.chordDictionaryDesc',
    icon: 'book-open',
    defaultSize: { w: 5, h: 6 },
    minSize: { w: 4, h: 4 },
    render: (_config, ctx) => <ChordDictionary locale={ctx.locale} />,
  },
  'chord-diagrams': {
    type: 'chord-diagrams',
    category: 'tools',
    titleKey: 'spaces.widget.chordDiagrams',
    descKey: 'spaces.widget.chordDiagramsDesc',
    icon: 'layout-grid',
    defaultSize: { w: 5, h: 4 },
    minSize: { w: 3, h: 3 },
    render: () => <ChordDiagrams />,
  },
  fretboard: {
    type: 'fretboard',
    category: 'tools',
    titleKey: 'spaces.widget.fretboard',
    descKey: 'spaces.widget.fretboardDesc',
    icon: 'guitar',
    defaultSize: { w: 8, h: 4 },
    minSize: { w: 5, h: 3 },
    render: (_config, ctx) => <GuitarFretboard locale={ctx.locale} />,
  },
  'scale-boxes': {
    type: 'scale-boxes',
    category: 'tools',
    titleKey: 'spaces.widget.scaleBoxes',
    descKey: 'spaces.widget.scaleBoxesDesc',
    icon: 'music',
    defaultSize: { w: 5, h: 5 },
    minSize: { w: 4, h: 4 },
    render: () => <ScaleBoxes />,
  },
  intervals: {
    type: 'intervals',
    category: 'tools',
    titleKey: 'spaces.widget.intervals',
    descKey: 'spaces.widget.intervalsDesc',
    icon: 'ruler-dimension-line',
    defaultSize: { w: 4, h: 4 },
    minSize: { w: 3, h: 3 },
    render: (_config, ctx) => <Intervals locale={ctx.locale} />,
  },
  tuner: {
    type: 'tuner',
    category: 'tools',
    titleKey: 'spaces.widget.tuner',
    descKey: 'spaces.widget.tunerDesc',
    icon: 'sliders',
    defaultSize: { w: 3, h: 3 },
    minSize: { w: 3, h: 2 },
    render: () => <TuningReference />,
  },
  sequencer: {
    type: 'sequencer',
    category: 'tools',
    titleKey: 'spaces.widget.sequencer',
    descKey: 'spaces.widget.sequencerDesc',
    icon: 'disc',
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 4, h: 3 },
    render: () => <BeatSequencer />,
  },
  'ear-trainer': {
    type: 'ear-trainer',
    category: 'drills',
    titleKey: 'spaces.widget.earTrainer',
    descKey: 'spaces.widget.earTrainerDesc',
    icon: 'headphones',
    defaultSize: { w: 4, h: 5 },
    minSize: { w: 3, h: 4 },
    render: () => <EarTrainer />,
  },
  drills: {
    type: 'drills',
    category: 'drills',
    titleKey: 'spaces.widget.drills',
    descKey: 'spaces.widget.drillsDesc',
    icon: 'zap',
    defaultSize: { w: 5, h: 5 },
    minSize: { w: 4, h: 4 },
    render: (_config, ctx) => <DrillsHub locale={ctx.locale} />,
  },
  progress: {
    type: 'progress',
    category: 'progress',
    titleKey: 'spaces.widget.progress',
    descKey: 'spaces.widget.progressDesc',
    icon: 'chart',
    defaultSize: { w: 6, h: 2 },
    minSize: { w: 4, h: 2 },
    render: (_config, ctx) => <ProgressWidget locale={ctx.locale} />,
  },
  collections: {
    type: 'collections',
    category: 'progress',
    titleKey: 'spaces.widget.collections',
    descKey: 'spaces.widget.collectionsDesc',
    icon: 'graduation-cap',
    defaultSize: { w: 4, h: 5 },
    minSize: { w: 3, h: 3 },
    render: (_config, ctx) => <CollectionsWidget locale={ctx.locale} />,
  },
  achievements: {
    type: 'achievements',
    category: 'progress',
    titleKey: 'spaces.widget.achievements',
    descKey: 'spaces.widget.achievementsDesc',
    icon: 'trophy',
    defaultSize: { w: 4, h: 4 },
    minSize: { w: 3, h: 3 },
    render: (_config, ctx) => <AchievementsWidget locale={ctx.locale} />,
  },
  note: {
    type: 'note',
    category: 'progress',
    titleKey: 'spaces.widget.note',
    descKey: 'spaces.widget.noteDesc',
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
