import { FlagDefaults, FlagKeys } from '@TheY2T/tmr-flags';
import {
  DEFAULT_LOCALE,
  localePrefix,
  localizedPath,
  preferredLocale,
  splitLocalePath,
} from '@TheY2T/tmr-i18n';
import { defineMiddleware } from 'astro:middleware';
import { FlagdProvider } from '@openfeature/flagd-provider';
import { type Logger, OpenFeature } from '@openfeature/server-sdk';

const FLAGD_HOST = process.env.FLAGD_HOST ?? 'localhost';
const FLAGD_PORT = Number(process.env.FLAGD_PORT ?? 8013);
const CONNECTION_ERROR = /deadline|connect|unavailable|initialization/i;

// SSR runs on the server, so it needs a server-reachable API origin. In a container that's the compose
// service name (`http://api:3000`), NOT the browser's host-published `PUBLIC_API_BASE_URL`
// (`http://localhost:3000`) — which inside the web container points at the web container itself. Prefer
// the server-only `API_INTERNAL_URL`; fall back to the public URL for local dev where SSR runs on the host.
const API_BASE =
  process.env.API_INTERNAL_URL ?? process.env.PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

/**
 * Resolve the session server-side by forwarding the request's cookies to the API's Better Auth
 * `get-session`. Returns null for anonymous requests. The gate this feeds (`/admin`) is UX-only —
 * the API re-authorizes every mutation.
 */
async function resolveSessionUser(cookie: string): Promise<App.Locals['user']> {
  // Cheap short-circuit: no Better Auth cookie → definitely anonymous, skip the network hop.
  if (!cookie.includes('better-auth')) {
    return null;
  }
  try {
    const response = await fetch(`${API_BASE}/api/auth/get-session`, { headers: { cookie } });
    if (!response.ok) {
      return null;
    }
    const data = (await response.json()) as {
      user?: { id: string; email: string; name?: string; role?: string | null };
    } | null;
    if (!data?.user) {
      return null;
    }
    const { id, email, name, role } = data.user;
    return { id, email, name: name ?? '', role: role ?? null };
  } catch {
    // API unreachable → treat as anonymous rather than failing the page render.
    return null;
  }
}

/** Replaces flagd's noisy connection stack traces with a single actionable hint. */
function createFlagdLogger(endpoint: string): Logger {
  let hintShown = false;
  const describe = (arg: unknown) => (arg instanceof Error ? arg.message : String(arg));
  return {
    error(...args: unknown[]) {
      if (args.some((arg) => CONNECTION_ERROR.test(describe(arg)))) {
        if (!hintShown) {
          hintShown = true;
          console.warn(
            `[flags] Could not reach flagd at ${endpoint} — flags will use their default values. ` +
              'Start the infrastructure first: `pnpm infra:up`.',
          );
        }
        return;
      }
      console.error('[flags]', ...args);
    },
    warn: (...args: unknown[]) => console.warn('[flags]', ...args),
    info: () => {},
    debug: () => {},
  };
}

// Set the OpenFeature provider once for the SSR process. Phase 3 can add live client sync;
// Phase 1 will build the per-request evaluation context from the authenticated session.
let providerConfigured = false;
function ensureProvider(): void {
  if (providerConfigured) {
    return;
  }
  providerConfigured = true;
  OpenFeature.setLogger(createFlagdLogger(`${FLAGD_HOST}:${FLAGD_PORT}`));
  OpenFeature.setProvider(
    new FlagdProvider({ host: FLAGD_HOST, port: FLAGD_PORT, resolverType: 'rpc', deadlineMs: 500 }),
  );
}

