import { HttpResponse, http } from 'msw';

// Dummy-data MSW handlers so the fetch-driven islands (catalogue/collections/dashboards/favorites/…)
// render populated in Storybook without a running API. Shapes mirror @TheY2T/tmr-api-client's generated
// DTOs. Handlers are scoped to the API origin (see API const below) so they never intercept
// Storybook's own module URLs. Unhandled requests bypass (see preview).

const taxo = (slug: string, name: string) => ({ slug, name });

const CONTENT = [
  {
    slug: 'moonlight-sonata',
    title: 'Moonlight Sonata — 1st Movement',
    summary: 'Beethoven’s Piano Sonata No. 14, a study in sustained arpeggiated calm.',
    type: 'score',
    difficulty: 3,
    visibility: 'public',
    genres: [taxo('classical', 'Classical')],
    instruments: [taxo('piano', 'Piano')],
    topics: [taxo('arpeggios', 'Arpeggios')],
  },
  {
    slug: 'twelve-bar-blues',
    title: 'Twelve-Bar Blues in A',
    summary: 'The backbone progression of the blues, with shuffle feel.',
    type: 'lesson',
    difficulty: 2,
    visibility: 'public',
    genres: [taxo('blues', 'Blues')],
    instruments: [taxo('guitar', 'Guitar')],
    topics: [taxo('progressions', 'Progressions')],
  },
  {
    slug: 'major-scale-shapes',
    title: 'Major Scale — CAGED Shapes',
    summary: 'Five movable shapes that cover the whole fretboard.',
    type: 'technique',
    difficulty: 2,
    visibility: 'public',
    genres: [],
    instruments: [taxo('guitar', 'Guitar')],
    topics: [taxo('scales', 'Scales')],
  },
];

const FACETS = {
  genres: [{ slug: 'classical', name: 'Classical', count: 1 }],
  instruments: [{ slug: 'piano', name: 'Piano', count: 1 }],
  topics: [],
  eras: [],
  types: [{ slug: 'score', name: 'score', count: 1 }],
  difficulties: [],
  composers: [],
  keys: [],
};

const COLLECTIONS = [
  {
    slug: 'beginner-piano-path',
    title: 'Beginner Piano Path',
    summary: 'From first notes to your first full piece, step by step.',
    kind: 'path',
    visibility: 'public',
    status: 'published',
    curationType: 'curated',
    itemCount: 8,
    featured: true,
    difficultyMin: 1,
    difficultyMax: 3,
    estMinutes: 240,
    curatorName: 'The Music Repository',
    popularity: 42,
    averageRating: 4.6,
  },
  {
    slug: 'blues-guitar-starter',
    title: 'Blues Guitar Starter',
    summary: 'Shuffle rhythms, turnarounds, and your first solos.',
    kind: 'course',
    visibility: 'public',
    status: 'published',
    curationType: 'curated',
    itemCount: 6,
    featured: false,
    popularity: 30,
    averageRating: 4.4,
  },
];

const COLL_FACETS = {
  kinds: [{ slug: 'path', name: 'path', count: 1 }],
  eras: [],
  instruments: [],
  techniques: [],
  moods: [],
  curators: [],
  difficulties: [],
};

const catalogueList = {
  items: CONTENT,
  facets: FACETS,
  total: CONTENT.length,
  page: 1,
  pageSize: 24,
};
const collectionResult = {
  items: COLLECTIONS,
  facets: COLL_FACETS,
  total: COLLECTIONS.length,
  page: 1,
  pageSize: 24,
};

// Admin catalogue-content list (ContentAdminList) — like ContentSummary but with status/updatedAt so
// the admin manager's board/table columns populate. Genres/instruments are string slugs here.
const ADMIN_CONTENT = CONTENT.map((c, i) => ({
  slug: c.slug,
  title: c.title,
  type: c.type,
  status: (['published', 'draft', 'review'] as const)[i % 3],
  visibility: 'public',
  difficulty: c.difficulty,
  updatedAt: '2026-07-01T00:00:00.000Z',
  genres: c.genres.map((g) => g.slug),
  instruments: c.instruments.map((g) => g.slug),
}));

const TAXONOMY = {
  items: [
    { slug: 'classical', name: 'Classical' },
    { slug: 'blues', name: 'Blues' },
    { slug: 'jazz', name: 'Jazz' },
  ],
};

const contentDetail = {
  ...CONTENT[1], // Twelve-Bar Blues in A
  bodyMdx:
    '## The most important form in blues and rock\n\n' +
    'The **12-bar blues** is a repeating 12-measure chord pattern built on the **I, IV, and V** of the ' +
    'key. Learn it once and you can play along with a huge swath of blues and early rock and roll.\n\n' +
    '## The three chords\n\n' +
    'In A, the I–IV–V chords are `A7`, `D7`, and `E7` — dominant sevenths give the blues its bite.',
  details: { key: 'A', form: 'lesson', timeSignature: '4/4' },
  tags: [taxo('beginner', 'Beginner'), taxo('blues', 'Blues')],
  media: [],
  embeds: [],
  source: 'general knowledge',
  license: 'CC0',
  createdAt: '2026-06-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
};

