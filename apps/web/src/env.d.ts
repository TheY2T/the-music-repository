/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    /** Feature-flag values evaluated once per request in middleware (see src/middleware.ts). */
    flags: {
      demoNewBanner: boolean;
      authEnabled: boolean;
      adminCms: boolean;
      blockEditor: boolean;
      blockEditorPreview: boolean;
      contentRevisions: boolean;
      favorites: boolean;
      savedProgressions: boolean;
      catalogueHub: boolean;
      collections: boolean;
      collectionDiscovery: boolean;
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
      classrooms: boolean;
      i18nEnabled: boolean;
    };
    /** Active locale resolved per request (URL prefix > cookie > Accept-Language > default). */
    locale: 'en' | 'zh-Hans';
    /** Authenticated user resolved per request from the API session, or null when anonymous. */
    user: {
      id: string;
      email: string;
      name: string;
      role: string | null;
    } | null;
  }
}

interface ImportMetaEnv {
  readonly PUBLIC_API_BASE_URL?: string;
  readonly PUBLIC_OFREP_BASE_URL?: string;
  readonly FLAGD_HOST?: string;
  readonly FLAGD_PORT?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
