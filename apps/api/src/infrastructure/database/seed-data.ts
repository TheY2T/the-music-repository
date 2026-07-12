/** Seed dataset — public-domain / openly-licensed catalogue items + taxonomy. */

export const GENRES = [
  { slug: 'classical', name: 'Classical' },
  { slug: 'jazz', name: 'Jazz' },
  { slug: 'blues', name: 'Blues' },
  { slug: 'folk', name: 'Folk' },
  { slug: 'ragtime', name: 'Ragtime' },
  { slug: 'pop', name: 'Pop' },
  { slug: 'rock', name: 'Rock' },
];

export const INSTRUMENTS = [
  { slug: 'piano', name: 'Piano' },
  { slug: 'guitar', name: 'Guitar' },
  { slug: 'ukulele', name: 'Ukulele' },
  { slug: 'bass', name: 'Bass' },
];

export const SKILL_TOPICS = [
  { slug: 'scales', name: 'Scales' },
  { slug: 'chords', name: 'Chords' },
  { slug: 'arpeggios', name: 'Arpeggios' },
  { slug: 'sight-reading', name: 'Sight-reading' },
  { slug: 'technique', name: 'Technique' },
  { slug: 'theory', name: 'Theory' },
  { slug: 'ear-training', name: 'Ear training' },
  { slug: 'rhythm', name: 'Rhythm' },
  { slug: 'improvisation', name: 'Improvisation' },
  { slug: 'modes', name: 'Modes' },
];

export const TAGS = [
  { slug: 'public-domain', name: 'Public domain' },
  { slug: 'beginner', name: 'Beginner' },
  { slug: 'exercise', name: 'Exercise' },
  { slug: 'intermediate', name: 'Intermediate' },
  { slug: 'cc-by-sa', name: 'CC BY-SA' },
];

export interface SeedContent {
  slug: string;
  title: string;
  summary: string;
  type: string;
  difficulty: number | null;
  genres: string[];
  instruments: string[];
  topics: string[];
  tags: string[];
  source: string;
  attribution: string;
  license: string;
  withPdf?: boolean;
  /** Phase 6 — `premium` gates the item behind an entitlement; defaults to `public`. */
  visibility?: string;
}

const PD = 'Public Domain';

