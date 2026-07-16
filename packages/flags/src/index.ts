/**
 * @TheY2T/tmr-flags — the single source of truth for feature-flag keys and the evaluation
 * context shape, imported by both the API (server-side) and the web app (SSR + browser islands)
 * so that OpenFeature targeting rules evaluate identically everywhere.
 */

/**
 * Canonical evaluation context. Built from the authenticated session in three places
 * (NestJS contextFactory, Astro middleware, browser `OpenFeature.setContext`) and kept in sync.
 */
export interface FlagEvaluationContext {
  /** Stable bucketing key for percentage rollouts — user id, or an anonymous/session id. */
  targetingKey?: string;
  email?: string;
  roles?: string[];
}

/** Flag key registry. Naming convention: `<domain>.<capability>`. */
export const FlagKeys = {
  /** Phase 0 demo flag — proves the OpenFeature round-trip across API + web. */
  DemoNewBanner: 'demo.new-banner',
  /** Slice 2a — surfaces auth entry points (sign-in, account) in the web app. */
  AuthEnabled: 'auth.enabled',
  /** Slice 2b — gates the admin authoring CMS (`/admin` content management). */
  AdminCms: 'admin.cms',
  /** Slice 2c — gates favorites (heart toggles + My favorites page). */
  Favorites: 'personalization.favorites',
  /** Phase 5 backlog — gates cloud-synced saved chord progressions (chord analyzer). */
  SavedProgressions: 'personalization.saved-progressions',
  /** Phase 2 — gates collections (courses / learning paths) browse + admin. */
  Collections: 'learning.collections',
  /** Collections Library — faceted discovery (search/facets/sort/shelves) on the collections index. */
  CollectionDiscovery: 'learning.collections-discovery',
  /** Collections Library — save/bookmark collections to a personal library (auth). */
  CollectionBookmarks: 'learning.collections-bookmarks',
  /** Collections Library — 1..5 collection ratings + popularity shelves (auth to rate). */
  CollectionRatings: 'learning.collections-ratings',
  /** Collections Library — user-created collections (build your own, public/private). */
  UserCollections: 'learning.user-collections',
  /** Phase 2 — gates progress tracking (completion, streaks, dashboard). */
  Progress: 'learning.progress',
  /** Phase 5 backlog — logs active tool usage as practice time (feeds the progress dashboard). */
  ToolPractice: 'learning.tool-practice',
  /** Phase 2 — gates the Info View contextual helper (help topics on hover/focus). */
  InfoView: 'learning.info-view',
  /** Interactive score player — click/seek/A–B loop/scrub/metronome (ADR 0026); off = basic play/stop. */
  InteractiveScores: 'learning.interactive-scores',
  /** Phase 3 — interactive piano keyboard tool. */
  ToolKeyboard: 'tools.keyboard',
  /** Phase 3 — circle of fifths explorer tool. */
  ToolCircleOfFifths: 'tools.circle-of-fifths',
  /** Phase 3 — interactive guitar fretboard tool. */
  ToolFretboard: 'tools.fretboard',
  /** Phase 3 — chord builder tool. */
  ToolChords: 'tools.chords',
  /** Phase 3 — scale explorer tool. */
  ToolScaleExplorer: 'tools.scale-explorer',
  /** Phase 3 — reverse chord identifier tool. */
  ToolChordId: 'tools.chord-id',
  /** Phase 3 — mode explorer tool. */
  ToolModes: 'tools.modes',
  /** Phase 3 — Roman-numeral progression builder tool. */
  ToolProgression: 'tools.progression',
  /** Phase 3 — metronome tool. */
  ToolMetronome: 'tools.metronome',
  /** Phase 3 — tuning reference tool. */
  ToolTuner: 'tools.tuner',
  /** Phase 3 — interval explorer tool. */
  ToolIntervals: 'tools.intervals',
  /** Phase 3 — staff-notation note reader tool. */
  ToolStaff: 'tools.staff',
  /** Phase 3 — interval ear-training quiz tool. */
  ToolEarTrainer: 'tools.ear-trainer',
  /** Phase 3 — beat sequencer tool. */
  ToolSequencer: 'tools.sequencer',
  /** Phase 4 — SRS trainers / drills. */
  Trainers: 'trainers.srs',
  /** Phase 4 — sight-reading generator tool. */
  ToolSightReading: 'tools.sight-reading',
  /** Phase 5 — play-along backing-track generator (progression × key × tempo). */
  ToolBackingTrack: 'tools.backing-track',
  /** Phase 5 — chord voicing library (close / inversions / drop-2/3 / shell). */
  ToolVoicings: 'tools.voicings',
  /** Phase 5 — notation-synced player (cursor highlight, tempo/loop/section). */
  ToolNotationPlayer: 'tools.notation-player',
  /** Phase 5 — lick & turnaround library (guitar tab + audio). */
  ToolLicks: 'tools.licks',
  /** Phase 5 — guitar chord-diagram library. */
  ToolChordDiagrams: 'tools.chord-diagrams',
  /** Phase 5 — strumming pattern trainer. */
  ToolStrumming: 'tools.strumming',
  /** Phase 5 — fingerpicking pattern trainer. */
  ToolFingerpicking: 'tools.fingerpicking',
  /** Phase 5 — arpeggio pattern player. */
  ToolArpeggio: 'tools.arpeggio',
  /** Phase 5 — chord-progression play-along (strum through a progression). */
  ToolProgressionPlayer: 'tools.progression-player',
  /** Phase 5 — rhythm reading trainer. */
  ToolRhythm: 'tools.rhythm',
  /** Phase 5 — CAGED system explorer. */
  ToolCaged: 'tools.caged',
  /** Phase 5 — scale-in-position boxes. */
  ToolScaleBoxes: 'tools.scale-boxes',
  /** Phase 5 — combined melody + chords song player. */
  ToolSong: 'tools.song',
  /** Phase 5 — chord-progression ear training. */
  ToolProgressionEar: 'tools.progression-ear',
  /** Phase 5 — chord-quality ear training. */
  ToolChordQualityEar: 'tools.chord-quality-ear',
  /** Phase 5 — fretboard note-naming quiz. */
  ToolFretQuiz: 'tools.fret-quiz',
  /** Phase 5 — MusicXML score import + playback. */
  ToolMusicXml: 'tools.musicxml',
  /** Phase 5 — multi-voice (stacked chord) staff engraving. */
  ToolMultiVoice: 'tools.multi-voice',
  /** Phase 5 — pitch-preserving time-stretch practice player. */
  ToolPracticePlayer: 'tools.practice-player',
  /** Phase 5 — Roman-numeral / functional chord analyzer. */
  ToolAnalyzer: 'tools.analyzer',
  /** Phase 5 — transposer + capo suggestions. */
  ToolTransposer: 'tools.transposer',
  /** Phase 5 — bass-line generator (roots / root-fifth / walking). */
  ToolBassline: 'tools.bassline',
  /** Phase 5 — melodic dictation (hear a melody, rebuild it). */
  ToolMelodicDictation: 'tools.melodic-dictation',
  /** Phase 5 — rhythm dictation (hear a rhythm, rebuild it). */
  ToolRhythmDictation: 'tools.rhythm-dictation',
  /** Phase 5 — drum-groove library. */
  ToolGrooves: 'tools.grooves',
  /** Phase 5 — sight-singing / solfège. */
  ToolSolfege: 'tools.solfege',
  /** Phase 5 — key-signature quiz. */
  ToolKeyQuiz: 'tools.key-quiz',
  /** Phase 5 — interval-construction quiz. */
  ToolIntervalQuiz: 'tools.interval-quiz',
  /** Phase 5 — combined practice room (jam station). */
  ToolPracticeRoom: 'tools.practice-room',
  /** Phase 5 — score playground: write alphaTex / import MusicXML, render + play via alphaTab (ADR 0027). */
  ToolScore: 'tools.score',
  /** Phase 5 — sampled General-MIDI instrument playback (smplr soundfonts). */
  ToolSoundfont: 'tools.soundfont',
  /** Expansion — improvisation guide: which scales fit a chord. */
  ToolImprovise: 'tools.improvise',
  /** Expansion — chord-progression generator: common progressions by style/key. */
  ToolProgressionGen: 'tools.progression-generator',
  /** Expansion — timed fretboard note-finding game. */
  ToolFretGame: 'tools.fret-game',
  /** Expansion — scale/chord heatmap across piano + guitar together. */
  ToolScaleMap: 'tools.scale-map',
  /** Expansion — timed staff note-reading game. */
  ToolStaffGame: 'tools.staff-game',
  /** Expansion — tap-the-rhythm timing game. */
  ToolRhythmGame: 'tools.rhythm-game',
  /** Expansion — chord voice-leading viewer. */
  ToolVoiceLeading: 'tools.voice-leading',
  /** Expansion — scale speed / tempo-ramp trainer. */
  ToolSpeedTrainer: 'tools.speed-trainer',
  /** Expansion — timed key-signature naming game. */
  ToolKeySigGame: 'tools.key-sig-game',
  /** Expansion — build + run a timed practice routine. */
  ToolPracticePlanner: 'tools.practice-planner',
  /** Phase 6 — premium entitlements gate `visibility=premium` content + the subscription flow. */
  Premium: 'monetization.premium',
  /** Phase 6 — teacher/classroom mode (create/join classrooms, grant premium to a class). */
  Classrooms: 'education.classrooms',
  /** i18n — enables `/zh` localized routing + the language switcher (English + 中文). */
  I18n: 'platform.i18n',
} as const;

