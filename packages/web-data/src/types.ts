// Shared shell types for the web data seam. The Astro app derives its `App.Locals` from these
// (apps/web/src/env.d.ts) so middleware, nav, and smart components stay in sync on one source.

export type Locale = 'en' | 'zh-Hans';

/** Feature-flag values evaluated once per request in the web middleware (see apps/web/src/middleware.ts). */
export interface Flags {
  demoNewBanner: boolean;
  authEnabled: boolean;
  adminCms: boolean;
  blockEditor: boolean;
  blockEditorPreview: boolean;
  contentRevisions: boolean;
  favorites: boolean;
  savedProgressions: boolean;
  catalogueHub: boolean;
  learnerDashboard: boolean;
  dashboardBackground: boolean;
  collections: boolean;
  collectionDiscovery: boolean;
  collectionsHub: boolean;
  collectionBookmarks: boolean;
  collectionRatings: boolean;
  userCollections: boolean;
  progress: boolean;
  toolPractice: boolean;
  infoView: boolean;
  interactiveScores: boolean;
  toolKeyboard: boolean;
  toolCircleOfFifths: boolean;
  toolFretboard: boolean;
  toolChords: boolean;
  toolScaleExplorer: boolean;
  toolChordId: boolean;
  toolModes: boolean;
  toolProgression: boolean;
  toolMetronome: boolean;
  toolTuner: boolean;
  toolIntervals: boolean;
  toolStaff: boolean;
  toolEarTrainer: boolean;
  toolSequencer: boolean;
  trainers: boolean;
  toolSightReading: boolean;
  toolBackingTrack: boolean;
  toolVoicings: boolean;
  toolNotationPlayer: boolean;
  toolLicks: boolean;
  toolChordDiagrams: boolean;
  toolStrumming: boolean;
  toolFingerpicking: boolean;
  toolArpeggio: boolean;
  toolProgressionPlayer: boolean;
  toolRhythm: boolean;
  toolCaged: boolean;
  toolScaleBoxes: boolean;
  toolSong: boolean;
  toolProgressionEar: boolean;
  toolChordQualityEar: boolean;
  toolFretQuiz: boolean;
  toolMusicXml: boolean;
  toolMultiVoice: boolean;
  toolPracticePlayer: boolean;
  toolAnalyzer: boolean;
  toolTransposer: boolean;
  toolImprovise: boolean;
  toolProgressionGen: boolean;
  toolFretGame: boolean;
  toolScaleMap: boolean;
  toolStaffGame: boolean;
  toolRhythmGame: boolean;
  toolVoiceLeading: boolean;
  toolSpeedTrainer: boolean;
  toolKeySigGame: boolean;
  toolPracticePlanner: boolean;
  toolBassline: boolean;
  toolMelodicDictation: boolean;
  toolRhythmDictation: boolean;
  toolGrooves: boolean;
  toolSolfege: boolean;
  toolKeyQuiz: boolean;
  toolIntervalQuiz: boolean;
  toolPracticeRoom: boolean;
  toolScore: boolean;
  toolSoundfont: boolean;
  premium: boolean;
  monetizationMessaging: boolean;
  classrooms: boolean;
  i18nEnabled: boolean;
}

/** Authenticated user resolved per request from the API session, or null when anonymous. */
export type User = {
  id: string;
  email: string;
  name: string;
  role: string | null;
} | null;