export const CONTENT: SeedContent[] = [
  {
    slug: 'bach-prelude-c-major-bwv-846',
    title: 'Prelude in C major, BWV 846',
    summary: 'The opening prelude of the Well-Tempered Clavier — flowing broken chords.',
    type: 'score',
    difficulty: 5,
    genres: ['classical'],
    instruments: ['piano'],
    topics: ['sight-reading', 'arpeggios'],
    tags: ['public-domain'],
    source: 'IMSLP',
    attribution: 'J. S. Bach',
    license: PD,
    withPdf: true,
  },
  {
    slug: 'hanon-virtuoso-pianist-no-1',
    title: 'The Virtuoso Pianist — Exercise No. 1',
    summary: 'Classic finger-independence exercise for the five fingers.',
    type: 'technique',
    difficulty: 3,
    genres: ['classical'],
    instruments: ['piano'],
    topics: ['technique', 'scales'],
    tags: ['public-domain', 'exercise'],
    source: 'Hanon',
    attribution: 'Charles-Louis Hanon',
    license: PD,
    withPdf: true,
  },
  {
    slug: 'czerny-op-599-no-1',
    title: 'Practical Method for Beginners, Op. 599 No. 1',
    summary: 'A gentle beginner study for evenness and hand position.',
    type: 'exercise',
    difficulty: 2,
    genres: ['classical'],
    instruments: ['piano'],
    topics: ['technique'],
    tags: ['public-domain', 'exercise', 'beginner'],
    source: 'Czerny',
    attribution: 'Carl Czerny',
    license: PD,
    visibility: 'premium',
    withPdf: true,
  },
  {
    slug: 'omt-intervals',
    title: 'Intervals',
    summary: 'How to measure and name the distance between two pitches.',
    type: 'lesson',
    difficulty: null,
    genres: [],
    instruments: [],
    topics: ['theory'],
    tags: [],
    source: 'Open Music Theory',
    attribution: 'Open Music Theory (CC BY-SA 4.0)',
    license: 'CC BY-SA 4.0',
  },
  {
    slug: 'omt-diatonic-chords',
    title: 'Diatonic Chords',
    summary: 'Building triads on each scale degree and naming them with Roman numerals.',
    type: 'lesson',
    difficulty: null,
    genres: [],
    instruments: [],
    topics: ['theory', 'chords'],
    tags: [],
    source: 'Open Music Theory',
    attribution: 'Open Music Theory (CC BY-SA 4.0)',
    license: 'CC BY-SA 4.0',
    visibility: 'premium',
  },
  {
    slug: 'greensleeves-trad',
    title: 'Greensleeves',
    summary: 'A traditional English folk tune, arranged for fingerstyle guitar.',
    type: 'song',
    difficulty: 3,
    genres: ['folk'],
    instruments: ['guitar'],
    topics: ['sight-reading'],
    tags: ['public-domain'],
    source: 'Traditional',
    attribution: 'Traditional (arr. public domain)',
    license: PD,
    withPdf: true,
  },
  {
    slug: 'joplin-the-entertainer',
    title: 'The Entertainer',
    summary: 'Scott Joplin’s beloved ragtime — syncopation and a walking bass.',
    type: 'score',
    difficulty: 6,
    genres: ['ragtime', 'jazz'],
    instruments: ['piano'],
    topics: ['sight-reading'],
    tags: ['public-domain'],
    source: 'IMSLP',
    attribution: 'Scott Joplin',
    license: PD,
    withPdf: true,
  },
  {
    slug: '12-bar-blues-in-a',
    title: '12-Bar Blues in A',
    summary: 'The essential blues form: I–IV–V over twelve bars, with a turnaround.',
    type: 'lesson',
    difficulty: 2,
    genres: ['blues'],
    instruments: ['guitar'],
    topics: ['chords'],
    tags: ['beginner'],
    source: 'Original',
    attribution: 'The Music Repository',
    license: 'CC BY-SA 4.0',
  },
  {
    slug: 'c-major-scale-two-octaves',
    title: 'C Major Scale — Two Octaves',
    summary: 'Standard fingering for the two-octave C major scale, hands together.',
    type: 'exercise',
    difficulty: 1,
    genres: ['classical'],
    instruments: ['piano'],
    topics: ['scales', 'technique'],
    tags: ['beginner', 'exercise'],
    source: 'Original',
    attribution: 'The Music Repository',
    license: 'CC BY-SA 4.0',
  },
  {
    slug: 'beethoven-fur-elise-opening',
    title: 'Für Elise (opening)',
    summary: 'The famous A-minor opening section of Beethoven’s Bagatelle.',
    type: 'score',
    difficulty: 5,
    genres: ['classical'],
    instruments: ['piano'],
    topics: ['sight-reading'],
    tags: ['public-domain'],
    source: 'IMSLP',
    attribution: 'Ludwig van Beethoven',
    license: PD,
    withPdf: true,
  },
  {
    slug: 'carulli-guitar-study',
    title: 'Guitar Study in A minor',
    summary: 'A short classical-guitar study developing arpeggio technique.',
    type: 'score',
    difficulty: 3,
    genres: ['classical'],
    instruments: ['guitar'],
    topics: ['arpeggios', 'technique'],
    tags: ['public-domain'],
    source: 'IMSLP',
    attribution: 'Ferdinando Carulli',
    license: PD,
    withPdf: true,
  },
  {
    slug: 'circle-of-fifths-reference',
    title: 'Circle of Fifths — Reference',
    summary: 'Keys, signatures, and relationships at a glance.',
    type: 'tool_page',
    difficulty: null,
    genres: [],
    instruments: [],
    topics: ['theory'],
    tags: [],
    source: 'Original',
    attribution: 'The Music Repository',
    license: 'CC BY-SA 4.0',
  },
  {
    slug: 'amazing-grace-trad',
    title: 'Amazing Grace',
    summary: 'A traditional hymn — a gentle first song in G major.',
    type: 'song',
    difficulty: 2,
    genres: ['folk'],
    instruments: ['piano', 'guitar'],
    topics: ['sight-reading'],
    tags: ['public-domain', 'beginner'],
    source: 'Traditional',
    attribution: 'Traditional',
    license: PD,
  },
  {
    slug: 'chromatic-scale-exercise',
    title: 'Chromatic Scale Exercise',
    summary: 'Evenness and finger crossings across the full chromatic scale.',
    type: 'exercise',
    difficulty: 2,
    genres: ['classical'],
    instruments: ['piano'],
    topics: ['scales', 'technique'],
    tags: ['exercise'],
    source: 'Original',
    attribution: 'The Music Repository',
    license: 'CC BY-SA 4.0',
  },
  {
    slug: 'minor-pentatonic-scale-shapes',
    title: 'Minor Pentatonic Scale Shapes',
    summary: 'The five movable shapes that unlock blues and rock soloing.',
    type: 'lesson',
    difficulty: 3,
    genres: ['blues'],
    instruments: ['guitar'],
    topics: ['scales'],
    tags: [],
    source: 'Original',
    attribution: 'The Music Repository',
    license: 'CC BY-SA 4.0',
  },
  // --- Slice 3: additional catalogue depth ---
  {
    slug: 'bach-minuet-in-g',
    title: 'Minuet in G major, BWV Anh. 114',
    summary: 'A graceful early-intermediate minuet from the Notebook for Anna Magdalena Bach.',
    type: 'score',
    difficulty: 3,
    genres: ['classical'],
    instruments: ['piano'],
    topics: ['sight-reading', 'technique'],
    tags: ['public-domain'],
    source: 'IMSLP',
    attribution: 'C. Petzold (attrib. J. S. Bach)',
    license: PD,
    withPdf: true,
  },
  {
    slug: 'carcassi-guitar-study-op60-no1',
    title: 'Study in C major, Op. 60 No. 1',
    summary: 'A flowing classical-guitar study building right-hand arpeggio control.',
    type: 'score',
    difficulty: 4,
    genres: ['classical'],
    instruments: ['guitar'],
    topics: ['arpeggios', 'technique'],
    tags: ['public-domain', 'intermediate'],
    source: 'IMSLP',
    attribution: 'Matteo Carcassi',
    license: PD,
    withPdf: true,
  },
  {
    slug: 'joplin-maple-leaf-rag',
    title: 'Maple Leaf Rag',
    summary: "Scott Joplin's landmark rag — driving syncopation over a steady stride bass.",
    type: 'score',
    difficulty: 7,
    genres: ['ragtime', 'jazz'],
    instruments: ['piano'],
    topics: ['rhythm', 'sight-reading'],
    tags: ['public-domain'],
    source: 'IMSLP',
    attribution: 'Scott Joplin',
    license: PD,
    withPdf: true,
  },
  {
    slug: 'ukulele-first-four-chords',
    title: 'Your First Four Ukulele Chords',
    summary: 'C, G, Am, and F — enough to play dozens of songs on the ukulele.',
    type: 'lesson',
    difficulty: 1,
    genres: ['pop', 'folk'],
    instruments: ['ukulele'],
    topics: ['chords'],
    tags: ['beginner'],
    source: 'Original',
    attribution: 'The Music Repository',
    license: 'CC BY-SA 4.0',
  },
  {
    slug: 'walking-bass-basics',
    title: 'Walking Bass Basics',
    summary: 'Build a smooth quarter-note walking line over a ii–V–I in jazz.',
    type: 'lesson',
    difficulty: 4,
    genres: ['jazz'],
    instruments: ['bass'],
    topics: ['improvisation', 'rhythm'],
    tags: ['intermediate'],
    source: 'Original',
    attribution: 'The Music Repository',
    license: 'CC BY-SA 4.0',
  },
  {
    slug: 'blues-scale-piano',
    title: 'The Blues Scale at the Piano',
    summary: 'The six-note blues scale and how to use it for expressive soloing.',
    type: 'lesson',
    difficulty: 3,
    genres: ['blues'],
    instruments: ['piano'],
    topics: ['scales', 'improvisation'],
    tags: [],
    source: 'Original',
    attribution: 'The Music Repository',
    license: 'CC BY-SA 4.0',
  },
  {
    slug: 'omt-rhythm-and-meter',
    title: 'Rhythm and Meter',
    summary: 'Beats, measures, and time signatures — how music is organised in time.',
    type: 'lesson',
    difficulty: null,
    genres: [],
    instruments: [],
    topics: ['theory', 'rhythm'],
    tags: ['cc-by-sa'],
    source: 'Open Music Theory',
    attribution: 'Open Music Theory (CC BY-SA 4.0)',
    license: 'CC BY-SA 4.0',
  },
  {
    slug: 'omt-modes-of-major',
    title: 'Modes of the Major Scale',
    summary: 'Ionian to Locrian — the seven modes and their characteristic colours.',
    type: 'lesson',
    difficulty: null,
    genres: [],
    instruments: [],
    topics: ['theory', 'modes', 'scales'],
    tags: ['cc-by-sa'],
    source: 'Open Music Theory',
    attribution: 'Open Music Theory (CC BY-SA 4.0)',
    license: 'CC BY-SA 4.0',
  },
  {
    slug: 'interval-ear-training-primer',
    title: 'Interval Ear-Training Primer',
    summary: 'Recognise intervals by ear using familiar-song reference points.',
    type: 'exercise',
    difficulty: 2,
    genres: [],
    instruments: [],
    topics: ['ear-training', 'theory'],
    tags: ['beginner'],
    source: 'Original',
    attribution: 'The Music Repository',
    license: 'CC BY-SA 4.0',
  },
  {
    slug: 'major-scales-all-keys',
    title: 'Major Scales in All Keys',
    summary: 'Standard fingering for major scales around the circle of fifths.',
    type: 'exercise',
    difficulty: 4,
    genres: ['classical'],
    instruments: ['piano'],
    topics: ['scales', 'technique'],
    tags: ['exercise'],
    source: 'Original',
    attribution: 'The Music Repository',
    license: 'CC BY-SA 4.0',
  },
];

