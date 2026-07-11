/** Seed dataset — public-domain / openly-licensed catalogue items + taxonomy. */

export const GENRES = [
  { slug: 'classical', name: 'Classical' },
  { slug: 'jazz', name: 'Jazz' },
  { slug: 'blues', name: 'Blues' },
  { slug: 'folk', name: 'Folk' },
  { slug: 'ragtime', name: 'Ragtime' },
];

export const INSTRUMENTS = [
  { slug: 'piano', name: 'Piano' },
  { slug: 'guitar', name: 'Guitar' },
];

export const SKILL_TOPICS = [
  { slug: 'scales', name: 'Scales' },
  { slug: 'chords', name: 'Chords' },
  { slug: 'arpeggios', name: 'Arpeggios' },
  { slug: 'sight-reading', name: 'Sight-reading' },
  { slug: 'technique', name: 'Technique' },
  { slug: 'theory', name: 'Theory' },
];

export const TAGS = [
  { slug: 'public-domain', name: 'Public domain' },
  { slug: 'beginner', name: 'Beginner' },
  { slug: 'exercise', name: 'Exercise' },
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
