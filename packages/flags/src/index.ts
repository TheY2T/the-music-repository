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
  /** Demo flag — proves the OpenFeature round-trip across API + web. */
  DemoNewBanner: 'demo.new-banner',
  /** Slice 2a — surfaces auth entry points (sign-in, account) in the web app. */
  AuthEnabled: 'auth.enabled',
  /** Surfaces the public self-service sign-up page + the "create an account" link. */
  AuthSignup: 'auth.signup',
  /** Surfaces the social sign-in buttons (Google/Facebook) on the sign-in + sign-up forms. */
  AuthSocial: 'auth.social',
  /** Slice 2b — gates the admin authoring CMS (`/admin` content management). */
  AdminCms: 'admin.cms',
  /** WYSIWYG block editor (ADR 0030) — swaps the Markdown textarea for the TipTap editor in the CMS. */
  BlockEditor: 'admin.block-editor',
  /** Block editor live preview (ADR 0030) — side-by-side iframe rendering the real page components. */
  BlockEditorPreview: 'admin.block-editor-preview',
  /** Content revisions (ADR 0030) — autosave + publish snapshots with a restore history panel. */
  ContentRevisions: 'admin.content-revisions',
  /** Slice 2c — gates favorites (heart toggles + My favorites page). */
  Favorites: 'personalization.favorites',
  /** Gates cloud-synced saved chord progressions (chord analyzer). */
  SavedProgressions: 'personalization.saved-progressions',
  /** Catalogue redesign (ADR 0031) — curated-shelf hub + axis switcher + level facet/sort; off = flat grid. */
  CatalogueHub: 'catalogue.hub',
  /** Signed-in learner dashboard (ADR 0031) — continue / recommended / saved (at /dashboard). */
  LearnerDashboard: 'learning.dashboard',
  /** Per-space animated PixiJS background in the dashboard builder (style picker + intensity). */
  DashboardBackground: 'personalization.dashboard-background',
  /** Gamification (ADR 0045) — persisted XP + badges, shown in the dashboard achievements widget. */
  Achievements: 'learning.achievements',
  /** Gates collections (courses / learning paths) browse + admin. */
  Collections: 'learning.collections',
  /** Collections Library — faceted discovery (search/facets/sort/shelves) on the collections index. */
  CollectionDiscovery: 'learning.collections-discovery',
  /** Collections Library — curated-shelf hub + axis switcher (mirrors catalogue.hub); off = faceted grid. */
  CollectionsHub: 'learning.collections-hub',
  /** Collections Library — save/bookmark collections to a personal library (auth). */
  CollectionBookmarks: 'learning.collections-bookmarks',
  /** Collections Library — 1..5 collection ratings + popularity shelves (auth to rate). */
  CollectionRatings: 'learning.collections-ratings',
  /** Collections Library — user-created collections (build your own, public/private). */
  UserCollections: 'learning.user-collections',
  /** Gates progress tracking (completion, streaks, dashboard). */
  Progress: 'learning.progress',
  /** Logs active tool usage as practice time (feeds the progress dashboard). */
  ToolPractice: 'learning.tool-practice',
  /** Gates the Info View contextual helper (help topics on hover/focus). */
  InfoView: 'learning.info-view',
  /** Interactive score player — click/seek/A–B loop/scrub/metronome (ADR 0026); off = basic play/stop. */
  InteractiveScores: 'learning.interactive-scores',
  /** Immersive instrument controls (ADR 0044) — fullscreen, instrument skins, and guitar
   *  left/right handedness on the piano & guitar tools; persists per-user. Off = fixed single view. */
  InstrumentCustomization: 'learning.instrument-customization',
  /** Interactive piano keyboard tool. */
  ToolKeyboard: 'tools.keyboard',
  /** Circle of fifths explorer tool. */
  ToolCircleOfFifths: 'tools.circle-of-fifths',
  /** Interactive guitar fretboard tool. */
  ToolFretboard: 'tools.fretboard',
  /** Chord builder tool. */
  ToolChords: 'tools.chords',
  /** Scale explorer tool. */
  ToolScaleExplorer: 'tools.scale-explorer',
  /** Reverse chord identifier tool. */
  ToolChordId: 'tools.chord-id',
  /** Mode explorer tool. */
  ToolModes: 'tools.modes',
  /** Roman-numeral progression builder tool. */
  ToolProgression: 'tools.progression',
  /** Metronome tool. */
  ToolMetronome: 'tools.metronome',
  /** Tuning reference tool. */
  ToolTuner: 'tools.tuner',
  /** Interval explorer tool. */
  ToolIntervals: 'tools.intervals',
  /** Staff-notation note reader tool. */
  ToolStaff: 'tools.staff',
  /** Interval ear-training quiz tool. */
  ToolEarTrainer: 'tools.ear-trainer',
  /** Beat sequencer tool. */
  ToolSequencer: 'tools.sequencer',
  /** SRS trainers / drills. */
  Trainers: 'trainers.srs',
  /** Drill engine — objective answer-checking + per-skill mastery. */
  DrillEngine: 'trainers.drill-engine',
  /** Drill engine — on-screen celebration/reward mechanics (score-pop, combo, confetti, level-up). */
  DrillCelebrations: 'trainers.celebrations',
  /** Drill engine — play-on-instrument answer modality (keyboard/fretboard/MIDI). */
  DrillPlay: 'trainers.play-instrument',
  /** Drill engine — ear-then-identify answer modality (progressions/cadences/functional degrees). */
  DrillEar: 'trainers.ear',
  /** Drill engine — pitch/mic (sing or play acoustic) answer modality. */
  DrillPitch: 'trainers.pitch-mic',
  /** Drill engine — rhythm-tap (tap in time) answer modality. */
  DrillRhythm: 'trainers.rhythm-tap',
  /** Sight-reading generator tool. */
  ToolSightReading: 'tools.sight-reading',
  /** Play-along backing-track generator (progression × key × tempo). */
  ToolBackingTrack: 'tools.backing-track',
  /** Chord voicing library (close / inversions / drop-2/3 / shell). */
  ToolVoicings: 'tools.voicings',
  /** Notation-synced player (cursor highlight, tempo/loop/section). */
  ToolNotationPlayer: 'tools.notation-player',
  /** Lick & turnaround library (guitar tab + audio). */
  ToolLicks: 'tools.licks',
  /** Guitar chord-diagram library. */
  ToolChordDiagrams: 'tools.chord-diagrams',
  /** Browsable chord dictionary — every root × quality × voicing for guitar/ukulele/bass/piano. */
  ToolChordDictionary: 'tools.chord-dictionary',
  /** Strumming pattern trainer. */
  ToolStrumming: 'tools.strumming',
  /** Fingerpicking pattern trainer. */
  ToolFingerpicking: 'tools.fingerpicking',
  /** Arpeggio pattern player. */
  ToolArpeggio: 'tools.arpeggio',
  /** Chord-progression play-along (strum through a progression). */
  ToolProgressionPlayer: 'tools.progression-player',
  /** Rhythm reading trainer. */
  ToolRhythm: 'tools.rhythm',
  /** CAGED system explorer. */
  ToolCaged: 'tools.caged',
  /** Scale-in-position boxes. */
  ToolScaleBoxes: 'tools.scale-boxes',
  /** Combined melody + chords song player. */
  ToolSong: 'tools.song',
  /** Chord-progression ear training. */
  ToolProgressionEar: 'tools.progression-ear',
  /** Chord-quality ear training. */
  ToolChordQualityEar: 'tools.chord-quality-ear',
  /** Fretboard note-naming quiz. */
  ToolFretQuiz: 'tools.fret-quiz',
  /** MusicXML score import + playback. */
  ToolMusicXml: 'tools.musicxml',
  /** Multi-voice (stacked chord) staff engraving. */
  ToolMultiVoice: 'tools.multi-voice',
  /** Pitch-preserving time-stretch practice player. */
  ToolPracticePlayer: 'tools.practice-player',
  /** Roman-numeral / functional chord analyzer. */
  ToolAnalyzer: 'tools.analyzer',
  /** Transposer + capo suggestions. */
  ToolTransposer: 'tools.transposer',
  /** Bass-line generator (roots / root-fifth / walking). */
  ToolBassline: 'tools.bassline',
  /** Melodic dictation (hear a melody, rebuild it). */
  ToolMelodicDictation: 'tools.melodic-dictation',
  /** Rhythm dictation (hear a rhythm, rebuild it). */
  ToolRhythmDictation: 'tools.rhythm-dictation',
  /** Drum-groove library. */
  ToolGrooves: 'tools.grooves',
  /** Sight-singing / solfège. */
  ToolSolfege: 'tools.solfege',
  /** Key-signature quiz. */
  ToolKeyQuiz: 'tools.key-quiz',
  /** Interval-construction quiz. */
  ToolIntervalQuiz: 'tools.interval-quiz',
  /** Combined practice room (jam station). */
  ToolPracticeRoom: 'tools.practice-room',
  /** Score playground: write alphaTex / import MusicXML, render + play via alphaTab (ADR 0027). */
  ToolScore: 'tools.score',
  /** Sampled General-MIDI instrument playback (smplr soundfonts). */
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
  /** Premium entitlements gate `visibility=premium` content + the subscription flow.
   * OFF (default) = everything is free/public-domain and nothing is locked. Turn on only once
   * monetized content actually exists. */
  Premium: 'monetization.premium',
  /** Monetization *messaging* — any user-facing mention of premium / unlocking / paid content
   * (premium badges, "upgrade to unlock" panels, the Premium nav link + upgrade CTAs). OFF (default)
   * = the app never references paid content. Separate from {@link Premium} so the entitlement engine
   * and the marketing copy can be rolled out independently. */
  MonetizationMessaging: 'monetization.messaging',
  /** Teacher/classroom mode (create/join classrooms, grant premium to a class). */
  Classrooms: 'education.classrooms',
  /** Ko-fi "Support" surface — the /support page + the footer/header support links. Independent of
   * the premium engine: supporters tip via Ko-fi, which unlocks nothing. */
  Support: 'support.kofi',
  /** FAQ — the public /faq page (question/answer entries grouped by category) + its footer link and
   * the /admin/faq authoring surface. */
  ContentFaq: 'content.faq',
  /** i18n — enables `/zh` localized routing + the language switcher (English + 中文). */
  I18n: 'platform.i18n',
  /** Localization CMS (ADR 0034) — gates the admin surface for editing DB-backed UI message strings. */
  LocaleStrings: 'admin.locale-strings',
  /** Feature-flag admin (ADR 0035) — gates `/admin/feature-flags` (flag CRUD + per-env targeting).
   *  Defaults ON; the CMS refuses to disable it in the resolved environment (self-lockout guardrail). */
  FeatureFlags: 'admin.feature-flags',
  /** Feedback (ADR 0041) — the /feedback page + footer link, the submit endpoint, and the
   *  /admin/feedback triage surface. The baseline of the feedback area. */
  FeedbackForm: 'feedback.form',
  /** Feedback (ADR 0041) — the global floating launcher button rendered on every page. */
  FeedbackLauncher: 'feedback.launcher',
  /** Feedback (ADR 0041) — the "bug" submission type plus page/user-agent context capture. */
  FeedbackBugs: 'feedback.bugs',
  /** Feedback (ADR 0041) — the in-app Net Promoter Score prompt (logged-in learners), the NPS
   *  endpoints, and the admin NPS analytics dashboard. */
  FeedbackNps: 'feedback.nps',
  /** Feedback (ADR 0041) — the public /roadmap voting board (upvote + status) over submissions an
   *  admin has marked public, and the vote endpoints. */
  FeedbackBoard: 'feedback.board',
} as const;