export interface SeedCollection {
  slug: string;
  title: string;
  summary: string;
  kind: string;
  itemSlugs: string[];
}

/** Ordered learning collections (Phase 2), referencing seeded content slugs. */
export const COLLECTIONS: SeedCollection[] = [
  {
    slug: 'piano-fundamentals',
    title: 'Piano Fundamentals',
    summary: 'A beginner path from your first scale to your first recital pieces.',
    kind: 'course',
    itemSlugs: [
      'c-major-scale-two-octaves',
      'czerny-op-599-no-1',
      'hanon-virtuoso-pianist-no-1',
      'bach-minuet-in-g',
      'beethoven-fur-elise-opening',
    ],
  },
  {
    slug: 'blues-starter-path',
    title: 'Blues Starter Path',
    summary: 'Start playing the blues on piano and guitar.',
    kind: 'path',
    itemSlugs: ['12-bar-blues-in-a', 'blues-scale-piano', 'minor-pentatonic-scale-shapes'],
  },
  {
    slug: 'music-theory-basics',
    title: 'Music Theory Basics',
    summary: 'The core concepts every musician should know.',
    kind: 'syllabus',
    itemSlugs: [
      'omt-intervals',
      'omt-diatonic-chords',
      'omt-rhythm-and-meter',
      'omt-modes-of-major',
    ],
  },
];