export type FlagKey = (typeof FlagKeys)[keyof typeof FlagKeys];

/** Fallback values used when the flag provider is unreachable. */
export const FlagDefaults = {
  [FlagKeys.DemoNewBanner]: false,
  [FlagKeys.AuthEnabled]: true,
  [FlagKeys.AdminCms]: true,
  [FlagKeys.Favorites]: true,
  [FlagKeys.SavedProgressions]: true,
  [FlagKeys.Collections]: true,
  [FlagKeys.CollectionDiscovery]: true,
  [FlagKeys.CollectionBookmarks]: true,
  [FlagKeys.CollectionRatings]: true,
  [FlagKeys.UserCollections]: true,
  [FlagKeys.Progress]: true,
  [FlagKeys.InteractiveScores]: true,
  [FlagKeys.ToolPractice]: true,
  [FlagKeys.InfoView]: true,
  [FlagKeys.ToolKeyboard]: true,
  [FlagKeys.ToolCircleOfFifths]: true,
  [FlagKeys.ToolFretboard]: true,
  [FlagKeys.ToolChords]: true,
  [FlagKeys.ToolScaleExplorer]: true,
  [FlagKeys.ToolChordId]: true,
  [FlagKeys.ToolModes]: true,
  [FlagKeys.ToolProgression]: true,
  [FlagKeys.ToolMetronome]: true,
  [FlagKeys.ToolTuner]: true,
  [FlagKeys.ToolIntervals]: true,
  [FlagKeys.ToolStaff]: true,
  [FlagKeys.ToolEarTrainer]: true,
  [FlagKeys.ToolSequencer]: true,
  [FlagKeys.Trainers]: true,
  [FlagKeys.ToolSightReading]: true,
  [FlagKeys.ToolBackingTrack]: true,
  [FlagKeys.ToolVoicings]: true,
  [FlagKeys.ToolNotationPlayer]: true,
  [FlagKeys.ToolLicks]: true,
  [FlagKeys.ToolChordDiagrams]: true,
  [FlagKeys.ToolStrumming]: true,
  [FlagKeys.ToolFingerpicking]: true,
  [FlagKeys.ToolArpeggio]: true,
  [FlagKeys.ToolProgressionPlayer]: true,
  [FlagKeys.ToolRhythm]: true,
  [FlagKeys.ToolCaged]: true,
  [FlagKeys.ToolScaleBoxes]: true,
  [FlagKeys.ToolSong]: true,
  [FlagKeys.ToolProgressionEar]: true,
  [FlagKeys.ToolChordQualityEar]: true,
  [FlagKeys.ToolFretQuiz]: true,
  [FlagKeys.ToolMusicXml]: true,
  [FlagKeys.ToolMultiVoice]: true,
  [FlagKeys.ToolPracticePlayer]: true,
  [FlagKeys.ToolAnalyzer]: true,
  [FlagKeys.ToolTransposer]: true,
  [FlagKeys.ToolBassline]: true,
  [FlagKeys.ToolMelodicDictation]: true,
  [FlagKeys.ToolRhythmDictation]: true,
  [FlagKeys.ToolGrooves]: true,
  [FlagKeys.ToolSolfege]: true,
  [FlagKeys.ToolKeyQuiz]: true,
  [FlagKeys.ToolIntervalQuiz]: true,
  [FlagKeys.ToolPracticeRoom]: true,
  [FlagKeys.ToolScore]: true,
  [FlagKeys.ToolSoundfont]: true,
  [FlagKeys.ToolImprovise]: true,
  [FlagKeys.ToolProgressionGen]: true,
  [FlagKeys.ToolFretGame]: true,
  [FlagKeys.ToolScaleMap]: true,
  [FlagKeys.ToolStaffGame]: true,
  [FlagKeys.ToolRhythmGame]: true,
  [FlagKeys.ToolVoiceLeading]: true,
  [FlagKeys.ToolSpeedTrainer]: true,
  [FlagKeys.ToolKeySigGame]: true,
  [FlagKeys.ToolPracticePlanner]: true,
  [FlagKeys.Premium]: true,
  [FlagKeys.Classrooms]: true,
  [FlagKeys.I18n]: true,
} satisfies Record<FlagKey, boolean>;