export type FlagKey = (typeof FlagKeys)[keyof typeof FlagKeys];

/** Fallback values used when the flag provider is unreachable. */
export const FlagDefaults = {
  [FlagKeys.DemoNewBanner]: false,
  [FlagKeys.AuthEnabled]: true,
  [FlagKeys.AuthSignup]: true,
  [FlagKeys.AuthSocial]: false,
  [FlagKeys.AdminCms]: true,
  [FlagKeys.BlockEditor]: true,
  [FlagKeys.BlockEditorPreview]: true,
  [FlagKeys.ContentRevisions]: true,
  [FlagKeys.Favorites]: true,
  [FlagKeys.SavedProgressions]: true,
  [FlagKeys.CatalogueHub]: true,
  [FlagKeys.LearnerDashboard]: true,
  [FlagKeys.DashboardBackground]: true,
  [FlagKeys.Achievements]: false,
  [FlagKeys.Collections]: true,
  [FlagKeys.CollectionDiscovery]: true,
  [FlagKeys.CollectionsHub]: true,
  [FlagKeys.CollectionBookmarks]: true,
  [FlagKeys.CollectionRatings]: true,
  [FlagKeys.UserCollections]: true,
  [FlagKeys.Progress]: true,
  [FlagKeys.InteractiveScores]: true,
  [FlagKeys.InstrumentCustomization]: false,
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
  [FlagKeys.DrillEngine]: true,
  [FlagKeys.DrillCelebrations]: true,
  [FlagKeys.DrillPlay]: true,
  [FlagKeys.DrillEar]: true,
  [FlagKeys.DrillPitch]: true,
  [FlagKeys.DrillRhythm]: true,
  [FlagKeys.ToolSightReading]: true,
  [FlagKeys.ToolBackingTrack]: true,
  [FlagKeys.ToolVoicings]: true,
  [FlagKeys.ToolNotationPlayer]: true,
  [FlagKeys.ToolLicks]: true,
  [FlagKeys.ToolChordDiagrams]: true,
  [FlagKeys.ToolChordDictionary]: true,
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
  // Monetization is deferred — everything ships free until premium content is built.
  [FlagKeys.Premium]: false,
  [FlagKeys.MonetizationMessaging]: false,
  [FlagKeys.Classrooms]: true,
  [FlagKeys.Support]: true,
  [FlagKeys.ContentFaq]: true,
  [FlagKeys.I18n]: true,
  [FlagKeys.LocaleStrings]: true,
  [FlagKeys.FeatureFlags]: true,
  // The general feedback form ships on; the other feedback surfaces stay off until reviewed per-env.
  [FlagKeys.FeedbackForm]: true,
  [FlagKeys.FeedbackLauncher]: false,
  [FlagKeys.FeedbackBugs]: false,
  [FlagKeys.FeedbackNps]: false,
  [FlagKeys.FeedbackBoard]: false,
} satisfies Record<FlagKey, boolean>;

/**
 * Authored targeting rules for the flag seed (ADR 0035). Keyed by flag key; the value is a JSONLogic rule
 * (see `@TheY2T/tmr-flags-eval`). Only flags with a non-trivial rollout appear here — everything else seeds
 * as a plain per-environment on/off. The seeder copies these into `feature_flag_settings.targeting`.
 */
export const FlagTargeting: Partial<Record<FlagKey, Record<string, unknown>>> = {
  // beta role → on; everyone else → a 10% rollout bucketed by targeting key.
  [FlagKeys.DemoNewBanner]: {
    if: [
      { in: ['beta', { var: 'roles' }] },
      'on',
      {
        fractional: [
          ['on', 10],
          ['off', 90],
        ],
      },
    ],
  },
};