export const onRequest = defineMiddleware(async (context, next) => {
  ensureProvider();
  const client = OpenFeature.getClient();

  const demoNewBanner = await client.getBooleanValue(
    FlagKeys.DemoNewBanner,
    FlagDefaults[FlagKeys.DemoNewBanner],
  );
  const authEnabled = await client.getBooleanValue(
    FlagKeys.AuthEnabled,
    FlagDefaults[FlagKeys.AuthEnabled],
  );
  const adminCms = await client.getBooleanValue(FlagKeys.AdminCms, FlagDefaults[FlagKeys.AdminCms]);
  const favorites = await client.getBooleanValue(
    FlagKeys.Favorites,
    FlagDefaults[FlagKeys.Favorites],
  );
  const savedProgressions = await client.getBooleanValue(
    FlagKeys.SavedProgressions,
    FlagDefaults[FlagKeys.SavedProgressions],
  );
  const toolPractice = await client.getBooleanValue(
    FlagKeys.ToolPractice,
    FlagDefaults[FlagKeys.ToolPractice],
  );
  const collections = await client.getBooleanValue(
    FlagKeys.Collections,
    FlagDefaults[FlagKeys.Collections],
  );
  const collectionDiscovery = await client.getBooleanValue(
    FlagKeys.CollectionDiscovery,
    FlagDefaults[FlagKeys.CollectionDiscovery],
  );
  const collectionBookmarks = await client.getBooleanValue(
    FlagKeys.CollectionBookmarks,
    FlagDefaults[FlagKeys.CollectionBookmarks],
  );
  const collectionRatings = await client.getBooleanValue(
    FlagKeys.CollectionRatings,
    FlagDefaults[FlagKeys.CollectionRatings],
  );
  const userCollections = await client.getBooleanValue(
    FlagKeys.UserCollections,
    FlagDefaults[FlagKeys.UserCollections],
  );
  const progress = await client.getBooleanValue(FlagKeys.Progress, FlagDefaults[FlagKeys.Progress]);
  const infoView = await client.getBooleanValue(FlagKeys.InfoView, FlagDefaults[FlagKeys.InfoView]);
  const toolKeyboard = await client.getBooleanValue(
    FlagKeys.ToolKeyboard,
    FlagDefaults[FlagKeys.ToolKeyboard],
  );
  const toolCircleOfFifths = await client.getBooleanValue(
    FlagKeys.ToolCircleOfFifths,
    FlagDefaults[FlagKeys.ToolCircleOfFifths],
  );
  const toolFretboard = await client.getBooleanValue(
    FlagKeys.ToolFretboard,
    FlagDefaults[FlagKeys.ToolFretboard],
  );
  const toolChords = await client.getBooleanValue(
    FlagKeys.ToolChords,
    FlagDefaults[FlagKeys.ToolChords],
  );
  const toolScaleExplorer = await client.getBooleanValue(
    FlagKeys.ToolScaleExplorer,
    FlagDefaults[FlagKeys.ToolScaleExplorer],
  );
  const toolChordId = await client.getBooleanValue(
    FlagKeys.ToolChordId,
    FlagDefaults[FlagKeys.ToolChordId],
  );
  const toolModes = await client.getBooleanValue(
    FlagKeys.ToolModes,
    FlagDefaults[FlagKeys.ToolModes],
  );
  const toolProgression = await client.getBooleanValue(
    FlagKeys.ToolProgression,
    FlagDefaults[FlagKeys.ToolProgression],
  );
  const toolMetronome = await client.getBooleanValue(
    FlagKeys.ToolMetronome,
    FlagDefaults[FlagKeys.ToolMetronome],
  );
  const toolTuner = await client.getBooleanValue(
    FlagKeys.ToolTuner,
    FlagDefaults[FlagKeys.ToolTuner],
  );
  const toolIntervals = await client.getBooleanValue(
    FlagKeys.ToolIntervals,
    FlagDefaults[FlagKeys.ToolIntervals],
  );
  const toolStaff = await client.getBooleanValue(
    FlagKeys.ToolStaff,
    FlagDefaults[FlagKeys.ToolStaff],
  );
  const toolEarTrainer = await client.getBooleanValue(
    FlagKeys.ToolEarTrainer,
    FlagDefaults[FlagKeys.ToolEarTrainer],
  );
  const toolSequencer = await client.getBooleanValue(
    FlagKeys.ToolSequencer,
    FlagDefaults[FlagKeys.ToolSequencer],
  );
  const trainers = await client.getBooleanValue(FlagKeys.Trainers, FlagDefaults[FlagKeys.Trainers]);
  const toolSightReading = await client.getBooleanValue(
    FlagKeys.ToolSightReading,
    FlagDefaults[FlagKeys.ToolSightReading],
  );
  const toolBackingTrack = await client.getBooleanValue(
    FlagKeys.ToolBackingTrack,
    FlagDefaults[FlagKeys.ToolBackingTrack],
  );
  const toolVoicings = await client.getBooleanValue(
    FlagKeys.ToolVoicings,
    FlagDefaults[FlagKeys.ToolVoicings],
  );
  const toolNotationPlayer = await client.getBooleanValue(
    FlagKeys.ToolNotationPlayer,
    FlagDefaults[FlagKeys.ToolNotationPlayer],
  );
  const toolLicks = await client.getBooleanValue(
    FlagKeys.ToolLicks,
    FlagDefaults[FlagKeys.ToolLicks],
  );
  const toolChordDiagrams = await client.getBooleanValue(
    FlagKeys.ToolChordDiagrams,
    FlagDefaults[FlagKeys.ToolChordDiagrams],
  );
  const toolStrumming = await client.getBooleanValue(
    FlagKeys.ToolStrumming,
    FlagDefaults[FlagKeys.ToolStrumming],
  );
  const toolFingerpicking = await client.getBooleanValue(
    FlagKeys.ToolFingerpicking,
    FlagDefaults[FlagKeys.ToolFingerpicking],
  );
  const toolArpeggio = await client.getBooleanValue(
    FlagKeys.ToolArpeggio,
    FlagDefaults[FlagKeys.ToolArpeggio],
  );
  const toolProgressionPlayer = await client.getBooleanValue(
    FlagKeys.ToolProgressionPlayer,
    FlagDefaults[FlagKeys.ToolProgressionPlayer],
  );
  const toolRhythm = await client.getBooleanValue(
    FlagKeys.ToolRhythm,
    FlagDefaults[FlagKeys.ToolRhythm],
  );
  const toolCaged = await client.getBooleanValue(
    FlagKeys.ToolCaged,
    FlagDefaults[FlagKeys.ToolCaged],
  );
  const toolScaleBoxes = await client.getBooleanValue(
    FlagKeys.ToolScaleBoxes,
    FlagDefaults[FlagKeys.ToolScaleBoxes],
  );
  const toolSong = await client.getBooleanValue(FlagKeys.ToolSong, FlagDefaults[FlagKeys.ToolSong]);
  const toolProgressionEar = await client.getBooleanValue(
    FlagKeys.ToolProgressionEar,
    FlagDefaults[FlagKeys.ToolProgressionEar],
  );
  const toolChordQualityEar = await client.getBooleanValue(
    FlagKeys.ToolChordQualityEar,
    FlagDefaults[FlagKeys.ToolChordQualityEar],
  );
  const toolFretQuiz = await client.getBooleanValue(
    FlagKeys.ToolFretQuiz,
    FlagDefaults[FlagKeys.ToolFretQuiz],
  );
  const toolMusicXml = await client.getBooleanValue(
    FlagKeys.ToolMusicXml,
    FlagDefaults[FlagKeys.ToolMusicXml],
  );
  const toolMultiVoice = await client.getBooleanValue(
    FlagKeys.ToolMultiVoice,
    FlagDefaults[FlagKeys.ToolMultiVoice],
  );
  const toolPracticePlayer = await client.getBooleanValue(
    FlagKeys.ToolPracticePlayer,
    FlagDefaults[FlagKeys.ToolPracticePlayer],
  );
  const toolAnalyzer = await client.getBooleanValue(
    FlagKeys.ToolAnalyzer,
    FlagDefaults[FlagKeys.ToolAnalyzer],
  );
  const toolTransposer = await client.getBooleanValue(
    FlagKeys.ToolTransposer,
    FlagDefaults[FlagKeys.ToolTransposer],
  );
  const toolBassline = await client.getBooleanValue(
    FlagKeys.ToolBassline,
    FlagDefaults[FlagKeys.ToolBassline],
  );
  const toolMelodicDictation = await client.getBooleanValue(
    FlagKeys.ToolMelodicDictation,
    FlagDefaults[FlagKeys.ToolMelodicDictation],
  );
  const toolRhythmDictation = await client.getBooleanValue(
    FlagKeys.ToolRhythmDictation,
    FlagDefaults[FlagKeys.ToolRhythmDictation],
  );
  const toolGrooves = await client.getBooleanValue(
    FlagKeys.ToolGrooves,
    FlagDefaults[FlagKeys.ToolGrooves],
  );
  const toolSolfege = await client.getBooleanValue(
    FlagKeys.ToolSolfege,
    FlagDefaults[FlagKeys.ToolSolfege],
  );
  const toolKeyQuiz = await client.getBooleanValue(
    FlagKeys.ToolKeyQuiz,
    FlagDefaults[FlagKeys.ToolKeyQuiz],
  );
  const toolIntervalQuiz = await client.getBooleanValue(
    FlagKeys.ToolIntervalQuiz,
    FlagDefaults[FlagKeys.ToolIntervalQuiz],
  );
  const toolPracticeRoom = await client.getBooleanValue(
    FlagKeys.ToolPracticeRoom,
    FlagDefaults[FlagKeys.ToolPracticeRoom],
  );
  const toolScore = await client.getBooleanValue(
    FlagKeys.ToolScore,
    FlagDefaults[FlagKeys.ToolScore],
  );
  const toolSoundfont = await client.getBooleanValue(
    FlagKeys.ToolSoundfont,
    FlagDefaults[FlagKeys.ToolSoundfont],
  );
  const premium = await client.getBooleanValue(FlagKeys.Premium, FlagDefaults[FlagKeys.Premium]);
  const classrooms = await client.getBooleanValue(
    FlagKeys.Classrooms,
    FlagDefaults[FlagKeys.Classrooms],
  );
  const i18nEnabled = await client.getBooleanValue(FlagKeys.I18n, FlagDefaults[FlagKeys.I18n]);

  context.locals.flags = {
    demoNewBanner,
    authEnabled,
    adminCms,
    favorites,
    savedProgressions,
    toolPractice,
    collections,
    collectionDiscovery,
    collectionBookmarks,
    collectionRatings,
    userCollections,
    progress,
    infoView,
    toolKeyboard,
    toolCircleOfFifths,
    toolFretboard,
    toolChords,
    toolScaleExplorer,
    toolChordId,
    toolModes,
    toolProgression,
    toolMetronome,
    toolTuner,
    toolIntervals,
    toolStaff,
    toolEarTrainer,
    toolSequencer,
    trainers,
    toolSightReading,
    toolBackingTrack,
    toolVoicings,
    toolNotationPlayer,
    toolLicks,
    toolChordDiagrams,
    toolStrumming,
    toolFingerpicking,
    toolArpeggio,
    toolProgressionPlayer,
    toolRhythm,
    toolCaged,
    toolScaleBoxes,
    toolSong,
    toolProgressionEar,
    toolChordQualityEar,
    toolFretQuiz,
    toolMusicXml,
    toolMultiVoice,
    toolPracticePlayer,
    toolAnalyzer,
    toolTransposer,
    toolBassline,
    toolMelodicDictation,
    toolRhythmDictation,
    toolGrooves,
    toolSolfege,
    toolKeyQuiz,
    toolIntervalQuiz,
    toolPracticeRoom,
    toolScore,
    toolSoundfont,
    premium,
    classrooms,
    i18nEnabled,
  };

  // Locale resolution + URL-prefix routing. One set of page files serves every locale: a `/zh/…`
  // request is rewritten to its canonical (un-prefixed) path while the browser URL is left unchanged,
  // and the page/islands read `Astro.locals.locale`. See @TheY2T/tmr-i18n + docs/features/i18n.md.
  const url = new URL(context.request.url);
  const { locale: urlLocale, path: canonicalPath } = splitLocalePath(url.pathname);

  if (i18nEnabled && localePrefix(urlLocale)) {
    context.locals.locale = urlLocale;
  } else {
    context.locals.locale = DEFAULT_LOCALE;
    // On the bare root only, honour a saved `locale` cookie / browser language by redirecting to the
    // prefixed URL. Restricted to `/` so assets and deep links are never surprise-redirected.
    if (i18nEnabled && canonicalPath === '/' && context.request.method === 'GET') {
      const preferred = preferredLocale({
        cookie: context.request.headers.get('cookie'),
        acceptLanguage: context.request.headers.get('accept-language'),
      });
      if (preferred !== DEFAULT_LOCALE) {
        return context.redirect(localizedPath(preferred, '/'));
      }
    }
  }

  context.locals.user = await resolveSessionUser(context.request.headers.get('cookie') ?? '');

  // Strip the locale prefix so the single page-file set renders (the browser URL stays `/zh/…`).
  if (i18nEnabled && localePrefix(urlLocale)) {
    return next(`${canonicalPath}${url.search}`);
  }
  return next();
});