// Full collection-with-progress detail (CollectionProgressDetail): entries carry the catalogue item
// plus per-item progress/section, so CollectionDetail renders sections, an outcomes list, and progress.
const COLL_ENTRIES = [
  {
    position: 0,
    content: CONTENT[0],
    sectionId: 'sec-1',
    curatorNote: 'Detached left hand, singing right — the Baroque default touch.',
    focusSkills: ['articulation'],
    completed: true,
  },
  { position: 1, content: CONTENT[1], sectionId: 'sec-1', completed: false },
  { position: 2, content: CONTENT[2], completed: false },
];
const collectionDetail = {
  ...COLLECTIONS[0],
  ratingCount: 8,
  bodyMdx:
    'Baroque keyboard music teaches independence of the hands like nothing else. This course moves ' +
    'from a singable minuet to crystalline counterpoint, building finger independence and clear ' +
    'articulation.',
  outcomes: [
    'Voice two independent lines with clear articulation',
    'Shape Baroque phrases without a sustain pedal',
    'Understand simple imitative counterpoint',
  ],
  curatorBio: 'A path through the most approachable Baroque keyboard writing.',
  items: COLL_ENTRIES,
  sections: [
    {
      id: 'sec-1',
      title: 'Warming to the Style',
      description: 'Start gentle before the counterpoint.',
      position: 0,
      items: COLL_ENTRIES.filter((e) => e.sectionId === 'sec-1'),
    },
  ],
};

// Scope every handler to the API origin (the base the api-client + data-seam use when
// PUBLIC_API_BASE_URL is unset). A bare `*/…` pattern would also match Storybook's own module URLs
// (e.g. /@fs/.../musickit-ui/src/content/ContentEmbeds.stories.tsx contains `/content/`), hijacking
// the module fetch and returning JSON → "expected a JS module, got application/json".
const API = import.meta.env.PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

export const handlers = [
  // Public catalogue + collections (browsers/detail pages). NOTE: more specific routes must come
  // first — MSW matches in array order.
  http.get(`${API}/catalogue/items/*/related`, () => HttpResponse.json({ items: CONTENT })),
  http.get(`${API}/catalogue/items/*`, () => HttpResponse.json(contentDetail)),
  http.get(`${API}/catalogue/items`, () => HttpResponse.json(catalogueList)),
  http.get(`${API}/collections/search`, () => HttpResponse.json(collectionResult)),
  http.get(`${API}/collections/by-content/*`, () => HttpResponse.json({ items: COLLECTIONS })),
  http.post(`${API}/collections/*/open`, () => HttpResponse.json({})),
  http.get(`${API}/collections/*/progress`, () => HttpResponse.json(collectionDetail)),
  http.get(`${API}/collections/*`, () => HttpResponse.json(collectionDetail)),
  http.get(`${API}/collections`, () => HttpResponse.json({ items: COLLECTIONS })),
  // Admin content + collections + help (managers/forms)
  http.get(`${API}/content/*`, () => HttpResponse.json(contentDetail)),
  http.get(`${API}/content`, () => HttpResponse.json({ items: ADMIN_CONTENT })),
  http.get(`${API}/taxonomy/*`, () => HttpResponse.json(TAXONOMY)),
  http.get(`${API}/admin/collections/*`, () =>
    HttpResponse.json({ ...COLLECTIONS[0], sections: [], items: [] }),
  ),
  http.get(`${API}/admin/collections`, () => HttpResponse.json({ items: COLLECTIONS })),
  http.get(`${API}/admin/help-topics`, () => HttpResponse.json({ items: [] })),
  http.get(`${API}/help-topics`, () => HttpResponse.json({ items: [] })),
  http.get(`${API}/health`, () =>
    HttpResponse.json({ status: 'ok', service: 'tmr-api', checks: { database: 'up' } }),
  ),
  http.get(`${API}/me/favorites`, () => HttpResponse.json({ items: CONTENT.slice(0, 2) })),
  http.get(`${API}/me/progress`, () =>
    HttpResponse.json({
      completedCount: 3,
      completedSlugs: ['twelve-bar-blues'],
      currentStreakDays: 4,
      totalPracticeMinutes: 260,
      collections: [],
    }),
  ),
  http.get(`${API}/me/reviews/*`, () => HttpResponse.json({ cards: [] })),
  http.get(`${API}/me/reviews`, () => HttpResponse.json({ items: [] })),
  http.get(`${API}/me/collections`, () => HttpResponse.json({ items: COLLECTIONS.slice(0, 1) })),
  http.get(`${API}/me/saved-collections`, () =>
    HttpResponse.json({ items: COLLECTIONS.slice(0, 1) }),
  ),
  http.get(`${API}/me/classrooms`, () => HttpResponse.json({ items: [] })),
  http.get(`${API}/me/progressions`, () => HttpResponse.json({ items: [] })),
  http.get(`${API}/me/subscription`, () => HttpResponse.json({ premium: false, source: 'none' })),
  http.get(`${API}/me/entitlements/history`, () => HttpResponse.json({ items: [] })),
];
