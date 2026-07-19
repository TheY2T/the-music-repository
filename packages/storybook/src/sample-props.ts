// A broad bag of dummy props spread into auto-generated / gallery stories so prop-driven components
// render (or at least their empty state) instead of crashing on `undefined`. Unknown props are ignored
// by function components. Components with bespoke contracts (e.g. a `labels` object of functions, or
// specific data shapes) get a curated co-located story instead — the codegen skips those.

const noop = () => {};

const DUMMY_COLLECTION = {
  slug: 'beginner-piano-path',
  title: 'Beginner Piano Path',
  summary: 'From first notes to your first full piece, step by step.',
  kind: 'path',
  visibility: 'public',
  status: 'published',
  curationType: 'curated',
  itemCount: 8,
  featured: true,
  popularity: 42,
  averageRating: 4.6,
};

const DUMMY_CONTENT = {
  slug: 'twelve-bar-blues',
  title: 'Twelve-Bar Blues in A',
  summary: 'The backbone progression of the blues.',
  type: 'lesson',
  visibility: 'public',
  genres: [],
  instruments: [],
  topics: [],
};

export const sampleProps: Record<string, unknown> = {
  // identity / text
  locale: 'en',
  seed: 'demo-seed',
  title: 'Demo Title',
  subtitle: 'Demo subtitle',
  name: 'Demo',
  kofiUsername: 'themusicrepository',
  // A real seed slug so detail views (ContentDetail) fetch their item, and the admin forms load in
  // edit mode — both are served dummy data by the MSW handlers (item/collection GETs are mocked).
  slug: 'moonlight-sonata',
  summary: 'A short demo summary for the Storybook preview.',
  href: '#',
  className: '',
  root: 'C',
  // SiteHeader / nav chrome
  siteName: 'The Music Repository',
  i18nEnabled: true,
  catalogueHref: '#',
  homeHref: '#',
  primaryNav: [
    { key: 'catalogue', href: '#', label: 'Catalogue', iconName: 'music', active: false },
    { key: 'collections', href: '#', label: 'Collections', iconName: 'music', active: true },
    { key: 'tools', href: '#', label: 'Tools', iconName: 'music', active: false },
  ],
  accountNav: [{ key: 'signin', href: '#', label: 'Sign in', iconName: 'log-in', active: false }],
  deckKey: 'intervals',
  // A minimal alphaTex so score components (ScorePlayer/ScoreRenderer/AlphaTexScore) render in `dev`
  // (the alphaTab Vite plugin is dev-only — see .storybook/main.ts).
  tex: ':4 c4 d4 e4 f4 | g4 a4 b4 c5',
  // common pre-localized string label props
  label: 'Label',
  ariaLabel: 'Label',
  kindLabel: 'Path',
  itemCountLabel: '8 items',
  featuredLabel: 'Featured',
  durationLabel: '~4 h',
  difficultyRangeLabel: 'Grade 1–3',
  progressLabel: '0% complete',
  // flags
  featured: true,
  enabled: true,
  interactive: true,
  readOnly: false,
  syncEnabled: false,
  showProgress: false,
  showSave: false,
  showRating: false,
  showMonetization: false,
  // numbers
  average: 4.5,
  ratingCount: 12,
  count: 12,
  value: 0,
  progressPercent: 40,
  difficulty: 2,
  step: 0,
  // arrays — empty is enough to avoid .map/.filter/.length crashes; components render their empty state.
  // `chords` is populated (only ChordBoard reads it as a prop) so the board shows a real progression.
  chords: ['C', 'G', 'Am', 'F'],
  notes: [],
  // A one-bar 4/4 rhythm (note-value tokens) — Rhythm reads `values`.
  values: ['quarter', 'eighth', 'eighth', 'quarter', 'quarter'],
  // A common down/down-up/up-down-up strum (↓ down, ↑ up, · rest) — StrumPattern reads `pattern`.
  pattern: ['↓', '↓', '↑', '·', '↑', '↓', '↑', '·'],
  items: [],
  tools: [],
  categories: [],
  decks: [],
  reviews: [],
  collections: [],
  strings: [],
  // data objects
  collection: DUMMY_COLLECTION,
  content: DUMMY_CONTENT,
  item: DUMMY_CONTENT,
  chord: { name: 'C', quality: 'major', frets: [-1, 3, 2, 0, 1, 0] },
  // ContentBody/ContentEmbeds: a short article body + a couple of embeds so they populate in the
  // gallery (their curated stories in packages/musickit-ui/src/content show richer examples).
  bodyHtml: '<h2>I–V–vi–IV</h2><p>The four chords behind countless pop songs. Try them below.</p>',
  embeds: [
    {
      tool: 'chord-diagrams',
      title: 'The chords',
      instrument: 'guitar',
      chords: ['C', 'G', 'Am', 'F'],
    },
    {
      tool: 'progression',
      title: 'Play along',
      key: 'C',
      chords: ['C', 'G', 'Am', 'F'],
      tempo: 100,
    },
  ],
  // Merged labels object — every `labels.*` key used across the UI packages (strings + the two
  // function-valued ones). No two components need the same key with different types, so one object
  // serves them all (SaveCollectionButton, CollectionRating, …).
  labels: {
    save: 'Save',
    saved: 'Saved',
    yourRating: 'Your rating',
    averageRating: 'Average',
    rateAria: (star: number) => `Rate ${star} stars`,
    ratingCount: (n: number) => `${n} ratings`,
  },
  user: null,
  // callbacks
  onPlay: noop,
  onRate: noop,
  onSave: noop,
  onChange: noop,
  onSelect: noop,
  onClose: noop,
  onSubmit: noop,
  onStrum: noop,
  onPress: noop,
  onComplete: noop,
};
