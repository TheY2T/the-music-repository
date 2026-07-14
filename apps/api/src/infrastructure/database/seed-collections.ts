/**
 * GENERATED FILE — do not edit by hand.
 * Source: src/infrastructure/database/content/collections/*.md
 * Regenerate: pnpm --filter @TheY2T/tmr-api collections:build
 *
 * Fully-authored collections (16): metadata, rich description, outcomes, and chaptered
 * sections with per-item curator notes. Applied by the seed (seed.ts).
 */
import type { SeedCollectionDoc } from './content-details';

export const SEED_COLLECTIONS: SeedCollectionDoc[] = [
  {
    slug: 'baroque-keyboard-essentials',
    title: 'Baroque Keyboard Essentials',
    kind: 'course',
    summary: 'The Bach staples every developing keyboard player should know.',
    bodyMdx:
      'Baroque keyboard music teaches independence of the hands like nothing else. This course moves from a\nsingable minuet to the crystalline counterpoint of the Preludes and Inventions, building the finger\nindependence and clear articulation the style demands.',
    curatorName: 'The Music Repository',
    curatorBio: 'A path through the most approachable Baroque keyboard writing.',
    featured: true,
    difficultyMin: 2,
    difficultyMax: 6,
    estMinutes: 360,
    accent: 'heritage',
    tags: ['piano', 'baroque', 'bach', 'counterpoint'],
    facets: {
      era: ['Baroque'],
      genre: ['classical'],
      technique: ['counterpoint', 'hand-independence', 'articulation'],
      mood: ['reflective'],
    },
    outcomes: [
      'Voice two independent lines with clear articulation',
      'Shape Baroque phrases without a sustain pedal',
      'Understand simple imitative counterpoint',
    ],
    sections: [
      {
        title: 'Warming to the Style',
        description: null,
        items: [
          {
            contentSlug: 'bach-minuet-in-g',
            curatorNote:
              'Detached left hand, singing right — the Baroque default touch. skills: [articulation]',
            focusSkills: ['articulation'],
          },
        ],
      },
      {
        title: 'Preludes',
        description: null,
        items: [
          {
            contentSlug: 'bach-prelude-c-major-bwv-846',
            curatorNote:
              'Keep the broken-chord figuration perfectly even. skills: [evenness, voicing]',
            focusSkills: ['evenness', 'voicing'],
          },
        ],
      },
      {
        title: 'Two-Part Counterpoint',
        description: null,
        items: [
          {
            contentSlug: 'bach-invention-no1-bwv772',
            curatorNote:
              'Practise each hand alone until the subject is memorised. skills: [counterpoint, hand-independence]',
            focusSkills: ['counterpoint', 'hand-independence'],
          },
        ],
      },
    ],
  },
  {
    slug: 'chopin-spotlight',
    title: 'Chopin Spotlight',
    kind: 'course',
    summary: 'A composer deep-dive into the poet of the piano.',
    bodyMdx:
      'No one wrote for the piano like Chopin. Every piece is a study in singing tone, flexible rubato, and\nharmonic colour. This spotlight gathers his most approachable works, ordered from gentlest to grandest.',
    curatorName: 'The Music Repository',
    curatorBio: 'Frédéric Chopin (1810–1849) — the essential approachable works.',
    featured: false,
    difficultyMin: 4,
    difficultyMax: 8,
    estMinutes: 300,
    accent: 'hybrid',
    tags: ['piano', 'romantic', 'chopin'],
    facets: {
      era: ['Romantic'],
      genre: ['classical'],
      technique: ['rubato', 'voicing', 'pedaling'],
      mood: ['romantic', 'reflective'],
    },
    outcomes: [
      'Shape a Chopin melody with natural rubato',
      'Balance a singing right hand over a rocking bass',
      'Pedal for warmth and harmonic clarity',
    ],
    sections: [
      {
        title: 'First Chopin',
        description: null,
        items: [
          {
            contentSlug: 'chopin-prelude-e-minor-op28-no4',
            curatorNote: 'Slow, sighing harmony — voice the melody. skills: [voicing]',
            focusSkills: ['voicing'],
          },
          {
            contentSlug: 'chopin-waltz-a-minor-b150',
            curatorNote: null,
            focusSkills: ['rubato'],
          },
        ],
      },
      {
        title: 'The Nocturne Touch',
        description: null,
        items: [
          {
            contentSlug: 'chopin-nocturne-op9-no2',
            curatorNote:
              'The archetypal nocturne — melody floating over a rocking bass. skills: [rubato, pedaling]',
            focusSkills: ['rubato', 'pedaling'],
          },
        ],
      },
    ],
  },
  {
    slug: 'classical-piano-ladder',
    title: 'The Classical Piano Ladder',
    kind: 'syllabus',
    summary: 'A long graded climb from first pieces to advanced repertoire.',
    bodyMdx:
      'Where do you go after your first pieces? This ladder lays out a long-term route through the piano\nrepertoire, one rung at a time — from beginner tunes to advanced Romantic writing — so you always know\nwhat to reach for next.',
    curatorName: 'The Music Repository',
    curatorBio: 'A milestone-by-milestone route across the whole beginner-to-advanced journey.',
    featured: true,
    difficultyMin: 1,
    difficultyMax: 9,
    estMinutes: 720,
    accent: 'hybrid',
    tags: ['piano', 'graded', 'repertoire', 'syllabus'],
    facets: {
      era: ['Baroque', 'Classical', 'Romantic'],
      genre: ['classical'],
      technique: ['reading', 'scales', 'phrasing', 'pedaling', 'voicing'],
      mood: ['aspirational'],
    },
    outcomes: [
      'See the whole beginner-to-advanced arc at a glance',
      'Choose a well-graded next piece at every stage',
      'Cover Baroque, Classical and Romantic styles',
    ],
    sections: [
      {
        title: 'Grade 1–2 — Beginnings',
        description: null,
        items: [
          {
            contentSlug: 'beethoven-ode-to-joy',
            curatorNote: 'Your very first melody.',
            focusSkills: [],
          },
          {
            contentSlug: 'bach-minuet-in-g',
            curatorNote: null,
            focusSkills: [],
          },
        ],
      },
      {
        title: 'Grade 3–4 — Building',
        description: null,
        items: [
          {
            contentSlug: 'clementi-sonatina-op36-no1-1st-mvt',
            curatorNote: 'First Classical form.',
            focusSkills: [],
          },
          {
            contentSlug: 'schumann-melody-op68-no1',
            curatorNote: null,
            focusSkills: [],
          },
          {
            contentSlug: 'burgmuller-arabesque-op100-no2',
            curatorNote: 'A brilliant little étude.',
            focusSkills: [],
          },
        ],
      },
      {
        title: 'Grade 5–6 — Intermediate',
        description: null,
        items: [
          {
            contentSlug: 'bach-invention-no1-bwv772',
            curatorNote: 'Two-part counterpoint.',
            focusSkills: [],
          },
          {
            contentSlug: 'chopin-prelude-e-minor-op28-no4',
            curatorNote: 'First Romantic voicing.',
            focusSkills: [],
          },
        ],
      },
      {
        title: 'Grade 7–9 — Advanced',
        description: null,
        items: [
          {
            contentSlug: 'chopin-nocturne-op9-no2',
            curatorNote: 'The nocturne touch. skills: [rubato]',
            focusSkills: ['rubato'],
          },
          {
            contentSlug: 'debussy-clair-de-lune',
            curatorNote: 'Colour and pedal artistry. skills: [pedaling]',
            focusSkills: ['pedaling'],
          },
          {
            contentSlug: 'beethoven-moonlight-sonata-1st-mvt',
            curatorNote: 'Sustained control and atmosphere. skills: [pedaling, voicing]',
            focusSkills: ['pedaling', 'voicing'],
          },
        ],
      },
    ],
  },
  {
    slug: 'classical-sonatinas',
    title: 'Classical Sonatinas',
    kind: 'syllabus',
    summary: 'The graded stepping-stones from first sonatina to real sonata form.',
    bodyMdx:
      'Sonatinas are how generations of pianists learned Classical style — clean articulation, balanced phrases,\nand the architecture of sonata form in miniature. This graded set builds from Clementi to Mozart.',
    curatorName: 'The Music Repository',
    curatorBio: 'A graded route through Classical-era form, easiest first.',
    featured: false,
    difficultyMin: 3,
    difficultyMax: 7,
    estMinutes: 480,
    accent: 'heritage',
    tags: ['piano', 'classical', 'sonatina', 'form'],
    facets: {
      era: ['Classical'],
      genre: ['classical'],
      technique: ['scales', 'articulation', 'phrasing', 'form'],
      mood: ['bright'],
    },
    outcomes: [
      'Play clean two-hand Classical textures',
      'Understand exposition, development and recapitulation',
      'Apply scale and arpeggio technique in real repertoire',
    ],
    sections: [
      {
        title: 'Grade 3 — First Sonatinas',
        description: null,
        items: [
          {
            contentSlug: 'clementi-sonatina-op36-no1-1st-mvt',
            curatorNote: null,
            focusSkills: ['articulation'],
          },
          {
            contentSlug: 'beethoven-sonatina-in-g-anh5',
            curatorNote: 'Elegant and tuneful — attributed to the young Beethoven.',
            focusSkills: [],
          },
        ],
      },
      {
        title: 'Grade 4–5 — Building Fluency',
        description: null,
        items: [
          {
            contentSlug: 'kuhlau-sonatina-op20-no1-1st-mvt',
            curatorNote: 'Brilliant passagework — practise the scales slowly. skills: [scales]',
            focusSkills: ['scales'],
          },
        ],
      },
      {
        title: 'Grade 6+ — Toward the Sonata',
        description: null,
        items: [
          {
            contentSlug: 'mozart-sonata-k545-1st-mvt',
            curatorNote:
              '"Sonata facile" — famously not so easy. Aim for evenness. skills: [scales, phrasing]',
            focusSkills: ['scales', 'phrasing'],
          },
        ],
      },
    ],
  },
  {
    slug: 'fingerstyle-guitar-foundations',
    title: 'Fingerstyle Guitar Foundations',
    kind: 'path',
    summary: 'Classical-guitar studies that build real right-hand fingerstyle technique.',
    bodyMdx:
      'Solo fingerstyle guitar rests on a handful of classic studies. This path builds right-hand control from\nCarulli and Sor through to the singing melodies of Tárrega — the foundation of the classical repertoire.',
    curatorName: 'The Music Repository',
    curatorBio: 'A path through the great pedagogical studies for solo guitar.',
    featured: true,
    difficultyMin: 2,
    difficultyMax: 7,
    estMinutes: 360,
    accent: 'heritage',
    tags: ['guitar', 'fingerstyle', 'classical'],
    facets: {
      era: ['Classical', 'Romantic'],
      genre: ['classical'],
      technique: ['fingerpicking', 'arpeggios', 'tone', 'independence'],
      mood: ['warm'],
      instrument: ['guitar'],
    },
    outcomes: [
      'Play clean right-hand arpeggio patterns (p-i-m-a)',
      'Separate a melody from its accompaniment',
      'Produce a warm, even tone',
    ],
    sections: [
      {
        title: 'Right-Hand Basics',
        description: null,
        items: [
          {
            contentSlug: 'carulli-guitar-study',
            curatorNote: 'Simple arpeggios — anchor the right hand and relax. skills: [arpeggios]',
            focusSkills: ['arpeggios'],
          },
          {
            contentSlug: 'carcassi-guitar-study-op60-no1',
            curatorNote: 'The classic first Carcassi study. skills: [arpeggios, tone]',
            focusSkills: ['arpeggios', 'tone'],
          },
        ],
      },
      {
        title: 'Melody & Accompaniment',
        description: null,
        items: [
          {
            contentSlug: 'sor-study-op60-no1',
            curatorNote: 'Bring out the top-voice melody. skills: [independence, voicing]',
            focusSkills: ['independence', 'voicing'],
          },
          {
            contentSlug: 'carcassi-study-op60-no7',
            curatorNote: null,
            focusSkills: [],
          },
        ],
      },
      {
        title: 'The Singing Line',
        description: null,
        items: [
          {
            contentSlug: 'tarrega-lagrima',
            curatorNote: "Tárrega's tender miniature — pure tone and legato. skills: [tone]",
            focusSkills: ['tone'],
          },
          {
            contentSlug: 'tarrega-adelita',
            curatorNote: null,
            focusSkills: [],
          },
        ],
      },
    ],
  },
  {
    slug: 'guitar-from-zero',
    title: 'Guitar from Zero',
    kind: 'path',
    summary: 'Your first steps on the guitar — simple studies and a first tune.',
    bodyMdx:
      'Everyone starts somewhere. This path builds the right-hand control and reading you need through short,\nfriendly studies, then rewards you with a well-loved tune to play all the way through.',
    curatorName: 'The Music Repository',
    curatorBio: 'A gentle on-ramp for the brand-new guitarist.',
    featured: false,
    difficultyMin: 1,
    difficultyMax: 4,
    estMinutes: 210,
    accent: 'warm-minimal',
    tags: ['guitar', 'beginner', 'technique'],
    facets: {
      era: ['Classical', 'Traditional'],
      genre: ['classical', 'folk'],
      technique: ['fingerpicking', 'reading', 'tone'],
      mood: ['encouraging'],
      instrument: ['guitar'],
    },
    outcomes: [
      'Pluck clean single notes and simple arpeggios',
      'Read basic notation on the guitar',
      'Play a complete beginner piece',
    ],
    sections: [
      {
        title: 'First Studies',
        description: null,
        items: [
          {
            contentSlug: 'carulli-guitar-study',
            curatorNote: 'Anchor the right hand and keep it relaxed. skills: [fingerpicking]',
            focusSkills: ['fingerpicking'],
          },
          {
            contentSlug: 'carcassi-guitar-study-op60-no1',
            curatorNote: 'The classic first study — even arpeggios. skills: [arpeggios]',
            focusSkills: ['arpeggios'],
          },
        ],
      },
      {
        title: 'Your First Tune',
        description: null,
        items: [
          {
            contentSlug: 'wildwood-flower',
            curatorNote: 'A beginner favourite — melody on the low strings. skills: [melody]',
            focusSkills: ['melody'],
          },
        ],
      },
    ],
  },
  {
    slug: 'impressionist-piano-colours',
    title: 'Impressionist Piano Colours',
    kind: 'course',
    summary: 'Debussy and Satie — atmosphere, pedal, and floating harmony.',
    bodyMdx:
      "Impressionist piano is about sound as colour. Here the pedal is a paintbrush and balance is everything.\nStart with Satie's stillness, then move into Debussy's shimmering layers of resonance.",
    curatorName: 'The Music Repository',
    curatorBio: 'A short course in colour, resonance and sustain-pedal artistry.',
    featured: false,
    difficultyMin: 4,
    difficultyMax: 8,
    estMinutes: 300,
    accent: 'hybrid',
    tags: ['piano', 'impressionist', 'colour', 'pedal'],
    facets: {
      era: ['Modern'],
      genre: ['classical'],
      technique: ['pedaling', 'voicing', 'tone', 'layering'],
      mood: ['dreamy', 'reflective'],
    },
    outcomes: [
      'Blend and change the pedal for colour without blur',
      'Balance melody, bass and inner voices',
      'Shape long, unhurried lines',
    ],
    sections: [
      {
        title: 'Stillness',
        description: null,
        items: [
          {
            contentSlug: 'satie-gymnopedie-no1',
            curatorNote: 'Slow, spacious, and perfectly even. skills: [pedaling, tone]',
            focusSkills: ['pedaling', 'tone'],
          },
          {
            contentSlug: 'satie-gnossienne-no1',
            curatorNote: 'Free, unbarred phrasing — breathe with the line.',
            focusSkills: [],
          },
        ],
      },
      {
        title: 'Shimmer',
        description: null,
        items: [
          {
            contentSlug: 'debussy-arabesque-no1',
            curatorNote: null,
            focusSkills: ['layering'],
          },
          {
            contentSlug: 'debussy-clair-de-lune',
            curatorNote:
              'The classic — voice the melody above a soft, pedalled wash. skills: [voicing, pedaling]',
            focusSkills: ['voicing', 'pedaling'],
          },
        ],
      },
    ],
  },
  {
    slug: 'music-theory-foundations',
    title: 'Music Theory Foundations',
    kind: 'syllabus',
    summary: 'A structured path from intervals to seventh chords and voice leading.',
    bodyMdx:
      'Theory makes everything else easier — you stop memorising and start understanding. This syllabus builds\nin order: the raw materials (intervals, scales, rhythm), then how chords are built, then how they move.',
    curatorName: 'The Music Repository',
    curatorBio: 'A graded theory syllabus built on the Open Music Theory lessons.',
    featured: true,
    difficultyMin: 1,
    difficultyMax: 6,
    estMinutes: 300,
    accent: 'hybrid',
    tags: ['theory', 'harmony', 'fundamentals'],
    facets: {
      era: ['Modern'],
      genre: ['classical'],
      technique: ['ear-training', 'analysis'],
      mood: ['focused'],
    },
    outcomes: [
      'Identify intervals and build any major scale',
      'Spell triads and seventh chords in any key',
      'Recognise common cadences and chord functions',
    ],
    sections: [
      {
        title: 'The Raw Materials',
        description: null,
        items: [
          {
            contentSlug: 'omt-intervals',
            curatorNote:
              'Everything in harmony is measured in intervals — start here. skills: [ear-training]',
            focusSkills: ['ear-training'],
          },
          {
            contentSlug: 'omt-major-scale-key-signatures',
            curatorNote: null,
            focusSkills: [],
          },
          {
            contentSlug: 'omt-rhythm-and-meter',
            curatorNote: null,
            focusSkills: [],
          },
        ],
      },
      {
        title: 'Building Chords',
        description: null,
        items: [
          {
            contentSlug: 'omt-triads-and-inversions',
            curatorNote: 'Triads are the atoms of harmony.',
            focusSkills: [],
          },
          {
            contentSlug: 'omt-diatonic-chords',
            curatorNote: 'The seven chords every key gives you for free.',
            focusSkills: [],
          },
          {
            contentSlug: 'omt-seventh-chords',
            curatorNote: null,
            focusSkills: [],
          },
        ],
      },
      {
        title: 'How Harmony Moves',
        description: null,
        items: [
          {
            contentSlug: 'omt-cadences',
            curatorNote: "Cadences are harmony's punctuation.",
            focusSkills: [],
          },
          {
            contentSlug: 'omt-voice-leading',
            curatorNote:
              'Smooth voice leading is what makes progressions sound good. skills: [analysis]',
            focusSkills: ['analysis'],
          },
        ],
      },
    ],
  },
  {
    slug: 'piano-fundamentals',
    title: 'Piano Fundamentals',
    kind: 'course',
    summary: 'The core technique and first repertoire every pianist needs.',
    bodyMdx:
      'Before the great repertoire comes the groundwork: even scales, independent fingers, and a first taste of\nreal pieces. This course pairs the essential drills with the tunes that put them to use.',
    curatorName: 'The Music Repository',
    curatorBio: 'The foundational skills, in the order they build on each other.',
    featured: false,
    difficultyMin: 1,
    difficultyMax: 4,
    estMinutes: 300,
    accent: 'heritage',
    tags: ['piano', 'beginner', 'technique', 'repertoire'],
    facets: {
      era: ['Baroque', 'Classical'],
      genre: ['classical'],
      technique: ['scales', 'finger-independence', 'reading'],
      mood: ['focused'],
    },
    outcomes: [
      'Play a two-octave major scale evenly',
      'Build finger strength and independence',
      'Perform two complete beginner pieces',
    ],
    sections: [
      {
        title: 'Technique',
        description: null,
        items: [
          {
            contentSlug: 'c-major-scale-two-octaves',
            curatorNote: 'The reference scale — master the thumb-under. skills: [scales]',
            focusSkills: ['scales'],
          },
          {
            contentSlug: 'czerny-op-599-no-1',
            curatorNote: 'A tiny study to warm up with daily.',
            focusSkills: [],
          },
          {
            contentSlug: 'hanon-virtuoso-pianist-no-1',
            curatorNote: 'Slow and relaxed builds the most strength. skills: [finger-independence]',
            focusSkills: ['finger-independence'],
          },
        ],
      },
      {
        title: 'First Repertoire',
        description: null,
        items: [
          {
            contentSlug: 'bach-minuet-in-g',
            curatorNote: 'Detached left hand, singing right. skills: [reading]',
            focusSkills: ['reading'],
          },
          {
            contentSlug: 'beethoven-fur-elise-opening',
            curatorNote: 'The famous opening — mind the pedal. skills: [pedaling]',
            focusSkills: ['pedaling'],
          },
        ],
      },
    ],
  },
  {
    slug: 'public-domain-folk-songbook',
    title: 'Public-Domain Folk Songbook',
    kind: 'songlist',
    summary: 'Timeless traditional tunes everyone knows — easy and rewarding to play.',
    bodyMdx:
      'Folk songs are where music lives in everyday life. These public-domain melodies are simple to learn,\nendlessly arrangeable, and instantly recognisable — perfect for playing, singing, and sharing.',
    curatorName: 'The Music Repository',
    curatorBio: 'A songlist of beloved public-domain melodies for any instrument.',
    featured: false,
    difficultyMin: 1,
    difficultyMax: 4,
    estMinutes: 240,
    accent: 'warm-minimal',
    tags: ['folk', 'traditional', 'songs', 'singalong'],
    facets: {
      era: ['Traditional'],
      genre: ['folk'],
      technique: ['melody', 'accompaniment'],
      mood: ['nostalgic', 'warm'],
    },
    outcomes: [
      'Build a repertoire of songs you can play from memory',
      'Practise phrasing on simple, singable melodies',
      'Accompany a melody with basic chords',
    ],
    sections: [
      {
        title: 'Ballads & Airs',
        description: null,
        items: [
          {
            contentSlug: 'greensleeves-trad',
            curatorNote: 'The most famous English air — mind the minor/major shifts.',
            focusSkills: [],
          },
          {
            contentSlug: 'danny-boy',
            curatorNote: null,
            focusSkills: [],
          },
          {
            contentSlug: 'scarborough-fair',
            curatorNote: 'A modal classic in Dorian.',
            focusSkills: [],
          },
          {
            contentSlug: 'shenandoah',
            curatorNote: 'A wide, rolling American ballad.',
            focusSkills: [],
          },
        ],
      },
      {
        title: 'Hymns & Spirituals',
        description: null,
        items: [
          {
            contentSlug: 'amazing-grace-trad',
            curatorNote: 'A pentatonic melody — playable in one position.',
            focusSkills: [],
          },
          {
            contentSlug: 'simple-gifts',
            curatorNote: 'The Shaker tune Copland made famous.',
            focusSkills: [],
          },
          {
            contentSlug: 'swing-low-sweet-chariot',
            curatorNote: null,
            focusSkills: [],
          },
        ],
      },
      {
        title: 'Sing-Alongs',
        description: null,
        items: [
          {
            contentSlug: 'house-of-the-rising-sun',
            curatorNote: 'A brooding minor classic.',
            focusSkills: [],
          },
          {
            contentSlug: 'when-the-saints-go-marching-in',
            curatorNote: 'Bright and easy — great for a first jam.',
            focusSkills: [],
          },
        ],
      },
    ],
  },
  {
    slug: 'ragtime-and-early-jazz-piano',
    title: 'Ragtime & Early Jazz Piano',
    kind: 'course',
    summary: 'Scott Joplin and friends — the syncopated roots of American piano.',
    bodyMdx:
      'Ragtime pairs a steady march-like left hand with a syncopated right — the sound that became jazz. This\nanthology starts with the gentler rags and works up to the classics, all drawn from the public domain.',
    curatorName: 'The Music Repository',
    curatorBio: 'An anthology of public-domain rags, easiest first.',
    featured: false,
    difficultyMin: 4,
    difficultyMax: 8,
    estMinutes: 420,
    accent: 'warm-minimal',
    tags: ['ragtime', 'piano', 'syncopation'],
    facets: {
      era: ['Modern'],
      genre: ['ragtime', 'jazz'],
      technique: ['syncopation', 'stride', 'articulation'],
      mood: ['playful'],
    },
    outcomes: [
      'Keep a steady stride bass under a syncopated melody',
      'Read and voice dense chordal writing',
      'Play a complete Joplin rag up to tempo',
    ],
    sections: [
      {
        title: 'Gentle Rags',
        description: null,
        items: [
          {
            contentSlug: 'joplin-solace',
            curatorNote:
              'A slow "Mexican serenade" — start here for the feel. skills: [syncopation]',
            focusSkills: ['syncopation'],
          },
          {
            contentSlug: 'joplin-the-entertainer',
            curatorNote: null,
            focusSkills: ['stride'],
          },
        ],
      },
      {
        title: 'The Classics',
        description: null,
        items: [
          {
            contentSlug: 'joplin-maple-leaf-rag',
            curatorNote:
              'The rag that started it all — take the bass slowly. skills: [stride, articulation]',
            focusSkills: ['stride', 'articulation'],
          },
          {
            contentSlug: 'joplin-pineapple-rag',
            curatorNote: null,
            focusSkills: [],
          },
          {
            contentSlug: 'joplin-ragtime-dance',
            curatorNote: null,
            focusSkills: [],
          },
        ],
      },
      {
        title: 'Beyond Joplin',
        description: null,
        items: [
          {
            contentSlug: 'lamb-american-beauty-rag',
            curatorNote: "Joseph Lamb's lush harmonies stretch the style.",
            focusSkills: [],
          },
          {
            contentSlug: 'scott-frog-legs-rag',
            curatorNote: "James Scott's brilliant, virtuosic writing.",
            focusSkills: [],
          },
        ],
      },
    ],
  },
  {
    slug: 'romantic-piano-miniatures',
    title: 'Romantic Piano Miniatures',
    kind: 'course',
    summary: 'Short, expressive gems from Chopin, Schumann and Schubert.',
    bodyMdx:
      'The Romantic miniature is where you learn to sing at the piano — to shape a melody, breathe with rubato,\nand colour the sound with the pedal. These short character pieces reward patience and a good ear.',
    curatorName: 'The Music Repository',
    curatorBio: 'Character pieces that teach tone, rubato and pedalling.',
    featured: false,
    difficultyMin: 3,
    difficultyMax: 7,
    estMinutes: 360,
    accent: 'hybrid',
    tags: ['piano', 'romantic', 'expression'],
    facets: {
      era: ['Romantic'],
      genre: ['classical'],
      technique: ['pedaling', 'rubato', 'voicing', 'tone'],
      mood: ['reflective', 'romantic'],
    },
    outcomes: [
      'Voice a cantabile melody over accompaniment',
      'Use the sustain pedal for colour, not blur',
      'Shape phrases with tasteful rubato',
    ],
    sections: [
      {
        title: 'First Steps into Romanticism',
        description: null,
        items: [
          {
            contentSlug: 'schumann-the-wild-horseman-op68',
            curatorNote: 'Crisp and energetic — a great character study. skills: [articulation]',
            focusSkills: ['articulation'],
          },
          {
            contentSlug: 'schubert-landler-d366',
            curatorNote: null,
            focusSkills: [],
          },
        ],
      },
      {
        title: 'Singing at the Piano',
        description: null,
        items: [
          {
            contentSlug: 'chopin-prelude-e-minor-op28-no4',
            curatorNote: 'Slow harmonic descent — voice the top line. skills: [voicing, pedaling]',
            focusSkills: ['voicing', 'pedaling'],
          },
          {
            contentSlug: 'satie-gymnopedie-no1',
            curatorNote: null,
            focusSkills: ['pedaling', 'tone'],
          },
        ],
      },
      {
        title: 'The Full Romantic Voice',
        description: null,
        items: [
          {
            contentSlug: 'chopin-waltz-a-minor-b150',
            curatorNote: 'Elegant and singable — a first Chopin waltz. skills: [rubato]',
            focusSkills: ['rubato'],
          },
          {
            contentSlug: 'chopin-nocturne-op9-no2',
            curatorNote:
              'The nocturne touch: melody floating over a rocking bass. skills: [rubato, voicing]',
            focusSkills: ['rubato', 'voicing'],
          },
        ],
      },
    ],
  },
  {
    slug: 'scales-and-arpeggios-workout',
    title: 'Scales & Arpeggios Daily Workout',
    kind: 'course',
    summary: 'The technical foundation — cycle these to build even, confident fingers.',
    bodyMdx:
      'Technique is freedom: the more automatic your scales and arpeggios, the more attention you have for\nmusic. Rotate through this workout daily — a few minutes on each — and keep everything even and relaxed.',
    curatorName: 'The Music Repository',
    curatorBio: 'A drill set to rotate through as a daily warm-up.',
    featured: false,
    difficultyMin: 1,
    difficultyMax: 5,
    estMinutes: 180,
    accent: 'warm-minimal',
    tags: ['technique', 'scales', 'piano', 'warm-up'],
    facets: {
      era: ['Modern'],
      genre: ['classical'],
      technique: ['scales', 'arpeggios', 'evenness', 'finger-independence'],
      mood: ['focused'],
    },
    outcomes: [
      'Play major scales fluently across the keyboard',
      'Keep tone even across the thumb-under',
      'Build finger independence and stamina',
    ],
    sections: [
      {
        title: 'Scales',
        description: null,
        items: [
          {
            contentSlug: 'c-major-scale-two-octaves',
            curatorNote:
              'The reference scale — perfect the thumb-under here first. skills: [evenness]',
            focusSkills: ['evenness'],
          },
          {
            contentSlug: 'major-scales-all-keys',
            curatorNote: null,
            focusSkills: [],
          },
          {
            contentSlug: 'chromatic-scale-exercise',
            curatorNote: 'Light, even fingers — no accents.',
            focusSkills: [],
          },
        ],
      },
      {
        title: 'Independence & Stamina',
        description: null,
        items: [
          {
            contentSlug: 'hanon-virtuoso-pianist-no-1',
            curatorNote:
              'Slow, loud, and relaxed builds the most strength. skills: [finger-independence]',
            focusSkills: ['finger-independence'],
          },
        ],
      },
    ],
  },
  {
    slug: 'the-blues-roadmap',
    title: 'The Blues Roadmap',
    kind: 'path',
    summary: 'From the 12-bar form to real blues vocabulary, for piano and beyond.',
    bodyMdx:
      'The blues is a feel and a form. This path starts with the 12-bar structure, adds the scale that makes\nit sing, then puts it all together with a left-hand bass line and a classic blues standard to play.',
    curatorName: 'The Music Repository',
    curatorBio: 'A step-by-step route into playing and improvising the blues.',
    featured: true,
    difficultyMin: 2,
    difficultyMax: 5,
    estMinutes: 240,
    accent: 'warm-minimal',
    tags: ['blues', 'improvisation', 'piano', 'bass'],
    facets: {
      era: ['Modern'],
      genre: ['blues'],
      technique: ['improvisation', 'comping', 'walking-bass'],
      mood: ['soulful'],
    },
    outcomes: [
      'Play a 12-bar blues in multiple keys',
      'Improvise with the blues scale over the form',
      'Build a simple walking bass line',
    ],
    sections: [
      {
        title: 'The Form',
        description: null,
        items: [
          {
            contentSlug: '12-bar-blues-in-a',
            curatorNote: 'Loop it until the chord changes are automatic. skills: [form, comping]',
            focusSkills: ['form', 'comping'],
          },
        ],
      },
      {
        title: 'The Sound',
        description: null,
        items: [
          {
            contentSlug: 'blues-scale-piano',
            curatorNote: 'Learn it in one key, then move it around. skills: [improvisation]',
            focusSkills: ['improvisation'],
          },
          {
            contentSlug: 'minor-pentatonic-scale-shapes',
            curatorNote: 'The blues scale is this plus one note.',
            focusSkills: [],
          },
        ],
      },
      {
        title: 'Putting It Together',
        description: null,
        items: [
          {
            contentSlug: 'walking-bass-basics',
            curatorNote:
              'A steady quarter-note bass turns changes into groove. skills: [walking-bass]',
            focusSkills: ['walking-bass'],
          },
          {
            contentSlug: 'handy-st-louis-blues',
            curatorNote: 'A real standard to apply everything to.',
            focusSkills: [],
          },
        ],
      },
    ],
  },
  {
    slug: 'ukulele-starter-kit',
    title: 'Ukulele Starter Kit',
    kind: 'path',
    summary: 'From your first four chords to strumming songs on the uke.',
    bodyMdx:
      'The ukulele is the friendliest instrument to start on — four strings, soft nylon, and songs within reach\nin an afternoon. This path takes you from your first chords to strumming and picking real tunes.',
    curatorName: 'The Music Repository',
    curatorBio: 'The fastest happy path onto the ukulele.',
    featured: false,
    difficultyMin: 1,
    difficultyMax: 3,
    estMinutes: 150,
    accent: 'warm-minimal',
    tags: ['ukulele', 'beginner', 'chords', 'strumming'],
    facets: {
      era: ['Traditional'],
      genre: ['folk'],
      technique: ['chords', 'strumming', 'fingerpicking'],
      mood: ['cheerful'],
      instrument: ['ukulele'],
    },
    outcomes: [
      'Fret and change four essential chords cleanly',
      'Keep a steady strumming pattern',
      'Play a simple fingerpicked melody',
    ],
    sections: [
      {
        title: 'First Chords',
        description: null,
        items: [
          {
            contentSlug: 'ukulele-first-four-chords',
            curatorNote: 'C, G, Am, F unlock hundreds of songs. skills: [chords]',
            focusSkills: ['chords'],
          },
          {
            contentSlug: 'ukulele-strumming-patterns',
            curatorNote: 'Start with a slow down-down-up. skills: [strumming]',
            focusSkills: ['strumming'],
          },
        ],
      },
      {
        title: 'Notes & Picking',
        description: null,
        items: [
          {
            contentSlug: 'ukulele-major-scale-shapes',
            curatorNote: 'Learn where the notes live.',
            focusSkills: [],
          },
          {
            contentSlug: 'ukulele-fingerpicking-primer',
            curatorNote: 'Thumb on the low strings, fingers on top. skills: [fingerpicking]',
            focusSkills: ['fingerpicking'],
          },
        ],
      },
      {
        title: 'Your First Song',
        description: null,
        items: [
          {
            contentSlug: 'aloha-oe-ukulele',
            curatorNote: "Queen Lili'uokalani's classic — the uke's home tune.",
            focusSkills: [],
          },
        ],
      },
    ],
  },
  {
    slug: 'your-first-piano-pieces',
    title: 'Your First 10 Piano Pieces',
    kind: 'path',
    summary: 'The most rewarding pieces to learn first — in a sensible order.',
    bodyMdx:
      "A gentle, motivating on-ramp for the brand-new pianist. Each piece adds one new idea — a hand shift,\na two-hand texture, a longer phrase — so you build real skills while playing music you'll recognise.\nWork through them in order and revisit the early ones as warm-ups.",
    curatorName: 'The Music Repository',
    curatorBio: 'Curated from the public-domain repertoire teachers reach for first.',
    featured: true,
    difficultyMin: 1,
    difficultyMax: 3,
    estMinutes: 300,
    accent: 'heritage',
    tags: ['piano', 'beginner', 'repertoire'],
    facets: {
      era: ['Classical', 'Romantic'],
      genre: ['classical'],
      technique: ['reading', 'hand-independence', 'phrasing'],
      mood: ['uplifting'],
    },
    outcomes: [
      'Play ten complete pieces with steady time',
      'Read simple treble and bass staves fluently',
      'Coordinate the hands in short two-part textures',
      'Build a repeatable daily practice habit',
    ],
    sections: [
      {
        title: 'First Notes',
        description: 'Single-line and one-hand-friendly tunes to build confidence at the keys.',
        items: [
          {
            contentSlug: 'beethoven-ode-to-joy',
            curatorNote: null,
            focusSkills: ['reading', 'phrasing'],
          },
          {
            contentSlug: 'bach-minuet-in-g',
            curatorNote: 'Keep the left hand light under the melody.',
            focusSkills: [],
          },
        ],
      },
      {
        title: 'Two Hands Together',
        description:
          'Pieces that ask the hands to cooperate — the real beginning of piano playing.',
        items: [
          {
            contentSlug: 'burgmuller-la-candeur-op100-no1',
            curatorNote: 'Let the melody sing over an even accompaniment. skills: [voicing]',
            focusSkills: ['voicing'],
          },
          {
            contentSlug: 'schumann-melody-op68-no1',
            curatorNote: 'Aim for a smooth, connected right-hand line.',
            focusSkills: [],
          },
          {
            contentSlug: 'czerny-op-599-no-1',
            curatorNote: 'A tiny study — use it as a daily warm-up.',
            focusSkills: [],
          },
        ],
      },
      {
        title: 'First Milestones',
        description: 'Short, complete pieces that feel like an achievement.',
        items: [
          {
            contentSlug: 'clementi-sonatina-op36-no1-1st-mvt',
            curatorNote: 'Your first taste of classical form.',
            focusSkills: [],
          },
          {
            contentSlug: 'beethoven-fur-elise-opening',
            curatorNote: 'The famous opening — mind the pedal changes. skills: [pedaling]',
            focusSkills: ['pedaling'],
          },
        ],
      },
    ],
  },
];