export interface SeedHelpTopic {
  slug: string;
  term: string;
  body: string;
  linkSlug?: string;
}

/** Info View help topics. Slugs match `skill_topic` slugs so topic chips resolve directly. */
export const HELP_TOPICS: SeedHelpTopic[] = [
  {
    slug: 'scales',
    term: 'Scale',
    body: 'A **scale** is an ordered set of notes spanning an octave — the raw material of melody and technique.',
    linkSlug: 'c-major-scale-two-octaves',
  },
  {
    slug: 'chords',
    term: 'Chord',
    body: 'A **chord** is three or more notes sounded together; triads (three notes) are the most common.',
    linkSlug: 'omt-diatonic-chords',
  },
  {
    slug: 'arpeggios',
    term: 'Arpeggio',
    body: 'An **arpeggio** is a chord played one note at a time rather than all at once ("broken chord").',
  },
  {
    slug: 'sight-reading',
    term: 'Sight-reading',
    body: 'Playing music **at first sight** from notation, without prior practice.',
  },
  {
    slug: 'technique',
    term: 'Technique',
    body: 'The physical skills — finger independence, evenness, hand position — that let you play freely.',
  },
  {
    slug: 'theory',
    term: 'Music theory',
    body: 'The study of how music works: pitch, rhythm, harmony, and form.',
    linkSlug: 'omt-intervals',
  },
  {
    slug: 'ear-training',
    term: 'Ear training',
    body: 'Learning to **recognise** intervals, chords, and rhythms by ear.',
    linkSlug: 'interval-ear-training-primer',
  },
  {
    slug: 'rhythm',
    term: 'Rhythm',
    body: 'How music is organised **in time** — beats, measures, and time signatures.',
    linkSlug: 'omt-rhythm-and-meter',
  },
  {
    slug: 'improvisation',
    term: 'Improvisation',
    body: 'Creating music **spontaneously**, often over a chord progression or scale.',
  },
  {
    slug: 'modes',
    term: 'Modes',
    body: 'The seven scales (Ionian…Locrian) built by starting the major scale on each of its degrees.',
    linkSlug: 'omt-modes-of-major',
  },
];

/** Build a small but valid single-page PDF (with a correct xref) titled with the given text. */
export function makeMinimalPdf(title: string): Uint8Array {
  const safe = title.replace(/[()\\]/g, ' ');
  const stream = `BT /F1 20 Tf 64 720 Td (${safe}) Tj 0 -28 Td /F1 12 Tf (The Music Repository - sample score) Tj ET`;
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  objects.forEach((obj, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) {
    pdf += `${offset.toString().padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return new TextEncoder().encode(pdf);
}
