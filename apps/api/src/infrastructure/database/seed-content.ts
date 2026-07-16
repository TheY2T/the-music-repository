/**
 * GENERATED FILE — do not edit by hand.
 * Source: src/infrastructure/database/content/*.md
 * Regenerate: pnpm --filter @TheY2T/tmr-api content:build
 *
 * Enriched catalogue content authored via research (83 items): the Markdown body
 * (rendered on the detail page), structured facts (`details`), and suggested tags. Applied by the
 * seed on top of the base metadata in seed-data.ts.
 */
import type { SeedContentExtra } from './content-details';

export const SEED_CONTENT: Record<string, SeedContentExtra> = {
  "12-bar-blues-in-a": {
    "bodyMdx": "## The most important form in blues and rock\n\nThe **12-bar blues** is a repeating 12-measure chord pattern built on just three chords: the **I, IV, and V** of the key. Learn it once and you can play along with a huge swath of blues, early rock and roll, and countless jams. We'll play it in the key of **A**, a great fit for guitar because all three chords sit near the open strings.\n\n## The three chords\n\nIn A, the I–IV–V chords are `A`, `D`, and `E`. Blues almost always uses **dominant seventh** chords for their gritty, unresolved sound, so we play:\n\n| Degree | Chord | Notes |\n| --- | --- | --- |\n| I | A7 | A–C♯–E–G |\n| IV | D7 | D–F♯–A–C |\n| V | E7 | E–G♯–B–D |\n\nTap each shape in the diagrams below to hear its voicing before you play the form:\n\n<div data-tmr-embed=\"0\"></div>\n\n## The 12-bar pattern\n\nEach measure gets four beats (4/4). The standard pattern is:\n\n| Bars | 1 | 2 | 3 | 4 |\n| --- | --- | --- | --- | --- |\n| 1–4 | A7 | A7 | A7 | A7 |\n| 5–8 | D7 | D7 | A7 | A7 |\n| 9–12 | E7 | D7 | A7 | E7 |\n\nRead it row by row, one chord per bar. The last two bars — `A7` then `E7` — are the **turnaround**, which winds the phrase back to the top so the form loops. Hit play on the interactive form below to hear it loop and follow the highlighted bar.\n\n<div data-tmr-embed=\"1\"></div>\n\n## Two common variations\n\n- **Quick change (quick four):** play `D7` in bar 2 instead of staying on `A7`. This adds early movement:\n  `| A7 | D7 | A7 | A7 | D7 | D7 | ...`\n- **Final-bar options:** on the very last time through, players often end on `A7` instead of the `E7` turnaround to signal \"we're done.\"\n\nBoth are optional — master the plain 12 bars first.\n\n## Feel: the shuffle\n\nBlues usually **swings**. Instead of even eighth notes, play a long-short \"shuffle\" feel (think \"doo-ba, doo-ba\"). A classic accompaniment is the **boogie shuffle**: on each chord, alternate the root with the fifth and then the sixth. On A7, that means fretting the low strings and rocking between **A5** (root–fifth) and **A6** (root–sixth), two eighth-notes per beat played long–short. Click out the shuffle pulse below and feel the swing, then apply the moving A5→A6 shape:\n\n<div data-tmr-embed=\"2\"></div>\n\nThis single moving pattern, shifted to the D and E chords, is the sound of a thousand blues tunes.\n\n## How the form breathes\n\nNotice the shape: four bars establishing home (I), two bars of departure (IV), two bars back home (I), then the climb through V–IV–I in the last four bars before the turnaround. That tension-and-release arc — leave home, build tension on the dominant, return — is why the form feels so satisfying no matter how many times it repeats. Singers often phrase a lyric across each four-bar unit in a call-and-response pattern.\n\n## Try it\n\nSet a [metronome](/tools/metronome) to a slow 70 BPM with a shuffle feel, and strum the plain 12-bar pattern above, one chord per bar, until the changes are automatic. Then loop it and solo over the top using the **A minor pentatonic** scale (see the minor-pentatonic-scale-shapes lesson) — it fits the whole progression. Tap the three chord shapes above to hear each voicing, then hit play on the looping 12-bar form to lock in the changes. Pair this with the bass-blues-line lesson to hear the full rhythm section.",
    "details": {
      "key": "A",
      "form": "lesson",
      "timeSignature": "4/4",
      "related": [
        "omt-seventh-chords",
        "minor-pentatonic-scale-shapes",
        "blues-scale-piano",
        "bass-blues-line-basics",
        "omt-diatonic-chords"
      ],
      "embeds": [
        {
          "tool": "chord-diagrams",
          "title": "The three chords",
          "caption": "Dominant 7ths give the blues its bite.",
          "chords": [
            "A7",
            "D7",
            "E7"
          ]
        },
        {
          "tool": "progression",
          "title": "Play the 12-bar form",
          "caption": "Loops the standard 12-bar blues in A — follow the highlighted bar.",
          "key": "A",
          "chords": [
            "A7",
            "A7",
            "A7",
            "A7",
            "D7",
            "D7",
            "A7",
            "A7",
            "E7",
            "D7",
            "A7",
            "E7"
          ]
        },
        {
          "tool": "rhythm",
          "title": "The shuffle pulse",
          "caption": "Two eighth-notes per beat, played long–short — the boogie shuffle. Click it out at tempo to internalise the swing.",
          "pattern": [
            "eighth",
            "eighth",
            "eighth",
            "eighth",
            "eighth",
            "eighth",
            "eighth",
            "eighth"
          ],
          "tempo": 80
        }
      ]
    },
    "extraTags": [
      "beginner",
      "blues"
    ]
  },
  "aloha-oe-ukulele": {
    "bodyMdx": "## About this song\n\"Aloha ʻOe\" (\"Farewell to Thee\") is the most famous composition of Queen Liliʻuokalani (1838–1917), the last sovereign monarch of the Kingdom of Hawaiʻi and an accomplished composer. She wrote it around 1878 — a surviving manuscript note in her hand reads \"Composed at Maunawili 1878\" — reportedly inspired by a tender farewell embrace she witnessed at the Boyd ranch in Maunawili, on the windward side of Oʻahu. It began as a *mele hoʻoipoipo*, a love song about parting. After the overthrow of the Hawaiian monarchy in 1893, however, \"Aloha ʻOe\" took on far deeper meaning for Hawaiians as a symbol of loss and enduring connection to the land and the nation. It is a treasured piece of Hawaiian heritage and should be approached with that cultural weight in mind.\n\n## What to listen for\nThe song pairs a flowing verse with its instantly recognisable chorus (\"Aloha ʻoe, aloha ʻoe...\"). The melody is graceful and lyrical, with the gentle sway characteristic of Hawaiian song, set in an easygoing 4/4. Harmonically it is warm and clear, moving through the primary chords with the sweet, resolving cadences typical of the *hapa haole* / island style.\n\n## What you'll learn\nOn the ukulele this is a rewarding step up from a strict three-chord song. You will practise smooth chord changes across a verse and chorus, a relaxed island strum, and phrasing a singable melody with feeling. It is also a lovely introduction to the Hawaiian song tradition and its pronunciation.\n\n## How to play it\nIt sits comfortably on ukulele in C or G major — in C, work with C, F, G7 plus a D7 that colours the verse. Use a gentle, swaying strum (a soft island or calypso pattern) rather than anything driving, and let the chorus open up warmly. Take care with the Hawaiian lyrics and their vowels, and keep the whole thing unhurried and heartfelt.\n\n## If you like this",
    "details": {
      "key": "C major",
      "era": "Folk",
      "form": "Verse / chorus",
      "timeSignature": "4/4",
      "composer": "Queen Liliʻuokalani of Hawaiʻi",
      "composerDates": "Liliʻuokalani 1838–1917",
      "composedYear": "c. 1878",
      "related": [
        "danny-boy",
        "shenandoah",
        "amazing-grace-trad"
      ]
    },
    "extraTags": [
      "public-domain",
      "hawaiian",
      "folk",
      "ukulele"
    ]
  },
  "amazing-grace-trad": {
    "bodyMdx": "## About this song\n\"Amazing Grace\" is one of the most beloved hymns in the English-speaking world. The words were written in late 1772 by John Newton (1725–1807), an English clergyman who had once been a slave-ship captain before a dramatic religious conversion. The hymn is his spiritual autobiography in verse — \"I once was lost, but now am found\" — and it first appeared in print in the 1779 collection *Olney Hymns*, which Newton produced with the poet William Cowper. The melody most of us sing today is a different, later story: the American folk tune known as \"New Britain,\" pentatonic and Appalachian in flavour, which was wedded to Newton's text in the United States around the 1830s. Across two centuries more than twenty tunes have carried these words, but \"New Britain\" is the one that endured.\n\n## What to listen for\nThe tune is pentatonic — built from a five-note scale — which is why it sits so naturally on the voice and on beginner-friendly instruments. It is in a lilting 3/4 (waltz) time, and its shape outlines simple triads, rising gently at the start of each phrase and settling back down. The harmony is uncomplicated: in G major you can accompany the whole hymn with just G, C, and D chords. There is no chorus; each verse uses the identical melody (a strophic form).\n\n## What you'll learn\nThis is an ideal early song for phrasing and breath. You will practise shaping a long, arching melodic line, playing expressively in 3/4, and — on guitar or ukulele — changing smoothly between the three primary chords in time with a slow beat.\n\n## How to play it\nIn G major the chords are G, C, and D (add D7 for a stronger pull back to G). Pianists can play the melody in the right hand over simple broken or block chords in the left. Guitarists and ukulele players can strum one gentle chord per bar, or fingerpick a slow arpeggio to suit the reflective mood. Keep the tempo unhurried, lean into the grace notes, and let the phrases breathe.\n\n<div data-tmr-embed=\"0\"></div>\n\n## If you like this",
    "details": {
      "key": "G major",
      "era": "Traditional",
      "form": "Strophic (verse only, no refrain)",
      "timeSignature": "3/4",
      "composer": "John Newton (words); melody 'New Britain' (American folk tune)",
      "composerDates": "John Newton 1725–1807",
      "composedYear": "words 1772; 'New Britain' tune published 1835",
      "related": [
        "swing-low-sweet-chariot",
        "simple-gifts",
        "shenandoah"
      ],
      "embeds": [
        {
          "tool": "progression",
          "title": "The chords behind the hymn",
          "caption": "A gentle I–IV–V in G — the harmonic backbone of the melody. Play it through slowly.",
          "key": "G",
          "chords": [
            "G",
            "C",
            "G",
            "D7",
            "G"
          ]
        }
      ]
    },
    "extraTags": [
      "public-domain",
      "beginner",
      "hymn",
      "spiritual"
    ]
  },
  "bach-invention-no1-bwv772": {
    "bodyMdx": "## About this piece\nBach wrote his fifteen two-part Inventions as teaching pieces — first for his own children and pupils, gathered in a fair copy around 1723. In his preface he set out exactly what they were for: to help players achieve a \"cantabile\" (singing) style of playing and, crucially, to learn to handle two independent voices at once. Invention No. 1 in C major opens the set and is one of the most-taught pieces in all of keyboard music. It packs an astonishing amount of craft into barely two minutes.\n\n## What to listen for\nEverything grows from a single short idea — a rising, turning figure heard in the very first bar. Bach passes this motif back and forth between the hands, turns it upside down (inversion), and threads it through different keys, always returning home to C major. There is no \"melody plus accompaniment\" here: both hands carry equal, conversational lines. Listen for the moment one hand states the subject while the other answers or comments — that dialogue is the whole point.\n\n## What you'll learn\nThis is the classic training ground for two-voice counterpoint and true hand independence — each hand phrasing, articulating, and shaping on its own. You'll sharpen even fingerwork, motif recognition, and the ability to bring out whichever voice currently \"has the tune.\"\n\n## How to practise\nHands separately, always, and for longer than feels necessary — you must know each line as a complete melody in its own right. Sing or hum one hand while you play the other to test your independence. Take it slowly and keep the two voices balanced in volume so neither drowns the other; when the subject enters, lean into it slightly. Watch the crossing points where the hands come close together on the keyboard. Build tempo only once both lines are clean on their own and together.\n\n## If you like this\nPair it with the serene *Prelude in C major, BWV 846* — the same key, a gentler challenge. For a lighter Baroque dance, the *Minuet in G* is a good stepping stone downward.",
    "details": {
      "key": "C major",
      "era": "Baroque",
      "form": "Two-part Invention (contrapuntal keyboard piece)",
      "timeSignature": "4/4",
      "composer": "Johann Sebastian Bach",
      "composerDates": "1685–1750",
      "composedYear": "c. 1720–1723",
      "related": [
        "bach-prelude-c-major-bwv-846",
        "bach-minuet-in-g",
        "mozart-sonata-k545-1st-mvt"
      ]
    },
    "extraTags": [
      "public-domain",
      "intermediate"
    ]
  },
  "bach-minuet-in-g": {
    "bodyMdx": "## About this piece\nAlmost every pianist meets this cheerful little dance sooner or later. It comes from the *Notebook for Anna Magdalena Bach* — a home album Johann Sebastian Bach kept for his second wife around 1725, filled with pieces for the family to play and study. For generations it was published as \"Bach's Minuet in G,\" but modern scholarship has shown it was actually written by Christian Petzold, a Dresden organist Bach admired; the Bachs simply copied it into their notebook because they liked it. So the catalogue number BWV Anh. 114 marks it as an \"appendix\" work associated with Bach rather than composed by him. None of that dims its charm: it is a small, perfectly balanced piece of the late Baroque.\n\n## What to listen for\nIt is a minuet — a courtly dance in a graceful, moderate 3/4, one gentle pulse per bar. The key is G major, bright and open. Listen for the clear two-part texture: a singing right-hand tune over a supportive, walking left hand. The form is simple binary, two repeated halves; the first travels to the dominant (D major) and the second finds its way home. You may recognise the tune — it was borrowed for the 1960s pop song \"A Lover's Concerto.\"\n\n## What you'll learn\nThis piece is a wonderful first taste of Baroque style: even, independent hands, clean articulation, and phrasing that breathes at the ends of four-bar units. You'll practise shaping a melodic line, keeping a steady dance pulse, and coordinating two voices that move at different speeds.\n\n## How to practise\nLearn hands separately first — the left hand's quarter-note patterns are easy to underestimate, so make them smooth and unhurried. Keep the tempo moderate and danceable; resist rushing the running eighth notes in the right hand. Aim for a light, slightly detached touch rather than heavy legato — Baroque keyboard music breathes best with a little air between notes. Shape each phrase toward its high point, then ease off. Once hands are secure separately, join them slowly and only speed up when the coordination feels effortless.\n\n## If you like this\nTry Bach's *Prelude in C major, BWV 846* for flowing broken chords, or step up to the two-voice discipline of *Invention No. 1, BWV 772*. Mozart's *Minuet in F, K. 2* offers the same dance in a Classical accent.",
    "details": {
      "key": "G major",
      "era": "Baroque",
      "form": "Minuet",
      "timeSignature": "3/4",
      "composer": "Christian Petzold (long attributed to J. S. Bach)",
      "composerDates": "Petzold 1677–1733; Bach 1685–1750",
      "composedYear": "c. 1725 (copied into the notebook)",
      "related": [
        "bach-invention-no1-bwv772",
        "bach-prelude-c-major-bwv-846",
        "mozart-minuet-in-f-k2"
      ]
    },
    "extraTags": [
      "public-domain",
      "beginner"
    ]
  },
  "bach-prelude-c-major-bwv-846": {
    "bodyMdx": "## About this piece\nThis is the very first piece in *The Well-Tempered Clavier* (Book 1, 1722), Bach's monumental cycle of preludes and fugues in all 24 major and minor keys — a demonstration that a well-tuned keyboard could play convincingly in every key. The C major prelude opens the whole collection and has become one of the most famous pieces ever written for keyboard. It is deceptively simple: no tune, no fast fingerwork, just a slow procession of broken chords. Charles Gounod later laid a soaring vocal melody over it to create the \"Ave Maria\" familiar from weddings, which tells you how beautifully self-sufficient Bach's harmony already is.\n\n## What to listen for\nThe whole piece is one continuous stream of gently rolling arpeggios in a steady 4/4. Each bar (with its repeat) is a single chord spread out note by note. The magic is entirely harmonic: listen to how the chords lean, resolve, and drift through mild tensions before settling home to C major. There is a long dominant pedal near the end where the bass holds firm while the harmony strains above it — the calm before the final cadence.\n\n## What you'll learn\nThis is a superb study in evenness, control, and voicing within a broken-chord texture. You'll develop a relaxed, rotating hand motion, learn to hear harmony as it unfolds, and practise sustaining a mood over a long, unbroken line.\n\n## How to practise\nFirst, block each bar into its solid chord so you can see and hear the harmony — play the chords in sequence before you unfold them. Then aim for perfect evenness: no note louder than its neighbours, the pulse absolutely steady. Keep the top notes very slightly present so a faint melodic thread emerges from the pattern. Use gentle finger legato and a little pedal to bind each chord without blurring into the next. Slow and serene wins here; speed would spoil it.\n\n## If you like this\nFor more Bach counterpoint, move to *Invention No. 1, BWV 772* (also in C major). If it's the singing, arpeggiated calm you love, Chopin's *Nocturne Op. 9 No. 2* carries that feeling into the Romantic era.",
    "details": {
      "key": "C major",
      "era": "Baroque",
      "form": "Prelude (from The Well-Tempered Clavier, Book 1)",
      "timeSignature": "4/4",
      "composer": "Johann Sebastian Bach",
      "composerDates": "1685–1750",
      "composedYear": "1722",
      "related": [
        "bach-invention-no1-bwv772",
        "bach-minuet-in-g",
        "chopin-nocturne-op9-no2"
      ]
    },
    "extraTags": [
      "public-domain",
      "intermediate"
    ]
  },
  "bass-blues-line-basics": {
    "bodyMdx": "## From root–fifth to a real blues line\n\nOnce you can lock a root–fifth pattern to the beat, the next step is the **boogie blues bass line** — the driving, instantly recognisable figure under a 12-bar blues. It takes the root–fifth idea and adds the **sixth** and **flat seventh**, turning a static bass into a rolling groove. We'll build it in **A**, matching the 12-bar-blues-in-A lesson. Standard bass tuning `E–A–D–G`.\n\n## The building blocks: a boogie cell\n\nOver each chord, the classic pattern climbs root → third → fifth → sixth, then (often) up to the ♭7 and back. For an `A` chord the notes are:\n\n| Note | A | C♯ | E | F♯ | (G) |\n| --- | --- | --- | --- | --- | --- |\n| Degree | 1 (root) | 3 | 5 | 6 | ♭7 |\n\nClimb A → C♯ → E → F♯, then (often) up to `G` (♭7) and back down through F♯ → E → C♯.\n\nPlayed as steady quarter notes or a swung shuffle, one note per beat:\n\n| Beat | 1 | 2 | 3 | 4 |\n| --- | --- | --- | --- | --- |\n| Bar 1 (up) | A | C♯ | E | F♯ |\n| Bar 2 (back down) | A | F♯ | E | C♯ |\n\nThat two-bar up-and-down shape is the engine of boogie-woogie and blues. On the fretboard it sits neatly under one hand position. Play the interactive score below to hear the first four bars of the cell rooted on A.\n\n<div data-tmr-embed=\"0\"></div>\n\n## The movable shape\n\nThe beauty is that the *same* fingering shifts to every chord. Slide the whole cell so its root lands on the new chord:\n\n- **A7** → root on the E string, 5th fret\n- **D7** → root on the A string, 5th fret\n- **E7** → root on the A string, 7th fret\n\nLearn the shape once and you can play all three chords of the blues without rethinking it.\n\n## Mapping it onto the 12-bar form\n\nApply the boogie cell to the 12-bar blues in A, one chord per bar:\n\n| Bars | 1 | 2 | 3 | 4 |\n| --- | --- | --- | --- | --- |\n| 1–4 | A | A | A | A |\n| 5–8 | D | D | A | A |\n| 9–12 | E | D | A | E |\n\nEach bar, run the up-and-down boogie figure rooted on that chord. On the last bar (`E`) you can play a **turnaround** walk-up back to A — e.g. `E – F♯ – G – G♯` leading into the low `A` at the top of the form.\n\n## Add the shuffle feel\n\nBlues almost always **swings**: play the eighth notes long-short rather than even, or keep quarter notes but with a laid-back, behind-the-beat feel. The boogie pattern in a shuffle rhythm is the sound of a 1950s rock-and-roll bass line.\n\n## Spicing it up\n\n- **Chromatic approach:** slide into the next chord's root from a fret below (e.g. `G♯ → A`) on the last beat of a bar. This \"leading\" note pulls the ear forward.\n- **The ♭7:** dropping in the `G` natural over the A chord adds bluesy grit (it's the ♭7, the note that makes A7 an A*7*).\n- **Rests and space:** you don't have to play all four beats — leaving a gap can groove harder than a wall of notes.\n\n## Try it\n\nAt 70 BPM on a [metronome](/tools/metronome) with a shuffle feel, loop the boogie cell over a single `A` chord for four bars until it flows. Then play it through the full 12-bar form above, shifting the shape to D and E, and finish with a chromatic walk-up turnaround. Replay the first four bars on the interactive score above — the up-and-down boogie cell rooted on A — then move on to walking-bass-basics to free the line from a fixed pattern.",
    "details": {
      "key": "A",
      "form": "lesson",
      "timeSignature": "4/4",
      "related": [
        "12-bar-blues-in-a",
        "bass-root-fifth-patterns",
        "walking-bass-basics",
        "minor-pentatonic-scale-shapes"
      ],
      "embeds": [
        {
          "tool": "score",
          "title": "A 12-bar blues bass line",
          "mode": "tab",
          "tuning": [
            28,
            33,
            38,
            43
          ],
          "tex": "\\tempo 80\n.\n\\track \"Bass\"\n  \\staff{tabs score} \\tuning (G2 D2 A1 E1)\n  :4 0.3 4.3 2.2 4.2 | 0.3 4.2 2.2 4.3 | 0.3 4.3 2.2 4.2 | 0.3 4.2 2.2 4.3 |"
        }
      ]
    },
    "extraTags": [
      "intermediate",
      "blues",
      "improvisation"
    ]
  },
  "bass-major-scale-fingerings": {
    "bodyMdx": "## Goal\n\nOn electric bass, major scales are learned as **movable box shapes** rather than open-string\npatterns — memorise the shape once and you can play any major scale just by sliding it to a new root.\nThis builds fretting-hand fingering, position sense, and the \"one-finger-per-fret\" discipline that\nmakes fast lines clean. (Standard 4-string tuning, low to high: `E A D G`.)\n\n## How to do it\n\nUse one finger per fret: **1** = index, **2** = middle, **3** = ring, **4** = pinky.\n\n**One-octave shape (root on the E or A string, played with finger 2):**\n\n| String | Fingering (finger → scale degree) |\n| --- | --- |\n| Root string | finger 1 → deg 1, finger 4 → deg 2 |\n| Next string | finger 1 → deg 3, finger 2 → deg 4, finger 4 → deg 5 |\n| Next string | finger 1 → deg 6, finger 3 → deg 7, finger 4 → deg 8 |\n\nWorked in **G major** with the root `G` at the E-string 3rd fret:\n\n- `E` string: `G`(fr 3, finger 2), `A`(fr 5, finger 4)\n- `A` string: `B`(fr 2, finger 1), `C`(fr 3, finger 2), `D`(fr 5, finger 4)\n- `D` string: `E`(fr 2, finger 1), `F♯`(fr 4, finger 3), `G`(fr 5, finger 4)\n\nSee the whole shape on the neck — roots highlighted; tap any note to hear it, then imagine sliding the box to a new root:\n\n<div data-tmr-embed=\"0\"></div>\n\nSteps:\n\n1. **Play it ascending and descending, slowly,** naming each note aloud.\n2. Keep fingers close to the frets; press just behind the fret, not on top of it.\n3. **Move the whole shape** up two frets and it becomes A major; slide it onto the A string and it\n   becomes C major, D major, and so on. Nothing about the shape changes — only the root.\n4. Anchor everything to a metronome at ♩ = 60, one note per beat, then two.\n\n**Two octaves:** continue past the octave `G` across all four strings, or shift up a position — a\ncommon approach is to play the one-octave box, then repeat it starting on the `A`-string root for the\nupper octave.\n\nPlay the C-major scale on the playable score below to lock the sound of the major scale in your ear,\nthen drill the movable shape above in every key.\n\n## Common mistakes\n\n- **Anchoring the thumb too hard** behind the neck — keep it relaxed and roughly opposite finger 2.\n- **Reaching instead of shifting.** If a note feels like a stretch, move your whole hand position.\n- **Buzzing notes** from pressing too far from the fret or not firmly enough.\n\n## How to progress\n\nCycle the shape through every key around the fretboard, then add the two-octave version and increase\ntempo on [/tools/metronome](/tools/metronome). Visualise the notes with the\n[Fretboard tool](/tools/fretboard), then put the scale to work in\n[Root–Fifth Bass Patterns](/bass-root-fifth-patterns).",
    "details": {
      "key": "G major",
      "form": "exercise",
      "related": [
        "bass-root-fifth-patterns",
        "bass-slap-technique-intro",
        "major-scales-all-keys"
      ],
      "embeds": [
        {
          "tool": "fingering",
          "title": "The G major box on the bass",
          "caption": "G major across a 4-string bass (E A D G), roots in dark. Tap a note to hear it; the shape slides to any key.",
          "instrument": "bass",
          "root": "G",
          "scale": "major"
        }
      ]
    },
    "extraTags": [
      "beginner",
      "exercise"
    ]
  },
  "bass-root-fifth-patterns": {
    "bodyMdx": "## The bassist's job\n\nThe bass connects the **harmony** (the chords) to the **rhythm** (the beat). The simplest way to do both jobs at once is the **root–fifth pattern**: play the root of each chord, then its fifth, locked to the pulse. It sounds great, it's easy on the hands, and it underpins countless country, rock, pop, and folk songs. This lesson is for a standard four-string bass tuned `E–A–D–G` (low to high).\n\n## Finding the root and fifth\n\nThe **root** is the note the chord is named for — for a C chord, play `C`. The **fifth** is a perfect fifth above it (seven semitones). On the bass fretboard the fifth sits in a very consistent, easy-to-grab spot relative to the root:\n\n| Note | Where to play it |\n| --- | --- |\n| Root | any string, fret N |\n| Fifth | same fret (N), the next string up |\n\nExample — a `C` root on the A string (3rd fret): the fifth `G` is on the D string, also at the 3rd fret. Your hand barely moves. (You can also grab the fifth *below* the root: two frets down on the string above — same note, an octave lower.)\n\n## The basic pattern\n\nOver one chord in 4/4, alternate root and fifth:\n\n| Beat | 1 | 2 | 3 | 4 |\n| --- | --- | --- | --- | --- |\n| Note | Root | Fifth | Root | Fifth |\n\nOr emphasise the root by holding it longer:\n\n| Beat | 1 | 2 | 3 | 4 |\n| --- | --- | --- | --- | --- |\n| Note | Root (held) | Fifth | Root | Fifth |\n\nPlay the root on beat 1 (the downbeat) — that's the note the listener anchors to when the chord changes.\n\n## A worked example\n\nSay the song is `C – G – Am – F`, one chord per bar. Playing root then fifth on beats 1 and 3, with the fifth *above* the root:\n\n| Bar | Chord | Beat 1 | Beat 3 |\n| --- | --- | --- | --- |\n| 1 | C | C (root) | G (fifth) |\n| 2 | G | G (root) | D (fifth) |\n| 3 | Am | A (root) | E (fifth) |\n| 4 | F | F (root) | C (fifth) |\n\n(Each pair is the chord's root and its fifth.) Your left hand stays in nearly one position, and the line locks the harmony to the beat.\n\n## Adding the octave\n\nFor extra lift, reach up to the **octave** — the root one octave higher, found two frets up and one string over from the fifth. A classic \"root–fifth–octave\" figure:\n\n| Beat | 1 | 2 | 3 | 4 |\n| --- | --- | --- | --- | --- |\n| Note | Root | Fifth | Octave | Fifth |\n\nThis is the driving pattern behind polka, many rock tunes, and up-tempo country. Play the interactive score below to hear the root–fifth pattern and the root–fifth–octave figure in C.\n\n<div data-tmr-embed=\"0\"></div>\n\n## Technique that matters most\n\n- **Lock to the drums.** Your job is to sit exactly with the kick drum and snare. Play *with* the metronome, not near it.\n- **Mute cleanly.** Let go of each note right when the next begins so the line is punchy, not muddy. Use both hands to damp ringing strings.\n- **Alternate plucking fingers** (index, middle) on the right hand for an even, repeatable pulse.\n- **Land on beat 1.** Even if you simplify everything else, hitting the root on the downbeat of each chord is what makes a bass line \"work.\"\n\n## Try it\n\nSet a [metronome](/tools/metronome) to 80 BPM. Over a single C chord, play root–fifth on beats 1 and 3 for eight bars until it's effortless. Then loop `C – G – Am – F`, one bar each, moving to the new root on every downbeat. Once solid, add the octave figure. Replay the interactive score above to check the root–fifth-then-octave shape in C, then advance to the bass-blues-line and walking-bass lessons to add motion.",
    "details": {
      "form": "lesson",
      "timeSignature": "4/4",
      "related": [
        "bass-blues-line-basics",
        "walking-bass-basics",
        "omt-intervals",
        "omt-rhythm-and-meter"
      ],
      "embeds": [
        {
          "tool": "score",
          "title": "Root–fifth pattern",
          "mode": "tab",
          "tuning": [
            28,
            33,
            38,
            43
          ],
          "tex": "\\tempo 90\n.\n\\track \"Bass\"\n  \\staff{tabs score} \\tuning (G2 D2 A1 E1)\n  :4 3.3 5.2 3.3 5.2 | 3.3 5.2 5.1 5.2 |"
        }
      ]
    },
    "extraTags": [
      "beginner",
      "rhythm",
      "technique"
    ]
  },
  "bass-slap-technique-intro": {
    "bodyMdx": "## Goal\n\nSlap bass is the percussive, funky sound at the heart of funk, R&B, and countless pop grooves —\npioneered by players like Larry Graham and made iconic by Marcus Miller and Flea. It combines two\nmotions: the **thumb slap** (a low, punchy attack) and the **finger pop** (a bright, snapping high\nnote). Learning it adds rhythm, dynamics, and attitude to your playing.\n\n## How to do it\n\nThink of the plucking hand as a relaxed hammer pivoting from the wrist, not the whole arm.\n\n1. **The thumb slap (\"T\").** Rotate the wrist so the side of your thumb (the knuckle joint, laid\n   roughly parallel to the strings) strikes down onto a string — usually the low `E` or `A` — right\n   over the end of the fingerboard. **Bounce off immediately** so the note rings; don't press in. Aim\n   for a short, drum-like *thump*.\n2. **The finger pop (\"P\").** Hook your index or middle finger *under* a higher string (usually `G` or\n   `D`), pull it slightly up and out, and release so it **snaps back against the frets** with a bright\n   click.\n3. **Combine them.** The classic groove alternates thumb and pop: `T P T P`. A great first pattern is\n   slap the root on the `E` string, then pop the octave on the `G` string.\n4. **Add left-hand muting.** Lightly rest unused fingers on the strings so only the intended note\n   sounds — clarity in slap comes as much from muting as from striking.\n5. **Start slow with a metronome,** ♩ = 60. Play `T (root) — P (octave)` as steady quarter notes\n   until each attack is even and clean.\n\n## Common mistakes\n\n- **Using arm force instead of wrist rotation.** Tension kills the bounce — keep the wrist loose.\n- **Digging in on the slap.** Bounce off the string; pressing in deadens the note.\n- **Muddy, ringing strings.** Weak muting is the number-one beginner problem — mute aggressively with\n  both hands.\n- **Chasing speed too early.** Groove and evenness first; tempo follows.\n\n## How to progress\n\nOnce `T P` is comfortable, add hammer-ons, ghost notes (muted percussive hits), and double thumbing.\nBuild lines from the [Bass Major Scale Fingerings](/bass-major-scale-fingerings) and\n[Root–Fifth Bass Patterns](/bass-root-fifth-patterns), then apply slap to\n[Building a Blues Bass Line](/bass-blues-line-basics). Lock the groove with a\n[metronome](/tools/metronome).\n\n## Try it\n\nHear the classic octave slap figure on the interactive score below — thumb the low `E` (T), pop the octave `E` (P), and loop it slowly until each attack is even and clean.\n\n<div data-tmr-embed=\"0\"></div>",
    "details": {
      "form": "technique",
      "related": [
        "bass-major-scale-fingerings",
        "bass-root-fifth-patterns",
        "bass-blues-line-basics"
      ],
      "embeds": [
        {
          "tool": "score",
          "title": "A slap groove",
          "mode": "tab",
          "tuning": [
            28,
            33,
            38,
            43
          ],
          "tex": "\\tempo 90\n.\n\\track \"Bass\"\n  \\staff{tabs score} \\tuning (G2 D2 A1 E1)\n  :8 0.4 2.2 r 2.2 0.4 2.2 r 2.2 | 0.4 2.2 r 2.2 0.4 2.2 r 2.2 |"
        }
      ]
    },
    "extraTags": [
      "intermediate"
    ]
  },
  "beethoven-fur-elise-opening": {
    "bodyMdx": "## About this piece\nPerhaps the most recognisable tune in all of piano music, *Für Elise* is a bagatelle — a short \"trifle\" — that Beethoven wrote in 1810 but never published; it surfaced only in 1867, forty years after his death. Even the title is a small mystery: the manuscript's dedication is hard to read, and \"Elise\" may be a misreading of \"Therese,\" a woman Beethoven knew. What survives is this haunting, gentle piece whose opening section everyone knows by ear long before they can play it.\n\n## What to listen for\nThe famous opening theme rocks between two adjacent notes (E and D-sharp) before curling down into a wistful melody in A minor, all in a lilting 3/8. The full piece alternates this refrain with contrasting episodes, rondo-fashion; the opening you'll study here is the recurring heart of it. Notice the delicacy of the marking *Poco moto* (\"a little motion\") — this is quiet, intimate music, not a showpiece.\n\n## What you'll learn\nThe opening builds a light, controlled right hand, smooth hand-crossing between the melody and its rolling accompaniment, and sensitive dynamic shading. It's an ideal study in playing softly and evenly, and in shaping a melody that must sound effortless.\n\n## How to practise\nThe famous two-note oscillation should be light and even, played mostly from the fingers with a relaxed wrist — never hammered. Keep the tempo gentle and flowing; the piece loses its spell if driven hard. Balance the hands so the melody sings and the broken-chord accompaniment stays hushed underneath. Learn the left-hand arpeggiated chords securely so they can drop to a whisper. Practise slowly for evenness before letting it flow, and mind the pedal so it colours without smearing.\n\n## If you like this\nFor more brooding minor-key Beethoven, the *Moonlight Sonata* first movement is the natural companion. Chopin's *Prelude in E minor* and *Waltz in A minor* share this piece's tender, melancholy voice.",
    "details": {
      "key": "A minor",
      "era": "Classical",
      "form": "Bagatelle (rondo-like, opening section)",
      "timeSignature": "3/8",
      "composer": "Ludwig van Beethoven",
      "composerDates": "1770–1827",
      "composedYear": "1810",
      "related": [
        "beethoven-moonlight-sonata-1st-mvt",
        "chopin-prelude-e-minor-op28-no4",
        "chopin-waltz-a-minor-b150"
      ]
    },
    "extraTags": [
      "public-domain",
      "intermediate"
    ]
  },
  "beethoven-moonlight-sonata-1st-mvt": {
    "bodyMdx": "## About this piece\nBeethoven finished this sonata in 1801 and published it in 1802 with the subtitle *Sonata quasi una fantasia* — \"sonata in the manner of a fantasy\" — and dedicated it to his young pupil Countess Giulietta Guicciardi. The nickname \"Moonlight\" came later, from a critic who compared the first movement to moonlight on Lake Lucerne; Beethoven never used it. The movement's hushed, hypnotic stillness broke the mould: instead of a lively opening Allegro, the sonata begins with this slow, dreamlike Adagio in C-sharp minor. It remains one of the most beloved pieces ever written.\n\n## What to listen for\nThree things unfold at once: a steady stream of rising broken-chord triplets, a solemn dotted-rhythm melody above them, and deep bass notes anchoring the harmony below. Beethoven marked it *Adagio sostenuto*, but in *alla breve* — two slow pulses per bar, not four — a reminder to keep it flowing rather than funereal. The mood is grave and searching, never breaking into display. It stays soft almost throughout.\n\n## What you'll learn\nThis movement teaches control of a quiet, unbroken triplet accompaniment, three-layer voicing (melody, triplets, bass) within the hands, careful pedalling for atmosphere, and the art of sustaining a mood over several minutes without a single loud moment.\n\n## How to practise\nPractise the right hand's triplets alone until they are perfectly even and genuinely soft — they are the shimmering backdrop and must never bump. Then add the melody on top, voicing it slightly stronger so it sings through. Keep the bass warm and connected. Change the pedal cleanly with each harmony so the sound glows but never blurs. Choose a tempo that flows in two, and let dynamics stay within a narrow, intimate range. Above all, patience: the power here is in restraint.\n\n## If you like this\nFor Beethoven in a lighter minor-key mood, try *Für Elise*. If it's the singing, arpeggiated calm that draws you, Chopin's *Nocturne Op. 9 No. 2* and Bach's *Prelude in C major* explore the same territory.",
    "details": {
      "key": "C-sharp minor",
      "era": "Classical",
      "form": "Sonata first movement (Adagio sostenuto)",
      "timeSignature": "Cut time / alla breve (2/2)",
      "composer": "Ludwig van Beethoven",
      "composerDates": "1770–1827",
      "composedYear": "1801",
      "related": [
        "beethoven-fur-elise-opening",
        "chopin-nocturne-op9-no2",
        "bach-prelude-c-major-bwv-846"
      ]
    },
    "extraTags": [
      "public-domain",
      "intermediate"
    ]
  },
  "beethoven-ode-to-joy": {
    "bodyMdx": "## About this piece\nThis is a gentle, simplified arrangement of one of the most famous tunes in all of music — the \"Ode to Joy\" melody from the finale of Beethoven's Ninth Symphony, completed in 1824. In the symphony, this theme grows into a mighty choral setting of Friedrich Schiller's poem celebrating joy and the brotherhood of humanity; it was later adopted as the anthem of Europe. Beethoven wrote the Ninth after he had gone almost completely deaf, which makes its message of joy all the more moving. Here, stripped back to its bare melody, it becomes a perfect first tune for a beginner.\n\n## What to listen for\nNotice how simple and singable the melody is: it moves mostly by step, one neighbouring note to the next, rarely leaping around. That step-by-step motion is exactly what makes it so easy to remember and so satisfying to play. Listen for how the tune rises gently, comes back down to rest, and then repeats — a beautifully balanced shape that Beethoven built into something enormous.\n\n## What you'll learn\nThis is an ideal early sight-reading and melody piece. You'll practise reading notes that step up and down the staff, keeping a steady four-beat count, and playing a smooth, connected (legato) line. It's a confidence-builder: a world-famous tune you can play early in your journey.\n\n## How to practise\nStart slowly with the right hand alone, naming the notes as you go and keeping an even pulse — counting \"1-2-3-4\" out loud helps. Aim for a smooth, connected sound, moving gently from note to note. Once the melody feels comfortable, try singing along; if your arrangement includes a simple left-hand part, add it only after the tune is secure.\n\n## If you like this\nWhen you're ready for something a little richer, try Schubert's *Ave Maria*, or explore the calm beauty of Satie's *Gymnopédie No. 1*.",
    "details": {
      "key": "C major (simple arrangement; the original theme is in D major)",
      "era": "Classical",
      "form": "Simplified melody arrangement of a symphonic choral theme",
      "timeSignature": "4/4",
      "composer": "Ludwig van Beethoven",
      "composerDates": "1770–1827",
      "composedYear": "Symphony No. 9 completed 1824",
      "related": [
        "schubert-ave-maria",
        "satie-gymnopedie-no1"
      ]
    },
    "extraTags": [
      "public-domain",
      "beginner"
    ]
  },
  "beethoven-sonatina-in-g-anh5": {
    "bodyMdx": "## About this piece\nThis sunny little sonatina in G major is one of a pair (the other in F) published as WoO Anh. 5 and long sold as \"Beethoven's easy sonatinas.\" In truth, scholars doubt Beethoven wrote them at all — they appeared in print after his death and their real author is unknown, which is why catalogues file them as *doubtful* works attached to his name. Whoever composed them had a gift for tuneful, teachable music: these two sonatinas have introduced countless pianists to Classical style, and their popularity is entirely earned.\n\n## What to listen for\nThe first movement is a cheerful Moderato in G major with a clear, singable theme and the tidy proportions of a miniature sonata form. The whole piece is a two-movement design: this bright opening is followed by a gentle *Romanze*, a songful slow movement. Listen for the balanced phrasing, the neat cadences that round off each idea, and the good-humoured, unfussy character throughout.\n\n## What you'll learn\nIt develops core Classical fundamentals: even scale and arpeggio figures, clean articulation, balanced hands, and shapely phrasing. Because the writing is transparent, it also trains reliable, unhurried fingerwork and a sense of the small-scale sonata layout.\n\n## How to practise\nKeep the tempo genuinely *moderate* — the Italian marking is a promise, not a challenge to go fast. Work the right-hand runs slowly for evenness, and keep the left-hand accompaniment light and supportive. Point up the phrase endings by easing gently into each cadence rather than bumping it. Practise hands separately where the two lines move at different speeds, then combine slowly. The Romanze rewards a warm, singing tone, so save some patience for it.\n\n## If you like this\nIt sits naturally beside the *Clementi Op. 36 No. 1* and *Kuhlau Op. 20 No. 1* sonatinas. When these feel comfortable, Mozart's *Sonata K. 545* is the fuller version of the same idea.",
    "details": {
      "key": "G major",
      "era": "Classical",
      "form": "Sonatina (I. Moderato; II. Romanze)",
      "timeSignature": "4/4 (first movement)",
      "composer": "Attributed to Ludwig van Beethoven (authorship doubtful)",
      "composerDates": "Beethoven 1770–1827",
      "related": [
        "clementi-sonatina-op36-no1-1st-mvt",
        "kuhlau-sonatina-op20-no1-1st-mvt",
        "mozart-sonata-k545-1st-mvt"
      ]
    },
    "extraTags": [
      "public-domain",
      "intermediate"
    ]
  },
  "blues-scale-piano": {
    "bodyMdx": "## The six-note blues scale\n\nThe **blues scale** is a minor pentatonic scale with one extra note — the famous \"**blue note**,\" a flattened fifth (♭5) that slots between the 4th and 5th. Those six notes carry the whole sound of blues, boogie, and early rock at the keyboard. In **C**, the scale is:\n\n| Note | C | E♭ | F | G♭ | G | B♭ | (C) |\n| --- | --- | --- | --- | --- | --- | --- | --- |\n| Degree | 1 | ♭3 | 4 | ♭5 | 5 | ♭7 | 8 |\n\nThe `G♭` is the blue note. It is normally used as a quick **passing tone** — you slide through it from `F` up to `G` (or from `G` down to `F`) rather than resting on it, and that momentary friction is exactly what gives the blues its cry. Explore the shape on the interactive keyboard below — the highlighted keys are the C blues scale; click them or play with your QWERTY keys.\n\n<div data-tmr-embed=\"0\"></div>\n\n## Where it comes from\n\nStart from the C **minor pentatonic** (`C E♭ F G B♭`) — the same five-note skeleton guitarists use — then insert `G♭`. That single added note is the only difference between the pentatonic and the blues scale, so if you already know one you nearly know the other.\n\n## Fingering at the piano\n\nA comfortable right-hand fingering for one octave of C blues:\n\n| Note | C | E♭ | F | G♭ | G | B♭ | C |\n| --- | --- | --- | --- | --- | --- | --- | --- |\n| Finger | 1 | 2 | 3 | 1 | 2 | 3 | 1 |\n\nTuck the thumb under after `F` (the blue note starts the second group). Left hand can mirror it an octave lower using fingers `5 4 3 2 1 ...` on the way up. Practise slowly, hands separately, until the thumb-cross is smooth, then combine.\n\n## Using the blue note tastefully\n\n- **Crush it:** play `G♭` and `G` almost together (a quick grace-note \"crush\"), releasing the flat into the natural. This imitates a guitar bend or a singer scooping up to pitch.\n- **Pass through, don't park:** because the ♭5 is dissonant, it works best moving. Landing and holding it sounds sour.\n- **Land on chord tones:** end phrases on `C`, `E♭`, `G`, or `B♭` — the notes of a C7 chord — so your lines resolve.\n\n## It fits the whole progression\n\nOne of the joys of the blues scale is that a *single* scale works over an entire 12-bar blues. Over a blues in C (`C7 – F7 – G7`), the **C blues scale sounds good over all three chords** — you don't have to change scales when the chord changes. That makes it the ideal first improvisation tool: pick the scale for the key, then focus your energy on rhythm and phrasing.\n\n## Left-hand accompaniment\n\nTo play blues alone, pair the scale (right hand) with a **boogie bass** in the left. A classic pattern over C7 walks the root, third, fifth, and sixth — `C – E – G – A – G – E` — as a steady stream of eighth notes. Click out that eighth-note drive below:\n\n<div data-tmr-embed=\"1\"></div>\n\nShift that figure to `F` and `G` to follow the 12-bar changes while your right hand solos with the blues scale.\n\n## Try it\n\nPlay the C blues scale up and down slowly with a [metronome](/tools/metronome) at 70 BPM, sliding through `G♭` each time rather than stopping on it. Then loop a simple C7–F7–G7 blues (or the 12-bar-blues lesson) and improvise short phrases, always resolving to `C`. Return to the interactive keyboard above — the highlighted keys are the C blues scale, playable with your mouse or QWERTY keys — then try transposing it to G (`G B♭ C D♭ D F`) to prove the pattern is movable.",
    "details": {
      "key": "C",
      "form": "lesson",
      "related": [
        "minor-pentatonic-scale-shapes",
        "12-bar-blues-in-a",
        "bass-blues-line-basics",
        "omt-seventh-chords"
      ],
      "embeds": [
        {
          "tool": "keyboard",
          "title": "The C blues scale on the keys",
          "caption": "Highlighted notes are the C blues scale — click to hear, or play with your QWERTY keys.",
          "root": "C",
          "scale": "blues",
          "size": 49
        },
        {
          "tool": "rhythm",
          "title": "The boogie-bass pulse",
          "caption": "Steady eighth notes — the left-hand walk C–E–G–A–G–E rides this constant pulse. Click it out at tempo.",
          "pattern": [
            "eighth",
            "eighth",
            "eighth",
            "eighth",
            "eighth",
            "eighth",
            "eighth",
            "eighth"
          ],
          "tempo": 80
        }
      ]
    },
    "extraTags": [
      "blues",
      "scales",
      "improvisation"
    ]
  },
  "burgmuller-arabesque-op100-no2": {
    "bodyMdx": "## About this piece\nFriedrich Burgmüller settled in Paris and made his name writing salon music and, most famously, his *25 Easy and Progressive Studies, Op. 100* (published around 1851). Unlike dry finger exercises, each study is a genuine little character piece with an evocative title — so students learn technique while playing real music. The *Arabesque*, No. 2, is the runaway favourite of the set: bright, quick, and instantly appealing, it's the piece that makes young pianists feel like performers for the first time.\n\n## What to listen for\nIt's in A minor with a brisk, light 2/4 pulse. The signature sound is a rippling stream of right-hand sixteenth notes answered by crisp little staccato chords — fast and airy, never heavy. The form is a rounded binary: the sparkling A-minor idea, a brighter middle section that slips into the relative major (C major), and then a return of the opening. Listen for the constant to-and-fro between flowing runs and punctuating chords.\n\n## What you'll learn\nThis study builds finger fluency and evenness in running sixteenth notes, light staccato chord playing, quick coordination between a flowing hand and a punctuating hand, and clear phrasing at a lively tempo. It's a superb confidence piece for early-intermediate players.\n\n## How to practise\nPractise the sixteenth-note runs slowly and evenly first — aim for a light, \"pearly\" touch from the fingertips rather than force. Keep the staccato chords crisp and short so they answer the runs cleanly. Coordinate the hands slowly at the hand-off points before adding speed. Feel the 2/4 in a quick, buoyant two, and keep the whole thing light — brilliance here comes from clarity, not volume. Note where the middle section brightens into major and shape that contrast. Build tempo gradually with a metronome.\n\n## If you like this\nIts companion *La Candeur* opens the same Op. 100 set with a gentler mood. For similar sparkle and energy, Schumann's *Wild Horseman* is a great match; the *Clementi Sonatina* rewards the same clean fingerwork.",
    "details": {
      "key": "A minor",
      "era": "Romantic",
      "form": "Étude / character piece (rounded binary)",
      "timeSignature": "2/4",
      "composer": "Friedrich Burgmüller",
      "composerDates": "1806–1874",
      "composedYear": "published 1851",
      "related": [
        "burgmuller-la-candeur-op100-no1",
        "schumann-the-wild-horseman-op68",
        "clementi-sonatina-op36-no1-1st-mvt"
      ]
    },
    "extraTags": [
      "public-domain",
      "beginner"
    ]
  },
  "burgmuller-la-candeur-op100-no1": {
    "bodyMdx": "## About this piece\n*La Candeur* — \"Candour\" or \"Frankness\" — opens Friedrich Burgmüller's beloved *25 Easy and Progressive Studies, Op. 100* (published around 1851). Its title sets the tone: this is open, honest, unaffected music, the perfect first study of the set. Like all of Op. 100, it wraps a specific technical lesson inside a genuinely musical miniature, which is why teachers have reached for it for well over a century. Where the more famous *Arabesque* dazzles, *La Candeur* soothes.\n\n## What to listen for\nIt's in warm C major at a flowing, moderate pace. The right hand spins an even, continuous line of notes — a smooth, unbroken melodic stream — over calm, supportive left-hand harmony. There are no sudden tricks or contrasts; the pleasure is in the serene evenness and the gentle rise and fall of the line. It sounds simple and sincere, exactly as the title promises.\n\n## What you'll learn\nThis study develops evenness and control in a flowing right-hand line, a smooth legato touch, balance between a busy melody hand and a quiet accompaniment hand, and steady, unhurried phrasing. It's ideal early training in tone control and keeping a line singing.\n\n## How to practise\nFocus first on the right hand: play the running line slowly and listen for perfect evenness — no note louder or longer than its neighbours. Keep the wrist relaxed and let the fingers do the work. Bring in the left hand softly so the melody always sings above it. Choose a calm, steady tempo and hold it; the beauty here is smoothness, not speed. Shape the long line gently toward its high points and ease back at the phrase ends. A little pedal can warm the tone without blurring it.\n\n## If you like this\nMove on to its sparkling sibling, the *Arabesque, Op. 100 No. 2*. For the same gentle, singing character, Schumann's *Melody, Op. 68 No. 1* is a lovely companion, as is Bach's flowing *Prelude in C major*.",
    "details": {
      "key": "C major",
      "era": "Romantic",
      "form": "Étude / character piece",
      "timeSignature": "4/4",
      "composer": "Friedrich Burgmüller",
      "composerDates": "1806–1874",
      "composedYear": "published 1851",
      "related": [
        "burgmuller-arabesque-op100-no2",
        "schumann-melody-op68-no1",
        "bach-prelude-c-major-bwv-846"
      ]
    },
    "extraTags": [
      "public-domain",
      "beginner"
    ]
  },
  "c-major-scale-two-octaves": {
    "bodyMdx": "## Goal\n\nThe C major scale is the first scale most pianists learn, and playing it **two octaves, hands\ntogether** teaches the single most important scale skill: passing the **thumb under** smoothly so a\nfive-finger hand can travel the whole keyboard without a bump. Get this fingering into muscle memory\nand every other major scale becomes a variation on it.\n\n## How to do it\n\nC major uses only white keys: `C D E F G A B C`. The standard fingering is:\n\n- **Right hand, ascending:** `1 2 3 1 2 3 4 1 2 3 1 2 3 4 5`\n  (`C`=1, `F`=1, `C`=1 again, top `C`=5). The thumb tucks under after finger 3, then after finger 4.\n- **Left hand, ascending:** `5 4 3 2 1 3 2 1 4 3 2 1 3 2 1`\n  (start on finger 5, thumb on `G` and `C`, finger 4 crosses over on `F`).\n- **Descending:** simply reverse each hand's fingering.\n\nSteps:\n\n1. **Right hand alone,** slowly. As finger 3 plays `E`, prepare the thumb to slip under and land on\n   `F`. Keep the wrist level — no jerk or accent on the thumb note.\n2. **Left hand alone.** Here finger 3 (then 4) crosses *over* the thumb going up. Aim for the same\n   smoothness.\n3. **Hands together,** very slowly. They are not symmetrical — the thumb-unders happen at different\n   moments — so combining them is the real work.\n4. Start around ♩ = 60, two notes per beat, then four notes per beat as it cleans up.\n\n<div data-tmr-embed=\"0\"></div>\n\n## Common mistakes\n\n- **Accenting the thumb.** The tuck-under note pops out louder — consciously soften it so the line\n  stays even.\n- **Wrist twisting.** Move the elbow gently along with the hand instead of flicking the wrist.\n- **Rushing hands together too soon.** Each hand must be automatic alone first.\n\n## How to progress\n\nPush the metronome up gradually with [/tools/metronome](/tools/metronome). Add a third octave, then\ncarry the thumb-under technique into [Major Scales in All Keys](/major-scales-all-keys) and the\n[Chromatic Scale Exercise](/chromatic-scale-exercise). See how C relates to every other key on the\n[Circle of Fifths reference](/circle-of-fifths-reference).",
    "details": {
      "key": "C major",
      "form": "exercise",
      "related": [
        "major-scales-all-keys",
        "chromatic-scale-exercise",
        "circle-of-fifths-reference"
      ],
      "embeds": [
        {
          "tool": "keyboard",
          "title": "C major on the keys",
          "caption": "The seven notes of C major are highlighted — all white keys. Click them in order, or play along with your QWERTY keys.",
          "root": "C",
          "scale": "major",
          "size": 49
        }
      ]
    },
    "extraTags": [
      "beginner",
      "exercise"
    ]
  },
  "carcassi-guitar-study-op60-no1": {
    "bodyMdx": "## About this piece\nMatteo Carcassi (1792–1853) was an Italian guitarist who made his career in Paris, and his *25 Studi melodici progressivi*, Op. 60 — composed around 1836 — is one of the most important pedagogical collections in the entire guitar literature. Nearly every classical guitarist meets these studies at some point. No. 1 in C major is the gateway: a flowing, sixteenth-note arpeggio study that trains the right hand to spin an even, continuous ripple of notes while the left hand moves through comfortable first-position chords.\n\n## What to listen for\nAn unbroken stream of arpeggiated notes with the underlying chord changes gliding beneath. When played well it should sound effortless and smooth, like water — no bumps as the hand crosses strings, and a bass note that anchors each new harmony.\n\n## What you'll learn\nRight-hand arpeggio patterns with **p–i–m–a** coordination, string crossing without accents, and keeping a relaxed, repeating hand shape at speed. You'll also drill smooth left-hand chord transitions so the arpeggio never stops to wait for the fingers.\n\n## How to practise\nBlock the arpeggio into its underlying chords first — play each bar as a single strummed chord to memorise the left-hand shapes. Then unfold the pattern slowly with a metronome, prioritising evenness over speed. If notes clip short, check that left-hand fingers stay down for the whole chord. Increase tempo only when the ripple is perfectly even.\n\n## If you like this\nProgress to Carcassi's Op. 60 No. 7 in A minor, revisit Sor's Op. 60 studies, or reach toward Sor's Op. 35 No. 22.",
    "details": {
      "key": "C major",
      "era": "Classical",
      "form": "study/étude (arpeggio study)",
      "timeSignature": "4/4",
      "composer": "Matteo Carcassi",
      "composerDates": "1792–1853",
      "composedYear": "c. 1836",
      "related": [
        "carcassi-study-op60-no7",
        "sor-study-op60-no1",
        "sor-study-op35-no22",
        "carulli-andante-op241"
      ]
    },
    "extraTags": [
      "public-domain",
      "intermediate"
    ]
  },
  "carcassi-study-op60-no7": {
    "bodyMdx": "## About this piece\nThis is the seventh of Matteo Carcassi's *25 Melodic Progressive Studies*, Op. 60 (c. 1836), and one of the most frequently performed of the set. Where No. 1 stays bright and open in C major, No. 7 turns to A minor and adds real expressive weight — it feels like a small concert piece rather than an exercise. Carcassi (1792–1853) had a gift for wrapping serious technical goals in genuinely appealing music, and this study is a favourite recital opener for intermediate players.\n\n## What to listen for\nContinuous arpeggios in A minor with a melodic thread woven through the top of the pattern. The minor key gives it a darker, more searching quality, and the harmony travels further afield than the earlier studies, so you'll hear moments of tension resolving as the chords shift.\n\n## What you'll learn\nSustained right-hand arpeggio fluency at a faster clip, string crossing across all six strings, and bringing out a melody hidden within an arpeggio. The left hand must manage quicker chord changes and occasional position shifts while keeping every note ringing.\n\n## How to practise\nAs with No. 1, block each bar into its chord to map the left hand, then unspool the arpeggio slowly. Isolate any bar with a position shift and practise just the move between the two shapes until it's silent and reliable. Keep the right-hand motion small and economical; speed comes from relaxation, not effort. Shape the phrases so the piece sings rather than merely runs.\n\n## If you like this\nReturn to Carcassi's Op. 60 No. 1, then aim for Sor's Op. 35 No. 22 or Tárrega's *Lágrima* for lyrical Romantic playing.",
    "details": {
      "key": "A minor",
      "era": "Classical",
      "form": "study/étude (arpeggio study)",
      "timeSignature": "4/4",
      "composer": "Matteo Carcassi",
      "composerDates": "1792–1853",
      "composedYear": "c. 1836",
      "related": [
        "carcassi-guitar-study-op60-no1",
        "sor-study-op35-no22",
        "tarrega-lagrima",
        "carulli-guitar-study"
      ]
    },
    "extraTags": [
      "public-domain",
      "intermediate"
    ]
  },
  "carulli-andante-op241": {
    "bodyMdx": "## About this piece\nFerdinando Carulli (1770–1841) was born in Naples in the same year as Beethoven and became one of the most celebrated guitar teachers of his day in Paris. His Op. 241, *École de guitare* (c. 1825), is a late revision of his famous method, packed with short, graceful pieces designed to build technique through music that's pleasant to play. This Andante in C is a typical example: a clear, singable melody set over a simple accompaniment, ideal for a developing player who wants a real \"piece\" rather than a dry exercise.\n\n## What to listen for\nA calm, walking tempo (that's what *andante* means) and a well-shaped melody in bright C major. The accompaniment stays out of the way, letting the tune lead. Listen for balanced phrasing and gentle cadences that give the music a settled, unhurried feel.\n\n## What you'll learn\nTwo-voice playing — thumb (**p**) on the bass and accompaniment, fingers (**i–m–a**) on the melody — plus even tone, controlled dynamics, and clean first-position reading. It's excellent for learning to make a melody sing while a quieter part supports it.\n\n## How to practise\nPlay the melody line on its own until it feels vocal, then add the accompaniment softly beneath it. Keep a steady andante pulse — resist rushing the easier bars. Aim for a warm, rounded tone and let notes ring their full value. Practise the cadences especially, easing slightly into each phrase-ending so the music breathes.\n\n## If you like this\nTry more pieces from Carulli's Op. 241, the Sor Op. 60 studies, or Carcassi's Op. 60 No. 1.\n\n<!-- Note: Op. 241 contains many short pieces (several Andantes/Andantinos in different keys). Seed labels this \"Andante in C\"; treated here as a representative C-major Andante from the set. -->",
    "details": {
      "key": "C major",
      "era": "Classical",
      "form": "study/étude (andante, melodic study)",
      "timeSignature": "4/4",
      "composer": "Ferdinando Carulli",
      "composerDates": "1770–1841",
      "composedYear": "c. 1825",
      "related": [
        "carulli-guitar-study",
        "sor-study-op60-no1",
        "carcassi-guitar-study-op60-no1",
        "sor-study-op35-no22"
      ]
    },
    "extraTags": [
      "public-domain"
    ]
  },
  "carulli-guitar-study": {
    "bodyMdx": "## About this piece\nFerdinando Carulli (1770–1841) wrote an enormous quantity of teaching material for the guitar — methods, studies, and short pieces that guitarists still open on their first day of lessons. This short study in A minor develops arpeggio technique, the single most important right-hand skill in early classical-guitar playing. Carulli's studies are prized because they are short, tuneful, and technically focused: each one drills one clear idea without overstaying its welcome.\n\n## What to listen for\nA repeating arpeggio pattern rolling under a simple melodic line, coloured by the gentle sadness of A minor. Because the piece is compact, you'll hear the same textural idea returning — that repetition is the point, giving the right hand a stable shape to master.\n\n## What you'll learn\nRight-hand arpeggios with **p–i–m–a** coordination, keeping a repeating hand shape even and relaxed, and holding left-hand chords down so every note sustains. A minor uses friendly first-position shapes (Am, E, Dm), making it a good bridge between chord-strumming and true fingerstyle.\n\n## How to practise\nBlock each bar into its chord first so the left hand knows where to go, then add the arpeggio slowly. Keep right-hand motion minimal — the fingers should barely move. Use a metronome and prize evenness over speed. Let the top notes come out a touch to suggest a melody.\n\n## If you like this\nTry Carulli's Andante in C, Op. 241, then Carcassi's Op. 60 studies for longer arpeggio pieces.\n\n<!-- Note: seed lists this as a generic \"Guitar Study in A minor\" attributed to Carulli (IMSLP), without a specific opus. Details above describe a representative Carulli A-minor arpeggio study; opus/exact year unconfirmed. -->",
    "details": {
      "key": "A minor",
      "era": "Classical",
      "form": "study/étude (arpeggio study)",
      "timeSignature": "3/4",
      "composer": "Ferdinando Carulli",
      "composerDates": "1770–1841",
      "composedYear": "early 19th c.",
      "related": [
        "carulli-andante-op241",
        "carcassi-study-op60-no7",
        "sor-study-op60-no1",
        "carcassi-guitar-study-op60-no1"
      ]
    },
    "extraTags": [
      "public-domain"
    ]
  },
  "chopin-nocturne-op9-no2": {
    "bodyMdx": "## About this piece\nThis is *the* nocturne — the one most people picture when they hear the word. Chopin wrote it as a young man around 1830–31 and published it in 1832 as the second of his Op. 9 set. The nocturne (literally \"night piece\") was a form pioneered by the Irish composer John Field, but Chopin transformed it into something far richer: a right-hand melody that sings like an opera singer, over a rocking, harp-like left hand. Its warmth and grace have made it one of the best-loved pieces in the piano repertoire.\n\n## What to listen for\nThe key is a mellow E-flat major, the metre a gently swaying 12/8 (four groups of three). The left hand rocks between a bass note and softly spread chords, setting up a rhythmic hammock. Above it, the right hand unfurls a long, ornate melody — and crucially, Chopin varies it each time it returns, decorating it with runs, turns, and delicate filigree, exactly as a great singer would embellish a repeated aria. Listen for those decorations and for the tender, singing tone throughout.\n\n## What you'll learn\nThis nocturne develops a true *cantabile* (singing) touch, the coordination of a flowing melody against a steady wide-spanning left hand, and the execution of ornamental runs that must sound free and effortless. It's also a study in rubato and in pacing a long lyrical line.\n\n## How to practise\nSet the left hand first — it must be soft, even, and reliable, since it holds everything together while the melody floats free. Learn the ornamental runs slowly, counting how they fit against the beat before you let them flow \"out of time.\" Voice the melody so it always rises above the accompaniment, and shape each phrase like a breath. Use rubato tastefully — expressive give-and-take over a steady underlying pulse. Change the pedal with each harmony. This one rewards patience and a beautiful tone above all.\n\n## If you like this\nFor more of Chopin's intimate voice, the *Prelude in E minor* and *Waltz in A minor* are natural companions. Beethoven's *Moonlight Sonata* first movement shares the same nocturnal, singing calm.",
    "details": {
      "key": "E-flat major",
      "era": "Romantic",
      "form": "Nocturne (Andante)",
      "timeSignature": "12/8",
      "composer": "Frédéric Chopin",
      "composerDates": "1810–1849",
      "composedYear": "c. 1830–1831 (published 1832)",
      "related": [
        "chopin-prelude-e-minor-op28-no4",
        "chopin-waltz-a-minor-b150",
        "beethoven-moonlight-sonata-1st-mvt"
      ]
    },
    "extraTags": [
      "public-domain",
      "advanced"
    ]
  },
  "chopin-prelude-e-minor-op28-no4": {
    "bodyMdx": "## About this piece\nChopin's *24 Preludes, Op. 28* — one in every key — were largely completed during the winter of 1838–39, much of it while he was staying (and ailing) on the island of Majorca with the writer George Sand. The set was published in 1839. This one, No. 4 in E minor, is among the most famous and the most quietly devastating. It was reportedly played at Chopin's own funeral in 1849. On the page it looks almost bare, but it is one of the most expressive short pieces ever written.\n\n## What to listen for\nThe right hand simply holds a slow, aching melody of repeated and slowly falling notes. All the drama is underneath: the left hand plays soft, throbbing chords that shift downward by tiny steps, one voice at a time, so the harmony seems to sink and darken continuously. That slow chromatic descent creates a feeling of suspended grief. A single surge of intensity near the end breaks the stillness before the piece fades to a hushed close. It is marked *Largo* — very slow.\n\n## What you'll learn\nThis is a masterclass in expression through the simplest means: controlling soft, evenly voiced repeated chords, hearing and shaping chromatic voice-leading, and shaping a long melodic line with subtle timing and dynamics. It teaches that emotion comes from control, not speed.\n\n## How to practise\nThe left-hand chords are the piece — practise them alone until they are perfectly even, soft, and connected, listening to the one note that moves in each change. Keep the right-hand melody legato and give it a slight rise and fall so it doesn't sound flat. Plan your single climax so the long build has somewhere to go, then relax completely for the ending. Move the pedal with each chord change to keep the harmony clean. Take it genuinely slowly and let silence do some of the work.\n\n## If you like this\nChopin's *Nocturne Op. 9 No. 2* offers the same singing lyricism with more ornament, while the *Waltz in A minor* shares its wistful minor-key mood. Beethoven's *Für Elise* is a gentler companion.",
    "details": {
      "key": "E minor",
      "era": "Romantic",
      "form": "Prelude (Largo)",
      "timeSignature": "4/4",
      "composer": "Frédéric Chopin",
      "composerDates": "1810–1849",
      "composedYear": "c. 1838–1839 (published 1839)",
      "related": [
        "chopin-nocturne-op9-no2",
        "chopin-waltz-a-minor-b150",
        "beethoven-fur-elise-opening"
      ]
    },
    "extraTags": [
      "public-domain",
      "intermediate"
    ]
  },
  "chopin-waltz-a-minor-b150": {
    "bodyMdx": "## About this piece\nChopin published only a handful of waltzes in his lifetime, but several more survive in manuscript and appeared after his death. This gentle waltz in A minor (catalogued B. 150) is one of them — its exact date of composition is uncertain, and it was published posthumously. It has since become one of the most-loved doors into Chopin's world, because it is genuinely playable by developing pianists while still sounding unmistakably like him: wistful, elegant, and quietly heartfelt. (Note: the precise year of composition isn't firmly established, so we describe it only as a late, posthumous work.)\n\n## What to listen for\nIt is a true waltz in a lilting 3/4 — a strong beat one in the left hand, then two lighter chords. The key of A minor lends it a bittersweet, faraway quality. The form is a simple, satisfying loop of ideas: a plaintive opening melody, a warmer contrasting section that brightens toward the major, and a return home. Listen for the subtle push and pull of *rubato* — the flexible timing that lets the tune breathe over a steady dance pulse.\n\n## What you'll learn\nThis waltz teaches the essential Chopin left-hand waltz pattern (bass note, then chord, chord), a singing legato melody, graceful phrasing, and the beginnings of *rubato* — bending the melody's timing while the accompaniment keeps its poise.\n\n## How to practise\nMaster the left hand first: the leap from bass note up to the chords should be smooth and quiet, landing softly on beat one. Keep the melody legato and shaped, always louder than the accompaniment. Introduce rubato gently — borrow a little time on expressive notes and give it back — but keep the underlying pulse steady so it never sags. Use light pedal, changing with the harmony. Learn the sections separately, then string them into one flowing narrative.\n\n## If you like this\nStay with Chopin's introspective side in the *Prelude in E minor* and the singing *Nocturne Op. 9 No. 2*. For the dance's simpler ancestor, try Schubert's *Ländler, D. 366*.",
    "details": {
      "key": "A minor",
      "era": "Romantic",
      "form": "Waltz",
      "timeSignature": "3/4",
      "composer": "Frédéric Chopin",
      "composerDates": "1810–1849",
      "composedYear": "late in Chopin's life; published posthumously",
      "related": [
        "chopin-prelude-e-minor-op28-no4",
        "chopin-nocturne-op9-no2",
        "schubert-landler-d366"
      ]
    },
    "extraTags": [
      "public-domain",
      "intermediate"
    ]
  },
  "chromatic-scale-exercise": {
    "bodyMdx": "## Goal\n\nThe chromatic scale climbs by **every half step** — all twelve notes inside an octave. Practising it\nbuilds **fluent finger crossings** and pinpoint evenness across black and white keys. Because the\nfingering is a fixed, repeating rule, it is one of the fastest ways to develop a light, quick,\nlevel hand.\n\n## How to do it\n\nThe golden rule: **finger 3 on every black key**, thumb (1) on the white keys, and finger 2 on the\nwhite key that immediately follows another white key (`E`→`F` and `B`→`C` going up).\n\n- **Right hand, ascending from C:**\n  `C`=1 `C♯`=3 `D`=1 `D♯`=3 `E`=1 `F`=2 `F♯`=3 `G`=1 `G♯`=3 `A`=1 `A♯`=3 `B`=1 `C`=2\n  (fingering `1 3 1 3 1 2 3 1 3 1 3 1 2`).\n- **Left hand, ascending from C:**\n  `C`=1 `C♯`=3 `D`=1 `D♯`=3 `E`=2 `F`=1 `F♯`=3 `G`=1 `G♯`=3 `A`=1 `A♯`=3 `B`=2 `C`=1\n  (fingering `1 3 1 3 2 1 3 1 3 1 3 2 1`).\n- **Descending:** reverse each hand — the same 3-on-black-keys logic applies.\n\nSteps:\n\n1. **One hand at a time, slowly.** Say \"one, three, one, three…\" so the pattern becomes automatic.\n2. Keep finger 3 arched and confident on the black keys; let the thumb glide, never jab.\n3. Play close to the keys — fingers barely leave the surface — for speed and control.\n4. **Hands together** once each hand is secure. Start around ♩ = 60 at four notes per beat.\n\n<div data-tmr-embed=\"0\"></div>\n\n## Common mistakes\n\n- **Thumb accents.** The thumb note tends to bark — soften it and match the black-key volume.\n- **Losing the pattern at E–F and B–C.** These adjacent white keys are where fingering breaks down;\n  drill them in isolation.\n- **Playing too loud/tense.** Chromatics reward a light touch; force just slows you down.\n\n## How to progress\n\nExtend to two octaves, then start the scale from different notes (the fingering rule stays the same).\nRamp the tempo on [/tools/metronome](/tools/metronome). Pair with the finger-independence work in\n[Hanon Exercise No. 1](/hanon-virtuoso-pianist-no-1) and the diatonic\n[C Major Scale — Two Octaves](/c-major-scale-two-octaves).",
    "details": {
      "form": "exercise",
      "related": [
        "c-major-scale-two-octaves",
        "hanon-virtuoso-pianist-no-1",
        "major-scales-all-keys"
      ],
      "embeds": [
        {
          "tool": "keyboard",
          "title": "Every note, in order",
          "caption": "The chromatic scale lights up all twelve keys. Click along from C to C — every white and black key in turn.",
          "root": "C",
          "scale": "chromatic",
          "size": 49
        }
      ]
    },
    "extraTags": [
      "exercise"
    ]
  },
  "circle-of-fifths-reference": {
    "bodyMdx": "## What the circle of fifths is\n\nThe circle of fifths is a single diagram that arranges all twelve major (and minor) keys around a\nclock face, ordered by the **perfect fifth**. Move one step **clockwise** and you go *up* a fifth,\nadding one sharp; move one step **counter-clockwise** you go *up* a fourth (down a fifth), adding one\nflat. It is the master map of key signatures, relationships, and chord movement.\n\n## How to read it\n\nStart at the top (12 o'clock) with **C major — no sharps, no flats** — and travel clockwise:\n\n- **Clockwise (sharps add one at a time):**\n  `C → G(1♯) → D(2♯) → A(3♯) → E(4♯) → B(5♯) → F♯(6♯) → C♯(7♯)`\n- **Counter-clockwise (flats add one at a time):**\n  `C → F(1♭) → B♭(2♭) → E♭(3♭) → A♭(4♭) → D♭(5♭) → G♭(6♭) → C♭(7♭)`\n- At the bottom the keys meet as **enharmonic** pairs (same sound, different spelling): `B/C♭`,\n  `F♯/G♭`, `C♯/D♭`.\n\nTwo memory aids:\n\n- **Order of sharps:** `F C G D A E B` — \"Father Charles Goes Down And Ends Battle.\"\n- **Order of flats:** the reverse — `B E A D G C F` (\"BEAD\" + \"GCF\").\n\nEach major key also has a **relative minor** sharing its key signature, sitting just inside the\ncircle — a minor third *below* the major (its 6th scale degree). So `C` major pairs with `A` minor,\n`G` major with `E` minor, and so on.\n\n## How to use it\n\n- **Find a key signature fast.** Count the steps from C: `A` major is 3 clockwise, so 3 sharps.\n- **Transpose.** Rotate a progression around the circle to shift it into a new key.\n- **Build progressions.** Chords next to each other on the circle sound closely related — the ii–V–I\n  and I–IV–V progressions are all near neighbours.\n- **Practise scales in order** so each new key changes by only one accidental.\n\nUse the interactive circle below to click any key and see its signature, relative minor, and\nneighbouring chords light up.\n\n<div data-tmr-embed=\"0\"></div>\n\n## Related practice\n\nPut the circle to work by learning [Major Scales in All Keys](/major-scales-all-keys) in circle order,\nstarting from the [C Major Scale — Two Octaves](/c-major-scale-two-octaves), and connect keys to sound\nwith the [Interval Ear-Training Primer](/interval-ear-training-primer).",
    "details": {
      "form": "reference",
      "related": [
        "major-scales-all-keys",
        "interval-ear-training-primer",
        "c-major-scale-two-octaves"
      ],
      "embeds": [
        {
          "tool": "circle-of-fifths",
          "title": "The circle of fifths",
          "caption": "Click a key to see its signature and neighbours."
        }
      ]
    },
    "extraTags": []
  },
  "clementi-sonatina-op36-no1-1st-mvt": {
    "bodyMdx": "## About this piece\nIf any single piece could be called \"the student sonatina,\" this is it. Muzio Clementi — an Italian-born composer, pianist, teacher, and even piano manufacturer who spent his career in London — published his *Six Sonatinas, Op. 36* in 1797 expressly as progressive teaching material, and they have never left the piano bench since. The first movement of No. 1 in C major is where countless pianists first meet Classical sonata form on their own terms. It is crisp, cheerful, and beautifully proportioned. (The tempo is marked *Spiritoso* — \"spirited\" — in the original; some editions title it simply *Allegro*.)\n\n## What to listen for\nThis is a compact sonata-form movement in bright C major. A bold opening theme built on scales and confident chords gives way to a lighter second idea in the dominant, G major; a brief development toys with the material before the recapitulation brings everything home. Listen for the tidy question-and-answer phrasing and the clean contrast between the assertive first theme and the more graceful second.\n\n## What you'll learn\nThis movement is a workout in even, fluent scale runs, clear articulation (the mix of detached and connected notes that defines Classical style), balanced hands, and an introduction to sonata form's map of themes and keys. It builds real fingerwork discipline.\n\n## How to practise\nDrill the scale passages slowly and evenly with sensible fingering — they are the heart of the piece and must run smoothly. Observe the articulation carefully: Classical music lives on the difference between crisp staccato and smooth legato. Keep a steady, spirited-but-controlled tempo; don't let the fast runs drag or bolt. Learn it by section (first theme, transition, second theme, development, recap) so you understand the form, then join them. Hands separately first wherever the runs get tricky.\n\n## If you like this\nThe *Kuhlau Sonatina Op. 20 No. 1* is the natural next step up. Mozart's *Sonata K. 545* is the full-scale version of the same idea, and the *Beethoven Sonatina in G* sits comfortably alongside.",
    "details": {
      "key": "C major",
      "era": "Classical",
      "form": "Sonatina, first movement (Spiritoso / Allegro)",
      "timeSignature": "4/4",
      "composer": "Muzio Clementi",
      "composerDates": "1752–1832",
      "composedYear": "published 1797",
      "related": [
        "kuhlau-sonatina-op20-no1-1st-mvt",
        "mozart-sonata-k545-1st-mvt",
        "beethoven-sonatina-in-g-anh5"
      ]
    },
    "extraTags": [
      "public-domain",
      "intermediate"
    ]
  },
  "czerny-op-599-no-1": {
    "bodyMdx": "## Goal\n\nCarl Czerny — a pupil of Beethoven and teacher of Liszt — wrote his *Practical Method for Beginners*,\nOp. 599, as a graded set of 100 short studies. **No. 1 is the very first**, and it does one job well:\nit settles a beginner into a **five-finger position** and builds **evenness, legato, and a quiet\nhand** before anything harder arrives. If your scales feel lumpy, this study smooths them out.\n\n## How to do it\n\nThe piece stays in C major, in common time (`4/4`), with both hands anchored over the five white keys\n`C D E F G`.\n\n1. **Set the five-finger position:** right-hand thumb on `C`, finger 5 on `G`; left hand mirrors it an\n   octave below (finger 5 on `C`, thumb on `G`). Fingers rest lightly on their keys — no reaching.\n2. **Right hand carries the melody** in steady quarter notes, walking up and down the five-finger\n   shape (`C D E F G` and back). Keep fingers `1 2 3 4 5` over their own keys the whole time.\n3. **Left hand supports** with longer, held notes underneath — let them ring cleanly without thumping.\n4. **Count out loud** \"1 2 3 4\" for every bar so the pulse never sags.\n5. **Play legato:** each finger presses only as the previous one releases, so notes connect with no\n   gap and no overlap. Aim for a gentle *Allegro*, but start far slower — around ♩ = 66.\n6. Hands separately first, then hands together once each is secure.\n\n## Common mistakes\n\n- **Bumpy quarter notes.** Uneven volume usually means the hand is tense — lighten the touch and slow\n  down.\n- **Collapsing fingers.** Keep a rounded hand; a flattening 4th or 5th finger loses control.\n- **Losing the pulse when hands combine.** Drop back to a tempo where both hands stay effortless.\n\n## How to progress\n\nOnly nudge the tempo up once the study is even and relaxed, then move on to Op. 599 No. 2 and beyond.\nReinforce the five-finger control with [Hanon Exercise No. 1](/hanon-virtuoso-pianist-no-1), and take\nthe same steadiness into the [C Major Scale — Two Octaves](/c-major-scale-two-octaves). Practise to a\nclick from [/tools/metronome](/tools/metronome).",
    "details": {
      "key": "C major",
      "era": "Classical",
      "form": "study",
      "timeSignature": "4/4",
      "composer": "Carl Czerny",
      "composerDates": "1791–1857",
      "related": [
        "hanon-virtuoso-pianist-no-1",
        "c-major-scale-two-octaves"
      ]
    },
    "extraTags": [
      "public-domain",
      "exercise",
      "beginner"
    ]
  },
  "danny-boy": {
    "bodyMdx": "## About this song\n\"Danny Boy\" pairs one of Ireland's most famous melodies with an English lawyer's lyric. The tune is the \"Londonderry Air,\" collected in the mid-19th century by Jane Ross of Limavady, County Londonderry, and published in George Petrie's 1855 *The Ancient Music of Ireland*. The words came later: the English lawyer and prolific lyricist Frederic Weatherly (1848–1929) wrote \"Danny Boy\" in 1910 for a different tune, then reworked it in 1913 to fit the \"Londonderry Air\" after his sister-in-law sent him a copy of the melody. The song's tender farewell — a parent or lover bidding goodbye to a young man going away — struck a deep chord, and it became one of the most popular ballads of the century, adopted with special affection by the Irish diaspora.\n\n## What to listen for\nThis is a song of soaring lines. The melody is famous for its wide range and its long climactic phrase near the end (\"but come ye back\"), which climbs high before resolving. It follows a classic AABA shape over a broad 4/4, and its harmony is richer than a typical folk tune, with passing chords that lend a bittersweet colour.\n\n## What you'll learn\n\"Danny Boy\" is a study in long-line phrasing, breath and dynamic control, and pacing toward a single emotional peak. You will practise sustaining and shaping notes across a wide range, and building intensity gradually rather than all at once.\n\n## How to play it\nIt is commonly played in E-flat or C major; choose the key that keeps the high climax comfortable to sing. Because of the range and the passing harmonies, this sits a step above a three-chord song — expect to move through more chords and to voice-lead them smoothly. Pianists should use the pedal to sustain the melody; guitarists can fingerpick or strum broadly. Save your fullest dynamic and tone for that final rising phrase.\n\n## If you like this",
    "details": {
      "key": "E-flat major",
      "era": "Folk",
      "form": "AABA (32-bar song form)",
      "timeSignature": "4/4",
      "composer": "Frederic Weatherly (lyrics); melody 'Londonderry Air' (traditional Irish)",
      "composerDates": "Frederic Weatherly 1848–1929",
      "composedYear": "lyrics 1910; set to 'Londonderry Air' 1913",
      "related": [
        "shenandoah",
        "amazing-grace-trad",
        "aloha-oe-ukulele"
      ]
    },
    "extraTags": [
      "public-domain",
      "folk",
      "irish",
      "ballad"
    ]
  },
  "debussy-arabesque-no1": {
    "bodyMdx": "## About this piece\nThe *Première Arabesque* comes from Debussy's *Deux arabesques* (L. 66), written while the composer was still in his twenties, between about 1888 and 1891. It is early Debussy — the shimmering, colour-drenched style that would define impressionism is already peeking through. An \"arabesque\" originally means a flowing, ornamental line in art, and that's exactly what the music offers: graceful ribbons of notes that curl and unwind. In E major, it is bright, fresh, and endlessly graceful — one of the most-loved gateways into Debussy's piano world.\n\n## What to listen for\nThe opening is built on rippling arpeggios that rise and fall like water. The most delicious detail is the cross-rhythm: the right hand often plays groups of three notes against the left hand's two (or vice versa), so the two hands seem to gently pull apart and flow back together. This \"three against two\" gives the piece its floating, weightless swing. Listen too for the more song-like middle section, which grows warmer and more flowing before the opening ribbons return.\n\n## What you'll learn\nThis is a classic study in arpeggios and in coordinating cross-rhythms between the hands — a skill that unlocks huge amounts of romantic and impressionist repertoire. You'll also work on evenness, since those flowing figures need to sound smooth and unhurried rather than lumpy.\n\n## How to practise\nPractise hands separately first, especially the arpeggio patterns, aiming for a light, even touch. To master the two-against-three, count slowly and feel where the notes line up and where they don't; play it under tempo until the swing feels natural. Keep the wrists loose and let the pedal wash the harmonies together, clearing it whenever the sound thickens.\n\n## If you like this\nMove on to Debussy's *Clair de Lune* for his most famous impressionist masterpiece, or try Satie's *Gymnopédie No. 1* for a calmer corner of the same French world.",
    "details": {
      "key": "E major",
      "era": "Impressionist",
      "form": "Arabesque (ternary character piece), from Deux arabesques, L. 66",
      "timeSignature": "4/4",
      "composer": "Claude Debussy",
      "composerDates": "1862–1918",
      "composedYear": "1888–1891",
      "related": [
        "debussy-clair-de-lune",
        "satie-gymnopedie-no1",
        "satie-gnossienne-no1"
      ]
    },
    "extraTags": [
      "public-domain",
      "advanced"
    ]
  },
  "debussy-clair-de-lune": {
    "bodyMdx": "## About this piece\n\"Clair de Lune\" — French for \"moonlight\" — is the third and by far the most famous movement of Debussy's *Suite bergamasque* (L. 75). Debussy began the suite around 1890 but heavily revised it before publishing in 1905, so what we play is the work of a mature master. The title comes from a poem by Paul Verlaine, and the music captures its dreamy, moonlit mood perfectly. In D-flat major and marked *andante très expressif*, it is one of the most beloved pieces of music ever written — luminous, tender, and quietly magical.\n\n## What to listen for\nThe opening melody floats in gentle, uneven groups, played mostly *pianissimo*, as if lit only by moonlight. Notice how Debussy layers voices so a melody sings out over softly murmuring inner notes. A more flowing middle section brings rippling arpeggios and a rising wave of warmth before the music settles back into stillness. The whole piece breathes — it swells and recedes rather than marching in strict time.\n\n## What you'll learn\nThis is an advanced study in tone colour, voicing, and pedalling. You'll learn to draw many dynamic shades out of a quiet touch, to bring a melody out of a texture with the same hand playing other notes, and to use the pedal as a painter uses light.\n\n## How to practise\nWork slowly and in small sections; the *9/8* metre feels natural once you stop counting rigidly and let it flow. Practise voicing — play the melody notes a little louder than the accompaniment within the same hand. Change the pedal cleanly on each harmony so the sound stays clear. Keep everything softer than feels comfortable; the magic is in restraint.\n\n## If you like this\nTry Debussy's *Première Arabesque* for an easier taste of the same style, or Satie's *Gymnopédie No. 1* for another quiet, moonlit mood.",
    "details": {
      "key": "D-flat major",
      "era": "Impressionist",
      "form": "Third movement of Suite bergamasque, L. 75 (ternary form)",
      "timeSignature": "9/8",
      "composer": "Claude Debussy",
      "composerDates": "1862–1918",
      "composedYear": "begun c. 1890, revised and published 1905",
      "related": [
        "debussy-arabesque-no1",
        "satie-gymnopedie-no1",
        "satie-gnossienne-no1"
      ]
    },
    "extraTags": [
      "public-domain",
      "advanced"
    ]
  },
  "frankie-and-johnny": {
    "bodyMdx": "## About this piece\n\"Frankie and Johnny\" is a traditional American blues ballad — a murder ballad, in fact. It's widely believed to stem from a real 1899 shooting in St. Louis, where a woman named Frankie Baker shot her boyfriend Allen (Albert) Britt; she was acquitted on grounds of self-defence. Street singers were performing versions within weeks, early sheet music appeared in 1904, and the familiar \"Frankie and Johnny\" title was fixed in 1912 (Albert became \"Johnny\" because it sang better). With so many hands shaping it, it's genuinely **traditional** — hundreds of verses and variants exist. It's a superb vehicle for learning **12-bar blues** phrasing.\n\n## What to listen for\nA rolling, storytelling verse structure over a classic 12-bar blues chord cycle, usually capped by the refrain \"He was her man, but he done her wrong.\" Each verse advances the tale, so the same musical frame carries an ever-changing lyric — great for feeling how blues form supports narrative.\n\n## What you'll learn\nThe **12-bar blues** progression, chord changes between I, IV and V, and simple, groove-based accompaniment. It's ideal for internalising blues form and steady rhythmic strumming or comping.\n\n## Chords, keys and approach\nPlay it in any comfortable singing key; **C major** is common (I = C, IV = F, V = G7), as are G and A. Follow a standard 12-bar pattern. Approach it with a relaxed **strum** or blues shuffle, or fingerpick a simple alternating-bass pattern. Emphasise the storytelling — the accompaniment serves the words.\n\n## How to practise\nMemorise the 12-bar chord map first and strum it in time until the changes are automatic. Then sing (or hum) verses over it so the phrasing feels conversational. Try adding a light shuffle feel or a bass-strum fingerpicking pattern once the changes are secure.\n\n## If you like this\nTry *House of the Rising Sun* for another traditional narrative song, or *Wildwood Flower*.",
    "details": {
      "key": "C major (any singable key)",
      "era": "Traditional",
      "form": "song (12-bar blues ballad, strophic verses)",
      "timeSignature": "4/4",
      "composer": "Traditional",
      "composedYear": "based on an 1899 St. Louis event; first sheet music 1904; 'Frankie and Johnny' title 1912",
      "related": [
        "house-of-the-rising-sun",
        "wildwood-flower",
        "greensleeves-trad",
        "scarborough-fair"
      ]
    },
    "extraTags": [
      "public-domain"
    ]
  },
  "greensleeves-trad": {
    "bodyMdx": "## About this piece\n\"Greensleeves\" is one of the most enduring melodies in the English language, an **anonymous** tune registered in London in 1580. A popular legend claims King Henry VIII wrote it for Anne Boleyn — but this is a **myth**: the piece is built on Italian Renaissance forms (a ground-bass style) that reached England only after Henry's death. Its true author is unknown, so it is genuinely traditional. Centuries of arrangers have adopted it, and it's a wonderful introduction to modal, Renaissance-flavoured fingerstyle playing.\n\n## What to listen for\nThe gently rocking 6/8 lilt and the bittersweet, \"old\" sound of its mode. The melody hovers between minor and modal (often Dorian) colours, which is why some notes sound slightly unexpected to modern ears — that antique flavour is the whole appeal. It's built over a repeating bass pattern that gives it a hypnotic, circling feel.\n\n## What you'll learn\nFingerstyle melody-with-accompaniment, arpeggiated chords in 6/8, and a first encounter with **modal** harmony. You'll practise voicing a clear melody over quieter supporting notes and shaping long, flowing phrases.\n\n## Chords, keys and approach\nCommonly played in **A minor** or **E minor**. A typical progression runs **Am – G – Am – E** for the verse and **C – G – Am – E** for the \"Alas, my love\" refrain (chords vary by arrangement and mode). Best played **fingerstyle**, letting the thumb carry the bass while the fingers pick the melody; a gentle arpeggiated strum also works.\n\n## How to practise\nLearn the melody on its own until it truly sings. Add the accompaniment softly beneath it, keeping the 6/8 pulse smooth and rocking. Take the phrase-ends gently rather than clipping them. Enjoy the modal notes rather than \"correcting\" them — they're the point.\n\n## If you like this\nTry *Scarborough Fair* for another modal English ballad, or *House of the Rising Sun*.",
    "details": {
      "key": "A minor / Dorian (also played in E minor)",
      "era": "Traditional",
      "form": "song (ground-bass air, verse + refrain)",
      "timeSignature": "6/8",
      "composer": "Traditional (anonymous)",
      "composedYear": "registered 1580",
      "related": [
        "scarborough-fair",
        "house-of-the-rising-sun",
        "wildwood-flower",
        "frankie-and-johnny"
      ]
    },
    "extraTags": [
      "public-domain"
    ]
  },
  "handy-st-louis-blues": {
    "bodyMdx": "## About this piece\nW. C. Handy — often called the \"Father of the Blues\" — published \"St. Louis Blues\" in September 1914, and it became one of the most recorded and beloved songs of the twentieth century. Handy didn't invent the blues, but he was the first to write it down and publish it in a form that swept the world. His stated goal was \"to combine ragtime syncopation with a real melody in the spiritual tradition,\" and this song did exactly that, bridging folk blues and the popular song of its day.\n\n## What to listen for\nThe song is a fascinating hybrid. Its main verses use the classic twelve-bar blues form — the same three-line, call-and-response pattern that underpins nearly all blues and much of jazz and rock. But the famous middle section switches to a swaying habanera (tango) rhythm, the \"Spanish tinge\" that Handy loved, giving the song a smoky, exotic lift before the blues returns. Notice how the melody bends and leans on \"blue\" notes for its aching, expressive colour.\n\n## What you'll learn\nThis is a superb introduction to the twelve-bar blues form and its chords (the I, IV and V harmonies), plus the habanera rhythm — foundations for blues, jazz, and improvisation. Once the twelve-bar pattern is under your fingers, you have a template you can improvise over for a lifetime.\n\n## How to practise\nLearn the twelve-bar chord pattern first and get it thoroughly memorised — count the bars until the shape is automatic. Then add the melody, letting the blue notes bend expressively. Practise the tango-rhythm bridge separately, feeling its gentle sway. Keep a relaxed, laid-back groove; the blues should breathe, not rush.\n\n<div data-tmr-embed=\"0\"></div>\n\n## If you like this\nTry Joplin's habanera-flavoured *Solace* for a related \"Spanish tinge,\" or step back into pure ragtime with *The Entertainer*.",
    "details": {
      "key": "G major",
      "era": "Blues",
      "form": "Blues song — AABA with 12-bar-blues A sections and a 16-bar tango/habanera bridge",
      "timeSignature": "4/4 (common time)",
      "composer": "W. C. Handy",
      "composerDates": "1873–1958",
      "composedYear": "1914",
      "related": [
        "joplin-solace",
        "joplin-the-entertainer"
      ],
      "embeds": [
        {
          "tool": "progression",
          "title": "The twelve-bar blues in G",
          "caption": "The chord shape behind the tune: I7–IV7–V7 over twelve bars. Play it through, one bar per chord, until the form is automatic.",
          "key": "G",
          "chords": [
            "G7",
            "C7",
            "G7",
            "G7",
            "C7",
            "C7",
            "G7",
            "G7",
            "D7",
            "C7",
            "G7",
            "D7"
          ]
        }
      ]
    },
    "extraTags": [
      "public-domain",
      "intermediate"
    ]
  },
  "hanon-virtuoso-pianist-no-1": {
    "bodyMdx": "## Goal\n\nExercise No. 1 opens Charles-Louis Hanon's *The Virtuoso Pianist* (1873), the most famous\nfinger-drill collection ever written. Its single aim is **finger independence and evenness** — training\neach finger, especially the weaker 4th and 5th, to strike with equal weight and timing. Master it and\nscales, arpeggios, and passagework all feel steadier.\n\n## How to do it\n\nThe pattern is a rising-and-falling figure that skips one note, so the hand sits over a **sixth**\n(`C` to `A`), not a fifth. Both hands play in parallel, two octaves apart.\n\n1. **Right-hand ascending figure:** `C E F G A G F E` with fingers `1 2 3 4 5 4 3 2`. Notice the thumb\n   jumps a third (`C`→`E`); fingers `2-3-4-5` then step by seconds.\n2. **Shift up one scale step and repeat:** `D F G A B A G F`, same `1 2 3 4 5 4 3 2` fingering. Keep\n   climbing (`E G A B C…`) up two octaves.\n3. **Left hand plays the identical shape** two octaves lower, perfectly together.\n4. At the top, reverse the pattern and descend back to the start.\n5. **Tempo:** begin around ♩ = 60 with a metronome. Lift each finger high and play *forte* with a\n   firm, even touch. Hold the wrist quiet and level.\n6. Repeat the whole exercise 2–3 times without stopping.\n\n## Common mistakes\n\n- **Uneven 4th/5th fingers.** They tend to sound weak or late. Slow down until every note is equal in\n  volume, or the drill reinforces the imbalance.\n- **Tension.** A clenched wrist or raised shoulders means you are pushing too fast or too hard. Shake\n  the hand out and drop the tempo.\n- **Rushing the turn.** The note where the figure changes direction (finger 5) is where sloppiness\n  creeps in — give it the same clarity as the rest.\n\n## How to progress\n\nRamp the metronome up a few clicks only once every note is clean — Hanon suggests eventually reaching\n♩ = 108 or faster. Then continue to Exercises 2 and 3, which extend the same idea. Practise with a\nsteady click from [/tools/metronome](/tools/metronome), and pair this with the\n[C Major Scale — Two Octaves](/c-major-scale-two-octaves) to apply your evenness to real scales.",
    "details": {
      "key": "C major",
      "era": "Classical",
      "form": "technique",
      "timeSignature": "2/4",
      "composer": "Charles-Louis Hanon",
      "composerDates": "1819–1900",
      "related": [
        "czerny-op-599-no-1",
        "c-major-scale-two-octaves",
        "chromatic-scale-exercise"
      ]
    },
    "extraTags": [
      "public-domain",
      "exercise"
    ]
  },
  "house-of-the-rising-sun": {
    "bodyMdx": "## About this piece\n\"The House of the Rising Sun\" is a traditional folk song with **no single known composer** — it grew and changed over generations through oral tradition (catalogued as Roud 6393). Its roots probably lie in old English broadside ballads carried to America by emigrants, where it was reset in New Orleans. The earliest surviving recording dates to 1934 (Clarence Ashley and Gwen Foster), and the song became world-famous through The Animals' 1964 arrangement. Because it belongs to everyone, countless versions exist — treat it as a shape to make your own.\n\n## What to listen for\nA brooding tale of a life gone wrong, set to a rolling 6/8 lilt. The famous minor-key arpeggio pattern gives it its haunting, circling character, each chord flowing into the next like a slow waltz-in-two.\n\n## What you'll learn\nArpeggiated chord accompaniment in 6/8, smooth chord changes, and steady fingerpicking. It's an ideal early fingerstyle song because the pattern repeats over changing chords, letting you focus on one hand at a time.\n\n## Chords, keys and approach\nCommonly played in **A minor**. A widely used progression is **Am – C – D – F – Am – C – E** (some versions end the cycle on E7). Capo and key vary with the singer. **Fingerpicking** suits it best: roll a broken-chord pattern (bass note then higher strings) through each chord in the 6/8 feel. It also works with a gentle arpeggiated strum. Keep the tempo unhurried and let the bass notes ring.\n\n## How to practise\nLearn the chord shapes and changes first, strumming once per chord in time. Then add the arpeggio, keeping the thumb steady on the bass. Practise the trickiest change (often to F) in isolation. Sing or hum the melody so your accompaniment breathes with the words.\n\n<div data-tmr-embed=\"0\"></div>\n\n## If you like this\nTry other traditional fingerstyle songs like *Scarborough Fair* and *Greensleeves*, or the flatpicking classic *Wildwood Flower*.",
    "details": {
      "key": "A minor",
      "era": "Traditional",
      "form": "song (strophic verses)",
      "timeSignature": "6/8",
      "composer": "Traditional",
      "composedYear": "origins 18th–19th c.; first recorded 1934",
      "related": [
        "scarborough-fair",
        "greensleeves-trad",
        "wildwood-flower",
        "frankie-and-johnny"
      ],
      "embeds": [
        {
          "tool": "progression",
          "title": "The rising-sun progression",
          "caption": "The iconic minor-key climb — Am–C–D–F then Am–E7. Play it through in 6/8 to feel the sway.",
          "key": "Am",
          "chords": [
            "Am",
            "C",
            "D",
            "F",
            "Am",
            "E7"
          ]
        }
      ]
    },
    "extraTags": [
      "public-domain",
      "beginner"
    ]
  },
  "interval-ear-training-primer": {
    "bodyMdx": "## Goal\n\nAn **interval** is the distance between two pitches, and hearing intervals reliably is the foundation\nof every ear skill — transcribing melodies, tuning, improvising, and reading by sound rather than by\neye. The fastest way in is to **anchor each interval to the opening of a song you already know**. Once\n\"that leap sounds like *Twinkle*,\" you can name it instantly.\n\n## How to do it\n\nSing (or play) two notes, then match the leap to its reference song. Ascending references:\n\n| Interval | Semitones | Reference song (first two notes) |\n|---|---|---|\n| Minor 2nd | 1 | *Jaws* theme |\n| Major 2nd | 2 | \"Happy Birthday\" |\n| Minor 3rd | 3 | \"Greensleeves\" / \"Smoke on the Water\" |\n| Major 3rd | 4 | \"When the Saints Go Marching In\" |\n| Perfect 4th | 5 | \"Here Comes the Bride\" |\n| Tritone | 6 | *The Simpsons* (\"The Simp-\") |\n| Perfect 5th | 7 | \"Twinkle, Twinkle\" / *Star Wars* theme |\n| Minor 6th | 8 | \"The Entertainer\" (opening leap) |\n| Major 6th | 9 | \"My Bonnie Lies Over the Ocean\" |\n| Minor 7th | 10 | *Star Trek* (original series) theme |\n| Major 7th | 11 | \"Take On Me\" (chorus leap) |\n| Octave | 12 | \"Somewhere Over the Rainbow\" (\"Some-where\") |\n\nSteps:\n\n1. **Start with three:** the octave, perfect 5th, and major 3rd. Play each, hum its song, then guess\n   before checking. Do 10 a day.\n2. **Add one interval at a time.** Only move on when the previous ones are automatic.\n3. **Test both directions.** Descending sounds different — e.g. a descending perfect 4th opens \"Amazing\n   Grace\" (\"A-ma-\"), a descending major 3rd opens \"Swing Low, Sweet Chariot.\"\n4. **Sing back** what you hear before naming it — the voice cements the sound faster than the ear alone.\n\n## Common mistakes\n\n- **Leaning only on songs.** Use them as training wheels, then challenge yourself to name intervals\n  cold.\n- **Ignoring direction.** Ascending and descending are separate skills — drill both.\n- **Confusing near neighbours** (P4 vs P5, M6 vs m7). Contrast the pair directly until the difference\n  is obvious.\n\n## How to progress\n\nMove from single intervals to short two- and three-note melodies, then whole phrases. Use the keyboard\nbelow to play the reference intervals from C, connect what you hear to theory using the\n[Circle of Fifths reference](/circle-of-fifths-reference), and reinforce pitch relationships by singing\n[Major Scales in All Keys](/major-scales-all-keys) as you play them.\n\n<div data-tmr-embed=\"0\"></div>",
    "details": {
      "form": "exercise",
      "related": [
        "circle-of-fifths-reference",
        "major-scales-all-keys"
      ],
      "embeds": [
        {
          "tool": "keyboard",
          "title": "Play the reference intervals",
          "caption": "Use the highlighted C-major notes to sing/play the reference songs.",
          "root": "C",
          "scale": "major",
          "size": 49
        }
      ]
    },
    "extraTags": [
      "beginner"
    ]
  },
  "joplin-maple-leaf-rag": {
    "bodyMdx": "## About this piece\nThe \"Maple Leaf Rag\" is the piece that launched the ragtime craze. Published in 1899 and named after the Maple Leaf Club in Sedalia, Missouri, it became the first instrumental sheet-music hit to sell in the hundreds of thousands, and it made Scott Joplin's name. Every rag that came after it lived in its shadow — even Joplin's own. If you want to understand where ragtime, and later jazz, came from, this is the foundation stone.\n\n## What to listen for\nFrom the very first bar the left hand drives a steady \"stride\" bass — low note, chord, low note, chord — that never lets up, while the right hand fires off crackling syncopated figures on top. Listen for the bold, striding energy and the way each strain has its own character, moving through the classic ragtime march form (roughly AABBACCDD). Notice the rich, warm sound of A-flat major, a key Joplin clearly loved.\n\n## What you'll learn\nThis is a serious workout in rhythmic independence and left-hand stamina. The striding bass demands accurate leaps and a steady pulse, while the right hand's syncopations sit right on top of it. Master this and you have real ragtime technique under your fingers.\n\n## How to practise\nBuild the left-hand stride slowly and securely — accuracy of the leaps matters more than speed. Practise one strain at a time, hands separately before together. Keep the pulse even and unhurried: as Joplin himself insisted, \"It is never right to play ragtime fast.\" A confident, moderate tempo lets every syncopation ring clearly.\n\n## If you like this\nMove on to Joplin's *Pineapple Rag* or the ever-popular *The Entertainer*, and hear how his followers built on him in James Scott's *Frog Legs Rag* and Joseph Lamb's *American Beauty Rag*.",
    "details": {
      "key": "A-flat major",
      "era": "Ragtime",
      "form": "Classic rag (multi-strain march form, AABBACCDD)",
      "timeSignature": "2/4",
      "composer": "Scott Joplin",
      "composerDates": "c. 1868–1917",
      "composedYear": "1899",
      "related": [
        "joplin-the-entertainer",
        "joplin-pineapple-rag",
        "scott-frog-legs-rag"
      ]
    },
    "extraTags": [
      "public-domain",
      "advanced"
    ]
  },
  "joplin-pineapple-rag": {
    "bodyMdx": "## About this piece\nPublished in 1908 (its original title spelled \"Pine Apple Rag\"), this is Joplin from his mature middle period — tuneful, relaxed, and full of easy charm. By this point Joplin had left Missouri for New York and was writing rags of real polish. The \"Pineapple\" is one of his most singable: where the *Maple Leaf* strides and the *Entertainer* skips, this one saunters, with an especially catchy second strain that lodges in your head for days.\n\n## What to listen for\nAs in all classic rags, the left hand keeps a steady \"oom-pah\" pulse while the right hand syncopates over the top. Listen for how the music brightens as it moves from the opening in B-flat major into E-flat major for the middle strains. The second strain in particular has a warm, swinging lilt — this is ragtime at its most good-natured and melodic.\n\n## What you'll learn\nYou'll strengthen the core ragtime skill of keeping an even left hand under a syncopated right hand, and you'll get practice handling a change of key partway through a piece. The singable strains also make it a good study in bringing out a melody warmly rather than hammering it.\n\n## How to practise\nLearn the left-hand accompaniment until it runs on autopilot, then add the syncopated right hand slowly, one strain at a time. Pay attention when the key shifts to E-flat — new sharps and flats to keep track of. Keep the tempo moderate and swinging; Joplin's rule holds here too: never play ragtime fast. Aim for a relaxed groove rather than a race.\n\n## If you like this\nTry the mighty *Maple Leaf Rag* or the cheerful *The Entertainer*, and hear Joplin's more theatrical side in *The Ragtime Dance*.",
    "details": {
      "key": "B-flat major (opening), moving to E-flat major",
      "era": "Ragtime",
      "form": "Classic rag (multi-strain march form)",
      "timeSignature": "2/4",
      "composer": "Scott Joplin",
      "composerDates": "c. 1868–1917",
      "composedYear": "1908",
      "related": [
        "joplin-maple-leaf-rag",
        "joplin-the-entertainer",
        "joplin-ragtime-dance"
      ]
    },
    "extraTags": [
      "public-domain",
      "advanced"
    ]
  },
  "joplin-ragtime-dance": {
    "bodyMdx": "## About this piece\n\"The Ragtime Dance\" has an unusual history. Joplin first published it in 1902 as an ambitious song-and-dance number, complete with a narrator calling out the steps — but it sold poorly. Four years later, in 1906, he distilled it into the shorter piano solo we play today, subtitled \"A Stop-Time Two Step.\" It is one of his most energetic and theatrical pieces, bursting with the spirit of the social dances of his day.\n\n## What to listen for\nAlongside the usual driving ragtime syncopation, the famous feature here is \"stop-time.\" In one section the piano suddenly thins out and the player is instructed to stamp a heel on the floor in time with the beat, so the rhythm keeps going even when the notes drop away. It's a thrilling, foot-stomping effect that makes the dance feel physically present. Listen too for the shift from the opening in B-flat major up into E-flat major.\n\n## What you'll learn\nThis piece teaches rhythmic drive and confidence: you have to keep an unshakeable internal pulse, especially through the stop-time passages where the texture gets sparse. It's a great study in feeling the beat in your body rather than just reading it.\n\n## How to practise\nLock in a steady pulse first — tap your foot or use a metronome so the rhythm is rock solid before the notes thin out in the stop-time section. Learn the strains one at a time and keep the left hand even. Have fun with the heel-stamp (or a firm foot-tap): it's meant to be played with a grin. And keep the tempo dignified — as Joplin always insisted, ragtime is never right played fast.\n\n## If you like this\nTry Joplin's *The Entertainer* and *Maple Leaf Rag*, or the sunnier *Pineapple Rag*.",
    "details": {
      "key": "B-flat major (opening), moving to E-flat major",
      "era": "Ragtime",
      "form": "Multi-strain rag with a stop-time section; subtitled 'A Stop-Time Two Step' (1906 piano solo)",
      "timeSignature": "2/4",
      "composer": "Scott Joplin",
      "composerDates": "c. 1868–1917",
      "composedYear": "song 1902; piano-solo rag 1906",
      "related": [
        "joplin-the-entertainer",
        "joplin-maple-leaf-rag",
        "joplin-pineapple-rag"
      ]
    },
    "extraTags": [
      "public-domain",
      "intermediate"
    ]
  },
  "joplin-solace": {
    "bodyMdx": "## About this piece\n\"Solace — A Mexican Serenade,\" published in 1909, is a piece apart in Joplin's output. Instead of the striding, syncopated energy of his rags, it drifts along on a gentle, swaying habanera rhythm — the same lilting \"tango\" feel found in Latin American dance music of the era. Many listeners know it from the film *The Sting*, where its tenderness offered a soft contrast to Joplin's bouncier numbers. It is one of his most lyrical, songful creations, closer to a love song than a dance.\n\n## What to listen for\nRather than the usual \"oom-pah,\" the left hand rocks in the habanera pattern — a long note followed by shorter ones that gives the music its gentle, swaying sway. Above it the right hand sings a warm, unhurried melody. Listen for how relaxed and romantic the whole thing feels: this is ragtime's more tender, reflective face, glowing in A-flat major.\n\n## What you'll learn\nYou'll get comfortable with the habanera rhythm, a building block of Latin, blues, and jazz styles alike. It's also an excellent study in playing lyrically — shaping a singing melody over a soft, dance-like accompaniment.\n\n## How to practise\nLearn the habanera left-hand pattern first and let it settle into a gentle groove; keep it quiet so the melody can sing over the top. Bring out the right-hand tune warmly and give the phrases room to breathe. This is a piece that rewards patience — take Joplin's advice and never play it fast; a slow, tender tempo is exactly right here.\n\n## If you like this\nExplore Joplin's more famous rags such as *The Entertainer*, or hear the same habanera \"Spanish tinge\" in W. C. Handy's *St. Louis Blues*.",
    "details": {
      "key": "A-flat major",
      "era": "Ragtime",
      "form": "Multi-strain rag with a habanera (tango) rhythm; subtitled 'A Mexican Serenade'",
      "timeSignature": "2/4",
      "composer": "Scott Joplin",
      "composerDates": "c. 1868–1917",
      "composedYear": "1909",
      "related": [
        "joplin-the-entertainer",
        "joplin-pineapple-rag",
        "handy-st-louis-blues"
      ]
    },
    "extraTags": [
      "public-domain",
      "intermediate"
    ]
  },
  "joplin-the-entertainer": {
    "bodyMdx": "## About this piece\n\"The Entertainer\" is probably the single most recognisable piece of ragtime ever written. Scott Joplin — the \"King of Ragtime\" — published it in 1902 with the subtitle \"A Rag Time Two Step.\" For decades it was a period curiosity, until it was used in the 1973 film *The Sting* and became a worldwide hit all over again. Joplin was a serious, classically-minded composer who wanted ragtime respected as art music, and this cheerful, elegant rag shows exactly why it deserves to be.\n\n## What to listen for\nRagtime's signature sound is syncopation: the right-hand melody deliberately lands *between* the beats, tugging playfully against a steady left hand. Listen to how the left hand keeps a rock-solid \"oom-pah\" — a low bass note followed by a mid-range chord — like a marching band, while the tune skips and dances above it. Like a march, the piece is built from several distinct sections (strains), each with its own tune, and Joplin moves through them in a set order.\n\n## What you'll learn\nThis is a wonderful study in hand independence and rhythm: the left hand must stay steady and even while the right hand syncopates against it. You'll also sharpen your sense of steady pulse and get comfortable reading in 2/4.\n\n## How to practise\nMaster the left-hand \"oom-pah\" first until it is automatic — it is the engine of the whole piece. Then add the right hand slowly, counting carefully so the syncopations land accurately. Learn one strain at a time. And heed Joplin's own famous advice printed on his rags: \"Do not play this piece fast. It is never right to play ragtime fast.\" A relaxed, dignified tempo sounds far better than a rushed one.\n\n## If you like this\nTry Joplin's landmark *Maple Leaf Rag*, or explore the wider ragtime family with James Scott's *Frog Legs Rag*.",
    "details": {
      "key": "C major",
      "era": "Ragtime",
      "form": "Classic rag (multi-strain march form), subtitled 'A Rag Time Two Step'",
      "timeSignature": "2/4",
      "composer": "Scott Joplin",
      "composerDates": "c. 1868–1917",
      "composedYear": "1902",
      "related": [
        "joplin-maple-leaf-rag",
        "joplin-pineapple-rag",
        "scott-frog-legs-rag"
      ]
    },
    "extraTags": [
      "public-domain",
      "intermediate"
    ]
  },
  "kuhlau-sonatina-op20-no1-1st-mvt": {
    "bodyMdx": "## About this piece\nFriedrich Kuhlau was a German-born composer who fled Napoleon's occupation of Hamburg and settled in Copenhagen, where he became a central figure in Danish music. Today he's remembered by flautists for his flute works and by pianists everywhere for his teaching sonatinas — especially the sets Op. 20 and Op. 55, which sit on the shelf right beside Clementi's. The first movement of Op. 20 No. 1 in C major is a bright, idiomatic Allegro: a little more brilliant and pianistic than the average student piece, and genuinely fun to play once it's under the fingers.\n\n## What to listen for\nIt's a Classical sonata-form movement in sunny C major, sparkling with running scale and arpeggio figures. A lively first theme leads, via a busy transition, to a contrasting idea in the dominant, G major; a short development stirs the material before the recapitulation returns home. Kuhlau writes gratefully for the hands — the passagework glitters and sits well, so it sounds harder than it is once learned.\n\n## What you'll learn\nExpect a real polish of scale and arpeggio fluency, finger evenness at speed, clean Classical articulation, and hand coordination in quick passagework. It also reinforces the sonata-form roadmap and the discipline of keeping a steady tempo through brilliant runs.\n\n## How to practise\nIsolate the fast scale and arpeggio figures and practise them slowly with steady fingering, gradually increasing speed only when they're perfectly even. Keep the left hand light so the right-hand brilliance carries. Mind the articulation markings — the crispness is what makes it sparkle. Set a tempo you can hold all the way through rather than one that's fast only in the easy bars. Work in sections and hands-separately on the trickiest runs, then assemble patiently.\n\n## If you like this\nThe *Clementi Op. 36 No. 1* is its close cousin (and a touch easier). When these feel secure, Mozart's *Sonata K. 545* opens the door to the full Classical sonata.",
    "details": {
      "key": "C major",
      "era": "Classical",
      "form": "Sonatina, first movement (Allegro)",
      "timeSignature": "4/4",
      "composer": "Friedrich Kuhlau",
      "composerDates": "1786–1832",
      "composedYear": "early 19th century",
      "related": [
        "clementi-sonatina-op36-no1-1st-mvt",
        "mozart-sonata-k545-1st-mvt",
        "beethoven-sonatina-in-g-anh5"
      ]
    },
    "extraTags": [
      "public-domain",
      "intermediate"
    ]
  },
  "lamb-american-beauty-rag": {
    "bodyMdx": "## About this piece\nJoseph Lamb was the third great master of classic ragtime, alongside Scott Joplin and James Scott — and, remarkably, the only one of the three who was neither African American nor a professional performer. He was a Joplin admirer discovered by the publisher John Stark, who issued \"American Beauty Rag\" in 1913 under the subtitle \"A Rag of Class.\" Lamb himself called it a \"heavy\" rag: it blends Joplin's dignity with Scott's brilliance into something rich, full-textured, and ambitious.\n\n## What to listen for\nThis is one of the most harmonically lush rags ever written. Over the steady \"oom-pah\" left hand, Lamb fills the right hand with thick chords and full-bodied melodies rather than thin single lines, so the sound is warm and orchestral. Listen for the sweep and grandeur of the strains as they unfold in E-flat major — it feels less like a dance-hall tune and more like a concert piece.\n\n## What you'll learn\nThe dense, chord-rich writing makes this an advanced study in playing full textures cleanly: you'll work on voicing chords, managing wide hand shapes, and keeping the syncopation crisp even when both hands are busy. It stretches technique and musicianship together.\n\n## How to practise\nBreak it into strains and work slowly, giving special attention to the thick right-hand chords — practise them blocked and then in rhythm. Keep the left-hand bass steady and controlled beneath the fuller right hand. Because the texture is heavy, a moderate, unhurried tempo (true to Joplin's ragtime rule) actually sounds best and keeps every voice audible.\n\n## If you like this\nCompare it with James Scott's cascading *Frog Legs Rag* and Joplin's foundational *Maple Leaf Rag* to hear the three classic-rag masters side by side.",
    "details": {
      "key": "E-flat major",
      "era": "Ragtime",
      "form": "Classic rag (multi-strain march form); subtitled 'A Rag of Class'",
      "timeSignature": "2/4",
      "composer": "Joseph Lamb",
      "composerDates": "1887–1960",
      "composedYear": "1913",
      "related": [
        "scott-frog-legs-rag",
        "joplin-maple-leaf-rag",
        "joplin-the-entertainer"
      ]
    },
    "extraTags": [
      "public-domain",
      "advanced"
    ]
  },
  "major-scales-all-keys": {
    "bodyMdx": "## Goal\n\nOnce you can play C major, the goal is to play a major scale **starting on any of the twelve notes**.\nEvery major scale follows the same interval recipe — whole and half steps `W W H W W W H` — so what\nchanges from key to key is only the **fingering** and which black keys are involved. Learning them all\nunlocks nearly every piece and warms the hand up completely.\n\n## How to do it\n\n**White-key group — C, G, D, A, E major.** Same fingering as C:\n\n- **RH ascending:** `1 2 3 1 2 3 4` (5 on the top note)\n- **LH ascending:** `5 4 3 2 1 3 2 1`\n\n**F major** (one flat, `B♭`):\n\n- **RH:** `1 2 3 4 1 2 3 4` — the thumb tucks under after finger 4 (on `B♭`).\n- **LH:** `5 4 3 2 1 3 2 1`\n\n**The flat/black-key scales (B♭, E♭, A♭, D♭, G♭) and B major** use custom fingerings, but they all\nobey one rule that makes them learnable:\n\n1. **Never put the thumb on a black key.** The thumb lives on white keys, so the black keys fall under\n   fingers 2, 3, and 4.\n2. Because of that rule, most flat scales *start* on a finger other than 1 in the right hand — e.g.\n   **B♭ major RH begins on finger 4** (`B♭`=4 `C`=1 `D`=2 `E♭`=3 `F`=1 `G`=2 `A`=3 `B♭`=4).\n3. Learn each hand **separately and slowly**, watching where the thumb crosses. A fingering chart is\n   worth its weight here — memorise one scale per week.\n4. Practise in **circle-of-fifths order** (C → G → D → A → E …) so each new key adds just one sharp.\n\nStart at ♩ = 60, two notes per beat, one octave, then extend to two.\n\n<div data-tmr-embed=\"0\"></div>\n\n## Common mistakes\n\n- **Improvising the thumb on a black key.** It feels fine slowly and collapses at speed — follow the\n  rule.\n- **Skipping hands-separate work** on the harder keys.\n- **Always starting from C.** Rotate which key you practise first so no scale stays weak.\n\n## How to progress\n\nAdd octaves and speed with [/tools/metronome](/tools/metronome), then add contrary motion and\nparallel thirds. Use the [Circle of Fifths tool](/tools/circle-of-fifths) and\n[reference](/circle-of-fifths-reference) to drill keys in order, and revisit\n[C Major Scale — Two Octaves](/c-major-scale-two-octaves) as your fingering template.",
    "details": {
      "form": "exercise",
      "related": [
        "c-major-scale-two-octaves",
        "circle-of-fifths-reference",
        "chromatic-scale-exercise"
      ],
      "embeds": [
        {
          "tool": "circle-of-fifths",
          "title": "Every key, one turn at a time",
          "caption": "Click a key to hear its tonic and see its sharps or flats. Moving one step clockwise adds a sharp; counter-clockwise adds a flat — the order you should learn the scales in."
        }
      ]
    },
    "extraTags": [
      "exercise"
    ]
  },
  "minor-pentatonic-scale-shapes": {
    "bodyMdx": "## The scale that unlocks soloing\n\nThe **minor pentatonic** scale has just five notes (\"penta\" = five), and it is the single most useful scale for blues, rock, and pop soloing on guitar. Because it drops the two most dissonant tones of the minor scale, almost anything you play with it sounds good. We'll learn it in **A minor**, whose notes are:\n\n| Note | A | C | D | E | G |\n| --- | --- | --- | --- | --- | --- |\n| Degree | 1 | ♭3 | 4 | 5 | ♭7 |\n\nCompared to the natural minor scale (`A B C D E F G`), the pentatonic simply removes the 2nd (`B`) and the ♭6 (`F`).\n\n## Shape 1: the home box\n\nEvery guitarist starts here — the \"box\" at the 5th fret, two notes per string, with root `A` on the low `E` string. Explore it right on the fretboard: tap any note to hear it, and note where the roots (dark) fall so you always know your \"home\" note.\n\n<div data-tmr-embed=\"0\"></div>\n\nPractise the box ascending and descending until it's automatic, always coming to rest on a root `A`.\n\n## The five movable shapes\n\nThe pentatonic covers the whole neck as **five connected shapes** that interlock, each picking up where the last leaves off. Slide the position control above (or tick **Whole neck**) to see them tile the fretboard: shape 1 at fret 5, then shapes at frets 8, 10, and 12 (the octave of shape 1), plus one at fret 3 just below. Learn shape 1 cold first, then add its neighbours one at a time, always noting where the root notes fall.\n\n## Movable = every key\n\nBecause there are no open strings inside these shapes, you can slide the whole pattern to any key. Switch the **Root** on the fretboard above to move shape 1's low-E root:\n\n- **A** → home at fret 5\n- **C** → fret 8\n- **G** → fret 3\n- **D** → fret 10\n\nThe root note on the low E string names the key — one memorised shape gives you all twelve minor keys.\n\n## Making it musical\n\nThe notes alone won't sound like the blues — the *phrasing* does. Borrow these staples:\n\n- **Bends:** bend the ♭7 (`G`) up a whole step toward the root, or the 4th (`D`) up to the 5th.\n- **Slides & hammer-ons** between the two notes on a string.\n- **The blue note:** add a ♭5 (`E♭`) as a quick passing tone between the 4th and 5th to turn the minor pentatonic into the full **blues scale**.\n- **Vibrato** on held notes for expression.\n\n## Relative major connection\n\nA minor pentatonic contains the same five notes as **C major pentatonic** — they are relatives, three frets apart. So the very same shapes work over major-key songs in C if you center on `C` instead of `A`.\n\n## Try it\n\nLoop the [12-bar blues in A](/catalogue/12-bar-blues-in-a) and solo using only shape 1 at the 5th fret. Focus on landing on `A` at the ends of phrases and bending the `G`. When that feels comfortable, connect into shape 2.",
    "details": {
      "key": "A minor",
      "form": "lesson",
      "related": [
        "12-bar-blues-in-a",
        "blues-scale-piano",
        "omt-modes-of-major",
        "bass-blues-line-basics"
      ],
      "embeds": [
        {
          "tool": "scale-boxes",
          "title": "The A minor pentatonic on the fretboard",
          "caption": "Shape 1 sits at fret 5 (roots in dark blue). Tap a note to hear it; drag the position slider to walk through the five boxes.",
          "root": "A",
          "scale": "minor-pentatonic"
        }
      ]
    },
    "extraTags": [
      "blues",
      "scales"
    ]
  },
  "mozart-minuet-in-f-k2": {
    "bodyMdx": "## About this piece\nHere is Mozart the child prodigy. He wrote this little minuet in early 1762, when he was just six years old, in Salzburg; his father Leopold preserved it in the family notebook. It carries the catalogue number K. 2 — one of the earliest entries in the whole Köchel catalogue of Mozart's works. As a window into how one of history's greatest composers began, it is irresistible, and it remains a gentle, genuinely elegant first Classical piece.\n\n## What to listen for\nA minuet is a graceful court dance in 3/4, and this one is short, poised, and tuneful in the sunny key of F major. It falls into a neat binary shape — two repeated sections — with clear four-bar phrases that answer one another like question and reply. The texture is light: a clean melody in the right hand over a simple, dancing left-hand accompaniment. Notice how tidily everything balances; even a six-year-old Mozart had an instinct for symmetry.\n\n## What you'll learn\nThis piece builds a feel for Classical phrasing — shapely, balanced phrases with clear beginnings and endings — plus a steady dance pulse and light, articulate touch. It's also excellent early training in playing a graceful melody over a quiet accompaniment.\n\n## How to practise\nCount the 3/4 with a light lift on beat one, as if you were stepping a dance rather than marching. Keep the left hand soft and secondary so the tune always sings above it. Shape each four-bar phrase, then relax at its cadence before the next begins. Watch the ornaments (small trills or turns) if your edition includes them — learn the notes plainly first, then add the decoration once the line flows. Practise the two halves separately, then link them.\n\n## If you like this\nCompare it with the Baroque *Minuet in G* to hear how dance style changed between eras. When you're ready for more Mozart, his *Sonata K. 545* first movement is the natural next step.",
    "details": {
      "key": "F major",
      "era": "Classical",
      "form": "Minuet",
      "timeSignature": "3/4",
      "composer": "Wolfgang Amadeus Mozart",
      "composerDates": "1756–1791",
      "composedYear": "1762",
      "related": [
        "bach-minuet-in-g",
        "mozart-sonata-k545-1st-mvt",
        "clementi-sonatina-op36-no1-1st-mvt"
      ]
    },
    "extraTags": [
      "public-domain",
      "beginner"
    ]
  },
  "mozart-sonata-k545-1st-mvt": {
    "bodyMdx": "## About this piece\nMozart himself entered this sonata in his catalogue in 1788 as a work \"for beginners,\" and it has been known ever since as the *Sonata facile* (\"easy sonata\") — though every pianist learns that \"easy\" Mozart is a friendly fiction. The first movement, an Allegro in C major, is a model of Classical clarity and one of the most recognisable pieces in the whole repertoire. Nothing is hidden here: the textures are transparent, so every note counts, and that very cleanness is what makes it a rite of passage.\n\n## What to listen for\nThis is textbook sonata-allegro form. A bright, symmetrical first theme opens in C major; a scampering scale passage carries you to a second theme in the dominant, G major. A short development wanders through other keys before the recapitulation brings the themes back — famously, Mozart returns the first theme in F major before steering home. Underneath much of it runs the *Alberti bass*: a broken-chord left-hand pattern (low–high–middle–high) that gives the music its gentle, murmuring motor.\n\n## What you'll learn\nYou'll master the Alberti bass — quiet, even, and perfectly steady so it never competes with the melody — plus fluent C and G major scale runs, balanced two-hand coordination, and the elegant phrasing that Classical style demands. It's a complete lesson in control and clarity.\n\n## How to practise\nGive the Alberti bass its own dedicated practice: keep it soft, level, and relaxed, rotating gently from the wrist rather than jabbing each note. Drill the scale passages slowly with clean fingering until they run like beads. Balance the hands so the right-hand tune always floats above the accompaniment. Keep a strict, moderate tempo — rushing exposes every unevenness. Learn it in sections (first theme, transition, second theme) and only assemble the whole once each part is secure.\n\n## If you like this\nFor the same Classical form at a gentler size, try the *Clementi Sonatina Op. 36 No. 1* or the *Kuhlau Sonatina Op. 20 No. 1*. To hear where Mozart began, revisit his childhood *Minuet in F, K. 2*.",
    "details": {
      "key": "C major",
      "era": "Classical",
      "form": "Sonata-allegro (first movement)",
      "timeSignature": "4/4",
      "composer": "Wolfgang Amadeus Mozart",
      "composerDates": "1756–1791",
      "composedYear": "1788",
      "related": [
        "clementi-sonatina-op36-no1-1st-mvt",
        "kuhlau-sonatina-op20-no1-1st-mvt",
        "mozart-minuet-in-f-k2"
      ]
    },
    "extraTags": [
      "public-domain",
      "intermediate"
    ]
  },
  "omt-advanced-harmony-institution": {
    "bodyMdx": "## Beyond the diatonic\n\nOnce the seven diatonic chords feel like home, harmony grows richer by borrowing notes from *outside* the key. **Chromatic harmony** is the art of using pitches foreign to the current scale to add colour, tension, and — above all — to steer between keys. This deep dive assumes you know diatonic chords, seventh chords, Roman numerals, and basic voice leading.\n\n## Tonicisation and secondary dominants\n\nThe gateway to chromaticism is the **secondary dominant** — a dominant chord that resolves to a scale degree other than the tonic, briefly making that degree sound like a temporary home. Written `V/x` (\"five of x\"), each borrows a chromatic leading tone aimed at its target. In C major, `V/V` = `D7 → G`; `V/vi` = `E7 → Am`. Related are **secondary leading-tone chords** (`vii°/x`), which tonicise the same targets with a diminished sonority.\n\n## Modal mixture (borrowed chords)\n\n**Mixture** borrows chords from the parallel minor into a major key (or vice versa). In C major, pulling from C minor gives you `iv` (`Fm`), `♭VI` (`A♭`), `♭III` (`E♭`), `♭VII` (`B♭`), and the darker-sounding minor `i`. The move `I – iv – I` — with its borrowed minor subdominant — is a hallmark of Romantic and film-score warmth.\n\n## Two chromatic predominants\n\nTwo chords deserve special attention because they intensify the drive to the dominant:\n\n- **Neapolitan sixth (`♭II6`)** — a major triad built on the lowered second degree, almost always in first inversion. In C major/minor it is `D♭–F–A♭` over `F` in the bass, functioning as a predominant heading to `V`.\n- **Augmented sixth chords** — Italian, French, and German varieties, all featuring the interval of an **augmented sixth** (e.g. `A♭` up to `F♯`) that expands *outward* to an octave on the dominant. The German sixth (`A♭–C–E♭–F♯`) sounds identical to a dominant seventh, a coincidence composers exploit for surprise.\n\n## Modulation: changing key\n\n**Modulation** is a lasting move to a new tonal centre (versus a fleeting tonicisation). The most common technique is the **pivot chord** — a chord diatonic to *both* keys that reinterprets its function mid-stream. To modulate from C major to G major, a `C` chord (I in C) is heard again as IV in G, after which a `D7 (V7/G)` confirms the new key.\n\nOther routes:\n\n- **Common-tone / chromatic modulation** — a shared pitch or a smooth chromatic slide bridges distant keys.\n- **Enharmonic modulation** — respelling a pivot (the German-sixth/dominant-seventh trick, or the four-way symmetry of a diminished seventh) to jump to a remote key.\n- Closely related keys (a fifth away, or the relative minor/major) are easiest; the more sharps/flats separate the keys, the more chromatic preparation is needed.\n\n## Voice leading holds it together\n\nChromaticism sounds *coherent* only when the lines move smoothly. Keep these principles from part-writing:\n\n1. Resolve every chromatic tendency tone in its natural direction — leading tones up, chordal sevenths and the top of augmented sixths outward or down.\n2. Prefer common tones and stepwise motion; let chromatic voices slither by half step.\n3. Avoid parallel fifths and octaves even amid dense chromatic textures.\n\n## Check yourself\n\nHarmonise a modulation from C major to A minor (its relative minor): try `C: I – vi – | ` then reinterpret and cadence `a: iv – V7 – i` using a `G♯` leading tone. Identify your pivot chord and label the augmented-sixth or Neapolitan if you add one. Loop the chromatic turnaround below to hear how a secondary dominant colours a progression, and revisit the secondary-dominants and voice-leading lessons for the underlying mechanics.\n\n<div data-tmr-embed=\"0\"></div>",
    "details": {
      "form": "lesson",
      "related": [
        "omt-secondary-dominants",
        "omt-voice-leading",
        "omt-seventh-chords",
        "omt-diatonic-chords",
        "omt-cadences"
      ],
      "embeds": [
        {
          "tool": "progression",
          "title": "A chromatic progression to hear",
          "caption": "A secondary dominant (A7 = V/ii) colours this turnaround.",
          "key": "C",
          "chords": [
            "C",
            "A7",
            "Dm",
            "G7"
          ]
        }
      ]
    },
    "extraTags": [
      "cc-by-sa",
      "advanced"
    ]
  },
  "omt-cadences": {
    "bodyMdx": "## Punctuation for music\n\nA **cadence** is a short harmonic formula that closes a phrase. If a melody is a sentence, cadences are its punctuation: some land like a full stop, others hang open like a comma, and one sets you up for a surprise. Learning to hear them is the fastest way to feel *where* a piece of music breathes.\n\nEvery cadence is defined by the **last two chords** of the phrase and by how strongly they resolve. Four of them cover almost everything you will meet at first.\n\n## Authentic cadence (V–I)\n\nThe **authentic cadence** moves from the dominant to the tonic — `V–I` (or `V7–I`). It is the strongest close in tonal music because the dominant is packed with tension that only the tonic relieves. In C major that is `G–C`.\n\nTwo things make it decisive:\n\n- The **leading tone** (scale degree 7, `B` in C major) sits in the `V` chord and pulls up a half-step to the tonic `C`.\n- If there is a seventh (`G7`), its `F` falls to `E`, so the tritone `B–F` resolves outward-and-inward at once.\n\nA **perfect** authentic cadence (PAC) puts both chords in root position with the tonic note on top of the final chord — the most conclusive ending there is. Anything less (an inversion, or the third/fifth in the top voice) is an **imperfect** authentic cadence: still a close, but softer.\n\n## Plagal cadence (IV–I)\n\nThe **plagal cadence** moves `IV–I` — in C major, `F–C`. It is the gentle \"Amen\" heard at the end of hymns, and it often *follows* an authentic cadence as a final, settling gesture. There is no leading tone driving it, so it feels warm and rounded rather than urgent.\n\n## Half cadence (…–V)\n\nA **half cadence** ends *on* the dominant rather than resolving to it. Any phrase that pauses on `V` — `I–V`, `ii–V`, `IV–V` — leaves the ear expecting more, exactly like a comma. It is the classic way to end the first half of a tune before the answering phrase completes the thought.\n\n## Deceptive cadence (V–vi)\n\nThe **deceptive** (or interrupted) cadence promises the tonic and then side-steps it: `V–vi`, in C major `G–Am`. The dominant sets up every expectation of arriving home, and instead the music slips to the relative minor. It is a favourite device for extending a phrase — the \"real\" cadence is postponed for a few more bars.\n\n## Putting them side by side\n\n| Cadence | Chords | Feels like | Ends the phrase? |\n|---|---|---|---|\n| Authentic | V – I | full stop | yes, strongly |\n| Plagal | IV – I | a soft \"Amen\" | yes, gently |\n| Half | … – V | a comma | no — leaves it open |\n| Deceptive | V – vi | a surprise turn | no — postpones the close |\n\nNotice that authentic and plagal both land on `I` (closed), while half and deceptive deliberately avoid a settled tonic (open). That open/closed contrast is what lets a composer shape long stretches of music out of short phrases.\n\n## Hear them yourself\n\nBelow, a `IV–V–I` runs a plagal move (`IV–I` sound of `F` reaching toward home) straight into a full authentic cadence (`V–I`). Loop it and listen for the release when `G` finally resolves to `C`.\n\n<div data-tmr-embed=\"0\"></div>\n\n## Check yourself\n\nName the cadence for each ending in C major: (a) `G7–C`, (b) `F–C`, (c) `Dm–G` (phrase stops here), (d) `G–Am`. (Answers: authentic, plagal, half, deceptive.) Then listen for cadences at the ends of phrases in pieces from the catalogue — once you can spot them, formal structure stops being mysterious. Next, see voice-leading to learn how the individual voices actually move through these chords.",
    "details": {
      "form": "lesson",
      "related": [
        "omt-diatonic-chords",
        "omt-seventh-chords",
        "omt-voice-leading",
        "omt-secondary-dominants",
        "omt-triads-and-inversions"
      ],
      "embeds": [
        {
          "tool": "progression",
          "title": "Hear the cadences",
          "caption": "IV–V–I: a plagal move into an authentic cadence.",
          "key": "C",
          "chords": [
            "F",
            "G",
            "C"
          ]
        }
      ]
    },
    "extraTags": [
      "cc-by-sa"
    ]
  },
  "omt-diatonic-chords": {
    "bodyMdx": "## Chords that belong to a key\n\nA **diatonic chord** is a chord built only from the notes of one scale. Take a major scale, build a triad on each degree by stacking thirds *within the scale*, and you get the seven chords that \"belong\" to that key.\n\n## Building them in C major\n\nUsing only the white keys, stack a third and a fifth above each scale degree. This yields all seven diatonic chords of C major — `I ii iii IV V vi`, plus the seventh chord `vii°`, the diminished triad `B–D–F`. Tap through them in the board below to hear each one.\n\n## The pattern is the same in every major key\n\nBecause a major scale always has the same step pattern, the *qualities* of its diatonic triads never change — only the note names do. Tap each card below to hear the seven diatonic chords of C major, labelled with their Roman numerals; memorise this one sequence (maj–min–min–maj–maj–min–dim) and it works for all twelve keys:\n\n<div data-tmr-embed=\"0\"></div>\n\n**Roman-numeral notation** encodes both position and quality: uppercase for major (`I`, `IV`, `V`), lowercase for minor (`ii`, `iii`, `vi`), and lowercase with a small circle for diminished (`vii°`). This lets you describe a progression independently of key — `I–V–vi–IV` is the same \"shape\" whether you play it in C, G, or E♭.\n\n## The three functional families\n\nThe seven chords group by **function** — the role they play in tension and release:\n\n- **Tonic (rest):** `I`, and its relatives `vi` and `iii`. Home base.\n- **Predominant (motion):** `ii` and `IV`. They set up the dominant.\n- **Dominant (tension):** `V` and `vii°`. They pull strongly back to `I`, because both contain the leading tone (scale degree 7) that wants to rise to the tonic.\n\nA huge amount of tonal music is just **T → PD → D → T**, for example `I – IV – V – I` or `I – ii – V – I`.\n\n## Diatonic chords in minor keys\n\nThe natural-minor scale gives a different set of qualities (`i – ii° – III – iv – v – VI – VII`). In practice composers **raise the seventh** (the harmonic-minor adjustment) so the `v` becomes a major `V` with a true leading tone — that is what gives minor keys their strong dominant pull, as in `i – iv – V – i`.\n\n## Reading real progressions\n\nOnce you can label chords with Roman numerals, patterns jump off the page:\n\n- `I – V – vi – IV` — the ubiquitous pop progression.\n- `ii – V – I` — the backbone of jazz.\n- `I – vi – IV – V` — the classic doo-wop / 50s progression.\n\n## Check yourself\n\nWrite the seven diatonic triads of **G major** and label each. (Answer: `G` I, `Am` ii, `Bm` iii, `C` IV, `D` V, `Em` vi, `F♯°` vii° — the pattern maj-min-min-maj-maj-min-dim, exactly as in C.) Then tap back through the diatonic chords of C major above to hear each one, and move on to the cadences and seventh-chords lessons to hear how these chords resolve.",
    "details": {
      "form": "lesson",
      "related": [
        "omt-triads-and-inversions",
        "omt-seventh-chords",
        "omt-cadences",
        "omt-major-scale-key-signatures",
        "omt-secondary-dominants"
      ],
      "embeds": [
        {
          "tool": "chord-board",
          "title": "The seven diatonic chords of C major",
          "caption": "I ii iii IV V vi vii° — tap each to hear it.",
          "chords": [
            "C",
            "Dm",
            "Em",
            "F",
            "G",
            "Am",
            "Bdim"
          ],
          "labels": [
            "I",
            "ii",
            "iii",
            "IV",
            "V",
            "vi",
            "vii°"
          ]
        }
      ]
    },
    "extraTags": [
      "cc-by-sa"
    ]
  },
  "omt-intervals": {
    "bodyMdx": "## What an interval is\n\nAn **interval** is the distance between two pitches. Naming an interval takes two pieces of information: its **size** (a number) and its **quality** (a word like *major*, *minor*, *perfect*). Get both, and you have named the distance exactly.\n\n## Size: count the letter names\n\nSize comes from counting letter names inclusively, starting on the lower note as \"1.\"\n\n- `C` up to `E` spans C–D–E = three letters, so it is a **third**.\n- `C` up to `G` spans C–D–E–F–G = five letters, so it is a **fifth**.\n- A note to itself is a **unison** (1); eight letters up is an **octave** (8).\n\nNotice that the accidentals (sharps/flats) do **not** change the size. `C`–`E`, `C`–`E♭`, and `C`–`E♯` are all \"some kind of third,\" because they all span three letter names.\n\n## Quality: count the semitones\n\nQuality tells you exactly how wide the interval is, measured in **semitones** (half steps — the smallest distance on a keyboard). Two families of qualities exist:\n\n- **Perfect** applies to unisons, fourths, fifths, and octaves.\n- **Major / minor** applies to seconds, thirds, sixths, and sevenths.\n\nTap through the twelve intervals above `C` below — each card sounds the interval and shows its semitone count, from the perfect unison (0) up through the tritone (6) to the perfect octave (12). Count the letters for the size, then the semitones to fix the quality:\n\n<div data-tmr-embed=\"0\"></div>\n\n## Altering the quality\n\nShrink or stretch an interval by a semitone and its quality changes by one step:\n\n- A **major** interval made one semitone smaller becomes **minor** (major 3rd `C–E` → minor 3rd `C–E♭`).\n- A **minor** or **perfect** interval made one semitone smaller becomes **diminished**.\n- Any interval made one semitone larger becomes **augmented** (perfect 5th `C–G` → augmented 5th `C–G♯`).\n\nThe full ladder for changing a semitone at a time:\n\n`diminished → minor → MAJOR → augmented`\n`diminished → PERFECT → augmented`\n\n## Consonance and inversion\n\nPerfect intervals and major/minor thirds and sixths sound **consonant** (stable, restful); seconds, sevenths, and the tritone sound **dissonant** (tense, wanting to move). When you flip the two notes so the lower becomes the upper, you **invert** the interval. Inversions follow two tidy rules: the sizes add up to 9 (a 3rd inverts to a 6th, a 2nd to a 7th), and quality flips — major↔minor, augmented↔diminished, perfect stays perfect. So `C–E` (major 3rd) inverts to `E–C` (minor 6th).\n\n## Compound intervals\n\nIntervals larger than an octave are **compound**. A 9th is an octave plus a 2nd, an 11th an octave plus a 4th, and so on — useful vocabulary once you start reading extended chords.\n\n## Try it\n\nTap through the interval cards above and, for each, name the size by counting letters, then confirm the quality against the semitone count. Test yourself: what is `F` up to `B`? (Four letters = a fourth; six semitones = augmented — the tritone.) Then move on to the interval-ear-training primer to start hearing them.",
    "details": {
      "form": "lesson",
      "related": [
        "omt-major-scale-key-signatures",
        "omt-triads-and-inversions",
        "omt-diatonic-chords",
        "interval-ear-training-primer"
      ],
      "embeds": [
        {
          "tool": "intervals",
          "title": "The intervals within an octave",
          "caption": "Every interval from a perfect unison to a perfect octave, measured up from C — tap each to hear it.",
          "root": "C"
        }
      ]
    },
    "extraTags": [
      "cc-by-sa",
      "beginner"
    ]
  },
  "omt-major-scale-key-signatures": {
    "bodyMdx": "## The major scale is a pattern of steps\n\nEvery major scale, in any key, uses the same sequence of whole steps (W, two semitones) and half steps (H, one semitone): **W – W – H – W – W – W – H**.\n\nStarting on `C`, that pattern lands on exactly the white keys — the step between each pair of notes:\n\n| C → D | D → E | E → F | F → G | G → A | A → B | B → C |\n|---|---|---|---|---|---|---|\n| W | W | H | W | W | W | H |\n\nThe half steps fall between scale degrees 3–4 (`E–F`) and 7–8 (`B–C`). Because `C` major needs no accidentals to make the pattern work, it has an **empty key signature**.\n\n## Why other keys need accidentals\n\nStart the same W-W-H-W-W-W-H pattern on `G` and something breaks: the pattern demands a half step between degrees 7 and 8, but `F–G` is a whole step. To fix it we raise the seventh note to `F♯`, giving **G – A – B – C – D – E – F♯ – G**.\n\n`G` major therefore has a key signature of **one sharp (F♯)**. A **key signature** is simply the collection of sharps or flats needed to keep the major-scale pattern intact, written once at the start of the staff instead of on every note.\n\n## The circle of fifths generates the signatures\n\nMove up a **perfect fifth** each time (`C → G → D → A → E → B → F♯`) and you add one sharp at every step. Move down a fifth / up a fourth (`C → F → B♭ → E♭ → A♭ → D♭ → G♭`) and you add one flat. Turn the circle below to watch the sharps stack up clockwise and the flats anticlockwise, one at a time, from `C` (no accidentals) out to the seven-sharp and seven-flat keys:\n\n<div data-tmr-embed=\"0\"></div>\n\n## The order is fixed\n\nSharps are always **added** in this order: `F♯ C♯ G♯ D♯ A♯ E♯ B♯` (mnemonic: *Father Charles Goes Down And Ends Battle*). Flats are added in the reverse order: `B♭ E♭ A♭ D♭ G♭ C♭ F♭` (*Battle Ends And Down Goes Charles' Father*). Each new sharp is a fifth above the last; each new flat is a fourth above.\n\n## Reading a signature quickly\n\n- **Sharp keys:** the tonic is one semitone **above the last sharp**. Four sharps end on `D♯`; a semitone up is `E`, so it's E major.\n- **Flat keys:** the tonic is the **second-to-last flat**. Flats `B♭ E♭ A♭ D♭` — the second-to-last is `A♭`, so it's A♭ major. (The one-flat key, F major, you simply memorise.)\n\n## Enharmonic neighbours\n\nAt the bottom of the circle, keys overlap. B major (5 sharps) sounds identical to C♭ major (7 flats); F♯ major (6 sharps) equals G♭ major (6 flats). They are **enharmonically** the same pitches spelled differently — composers pick whichever notation is easier to read.\n\n## Try it\n\nName the major scale two steps clockwise from `C`: that's `D` major — apply W-W-H-W-W-W-H and you should get `D E F♯ G A B C♯`, matching its two-sharp signature. Confirm it on the circle above, then move around the keys and watch the signatures accumulate. Next lesson: how these scales generate diatonic chords.",
    "details": {
      "form": "lesson",
      "related": [
        "omt-intervals",
        "omt-diatonic-chords",
        "omt-modes-of-major",
        "circle-of-fifths-reference",
        "major-scales-all-keys"
      ],
      "embeds": [
        {
          "tool": "circle-of-fifths",
          "title": "Keys around the circle",
          "caption": "Clockwise adds sharps, anticlockwise adds flats."
        }
      ]
    },
    "extraTags": [
      "cc-by-sa",
      "beginner"
    ]
  },
  "omt-modes-of-major": {
    "bodyMdx": "## What a mode is\n\nA **mode** is a scale you get by starting the major scale on a different degree while keeping the same notes. Play the white keys from `C` to `C` and you have C major. Play the same white keys from `D` to `D` and the pattern of whole and half steps shifts — you have a *different* scale colour with the *same* notes. That is D Dorian. There are seven modes, one for each starting degree.\n\n## The seven modes of the major scale\n\nStarting each mode on a white key makes the notes obvious; the \"start degree\" is where it begins in the parent major scale:\n\n| Mode | Start on | White-key run | Character |\n|---|---|---|---|\n| Ionian | 1 (C) | C D E F G A B | the major scale itself — bright |\n| Dorian | 2 (D) | D E F G A B C | minor but hopeful (raised 6th) |\n| Phrygian | 3 (E) | E F G A B C D | dark, \"Spanish\" (flat 2nd) |\n| Lydian | 4 (F) | F G A B C D E | bright, floating (sharp 4th) |\n| Mixolydian | 5 (G) | G A B C D E F | major but bluesy (flat 7th) |\n| Aeolian | 6 (A) | A B C D E F G | the natural minor scale |\n| Locrian | 7 (B) | B C D E F G A | unstable (flat 2nd AND flat 5th) |\n\nEvery mode above uses the same white keys — the keyboard below highlights the parent C-major scale. Start on a different note for each mode (`D` = Dorian, `E` = Phrygian …) and listen to how the colour changes while the notes stay put:\n\n<div data-tmr-embed=\"0\"></div>\n\n## Two ways to think about modes\n\n**Relative (parallel-notes) view:** all seven modes above share the notes of C major; only the starting pitch — the tonal centre — changes. This is the easy way to *find* the notes.\n\n**Parallel (same-root) view:** more useful for hearing a mode's *flavour* is to compare it to the major or minor scale built on the **same root**. Describe each mode as an alteration:\n\n| Mode | Compared to | Alteration |\n|---|---|---|\n| Ionian | major scale | the major scale itself |\n| Lydian | major scale | major with a ♯4 |\n| Mixolydian | major scale | major with a ♭7 |\n| Aeolian | natural minor | the natural minor scale |\n| Dorian | natural minor | minor with a ♮6 (raised 6th) |\n| Phrygian | natural minor | minor with a ♭2 |\n| Locrian | natural minor | minor with a ♭2 and ♭5 |\n\nSo **D Dorian** = `D E F G A B C` — it is D minor but with a `B♮` instead of `B♭`, and that single bright 6th is its signature.\n\n## The \"characteristic note\"\n\nEach mode has one note that gives it its identity — change or lose it and the mode collapses into ordinary major or minor:\n\n- **Lydian:** the ♯4 (`F` Lydian's `B♮`).\n- **Mixolydian:** the ♭7 (`G` Mixolydian's `F♮`).\n- **Dorian:** the ♮6.\n- **Phrygian:** the ♭2.\n\nEmphasise that note over a drone or a static chord and the mode sings.\n\n## Where modes live in real music\n\n- **Dorian** — funk, folk, and jazz (*Scarborough Fair*, \"So What\").\n- **Mixolydian** — rock, blues, and folk vamps built on a dominant-seventh feel.\n- **Lydian** — film scores and dreamy pop.\n- **Phrygian** — flamenco and metal.\n- **Aeolian & Ionian** — most everyday minor and major songs.\n\nLocrian, with its unstable diminished tonic chord, is rare as a home key but useful in passing.\n\n## Try it\n\nPlay only the white keys but treat `G` as home — drone a `G` in the bass and improvise. You are in G Mixolydian; listen for how the `F♮` (not `F♯`) gives a bluesy, un-resolved brightness. Then try the same over `E` for Phrygian's dark colour. Use the parent-scale keyboard above to explore each mode — start on a different note for each — and revisit the major-scale-key-signatures lesson to see why the notes stay the same while the colour changes.",
    "details": {
      "form": "lesson",
      "related": [
        "omt-major-scale-key-signatures",
        "omt-intervals",
        "omt-diatonic-chords",
        "minor-pentatonic-scale-shapes"
      ],
      "embeds": [
        {
          "tool": "keyboard",
          "title": "The parent scale",
          "caption": "Every mode of C major uses only these white keys — start on a different note for each mode (D = Dorian, E = Phrygian …).",
          "root": "C",
          "scale": "major",
          "size": 49
        }
      ]
    },
    "extraTags": [
      "cc-by-sa"
    ]
  },
  "omt-rhythm-and-meter": {
    "bodyMdx": "## Beat, tempo, and meter\n\n**Rhythm** is how music is organised in time. Three ideas underpin it:\n\n- **Beat** — the steady pulse you tap your foot to.\n- **Tempo** — how fast that pulse goes, measured in beats per minute (BPM).\n- **Meter** — how beats group into repeating patterns of strong and weak.\n\nWe hear beats in groups because some feel stronger than others. Group them in twos or threes and you get the familiar feel of a march (STRONG-weak) or a waltz (STRONG-weak-weak).\n\n## Note values\n\nNote durations are related by a chain of halving. In common time a **whole note** lasts 4 beats, a **half note** 2, a **quarter note** 1, an **eighth note** ½ a beat, and a **sixteenth note** ¼ of a beat. Play the score below to hear the top of that chain line up in 4/4 — a whole note, then two halves, four quarters, and eight eighths:\n\n<div data-tmr-embed=\"0\"></div>\n\nA **dot** after a note adds half its value again: a dotted half note = 2 + 1 = 3 beats. A **rest** is a silence of the same duration as its matching note.\n\n## Measures and time signatures\n\nMusic is divided into **measures** (bars) by barlines. A **time signature** at the start tells you how each measure is counted:\n\n| Time signature | Meaning |\n| --- | --- |\n| Top number | how many beats per measure |\n| Bottom number | which note value gets one beat (4 = quarter note) |\n\n- **4/4** (\"common time\"): four quarter-note beats per bar — the default for pop, rock, and most songs.\n- **3/4**: three quarter-note beats — the waltz.\n- **2/4**: two beats — marches and polkas.\n\nCount 4/4 as \"**1** 2 3 4,\" landing weight on beat 1 (the **downbeat**). The offbeats — the \"and\" between numbers — are where syncopation lives.\n\n## Simple vs. compound meter\n\nThe bottom-number/beat relationship splits meters into two families:\n\n- **Simple meter:** each beat divides into **two** (`4/4`, `3/4`, `2/4`). Count \"1-and-2-and.\"\n- **Compound meter:** each beat divides into **three**. Here the top number is 6, 9, or 12, and the beat is a *dotted* value. **6/8** has two beats, each a dotted quarter subdividing into three eighths: count \"**1**-2-3 **4**-5-6\" but *feel* two big beats. Think of a jig or \"We Are the Champions.\"\n\nSo 6/8 is not \"six beats\" in feel — it is two beats that each split in three.\n\n## Syncopation, ties, and swing\n\n- **Syncopation** stresses the weak parts of the beat (the offbeats), creating momentum — the engine of funk, reggae, and ragtime.\n- A **tie** joins two notes into one longer sound across a beat or barline.\n- **Swing** stretches pairs of eighth notes into a long-short \"loping\" feel, central to jazz and blues, even though they are written as even eighths.\n\n## Why the barline matters\n\nThe first beat of each measure carries natural emphasis. Composers place important notes and chord changes there, and performers lean into it. Feeling *where beat 1 is* — not just counting notes — is what makes playing sound grounded rather than mechanical.\n\n## Try it\n\nReplay the note-values score above to lock the 4/4 subdivisions in your ear, then set a [metronome](/tools/metronome) to 80 BPM. Tap quarter notes for four bars of 4/4, accenting beat 1. Then switch to eighth notes (\"1-and-2-and-3-and-4-and\") without letting the pulse drift. Finally set the metronome to a dotted-quarter feel and count 6/8 in two. Once the pulse is solid, try clapping an offbeat rhythm against it to feel syncopation. Then apply it in the 12-bar-blues and ukulele-strumming lessons.",
    "details": {
      "form": "lesson",
      "related": [
        "omt-intervals",
        "12-bar-blues-in-a",
        "ukulele-strumming-patterns",
        "bass-root-fifth-patterns"
      ],
      "embeds": [
        {
          "tool": "score",
          "title": "Note values in 4/4",
          "caption": "A whole note, two halves, four quarters, eight eighths.",
          "tex": ":1 c4 | :2 c4 c4 | :4 c4 c4 c4 c4 | :8 c4 c4 c4 c4 c4 c4 c4 c4 |"
        }
      ]
    },
    "extraTags": [
      "cc-by-sa",
      "beginner"
    ]
  },
  "omt-secondary-dominants": {
    "bodyMdx": "## Borrowing the pull of the dominant\n\nIn any major key only one chord is naturally a dominant seventh — the `V7` built on scale degree 5, which pulls strongly home to the tonic. A **secondary dominant** takes that same pulling power and aims it at a *different* chord in the key, briefly making some other degree feel like a temporary home.\n\nWe write it as **V/x**, read \"five of x\". A `V/V` is \"the dominant of the dominant\" — the chord that would be `V` if the real `V` were the tonic for a moment. Every diatonic chord except the diminished `vii°` can be tonicised this way.\n\n## Building one\n\nTo find `V/x`, ask: *what is the dominant seventh a fifth above the target chord?* Then borrow it. In C major:\n\n| Symbol | Chord | Target | Why |\n|---|---|---|---|\n| V/V | D7 | G (V) | D7 is the dominant of G |\n| V/ii | A7 | Dm (ii) | A7 is the dominant of D minor |\n| V/vi | E7 | Am (vi) | E7 is the dominant of A minor |\n| V/IV | C7 | F (IV) | C7 is the dominant of F |\n\nNotice `V/ii` is `A7`, not the diatonic `Am`. Raising the third of `A` to `C♯` turns the key's `vi` chord into a real dominant seventh with its own leading tone.\n\n## The chromatic giveaway\n\nThe reason a secondary dominant sounds so strong is that it introduces a note **outside the key** — the raised third that becomes the target's own leading tone. In `A7 → Dm`, the `C♯` is that leading tone: it wants to rise a half-step to `D`, exactly the way `B` rises to `C` in a normal `V–I`. That single chromatic pitch is what your ear latches onto as extra colour.\n\nBecause the tonicisation is momentary, the key does not actually change. As soon as the secondary dominant resolves, the music is back in C major — you have simply borrowed a stronger approach to one chord.\n\n## Hear it in a progression\n\nThe progression below is a workhorse: `C – A7 – Dm – G7 – C`. The `A7` is `V/ii`; instead of drifting into `Dm`, the harmony arrives there with a hard pull, because `A7`'s `C♯` leans up into `D`. Then the ordinary `G7–C` closes with an authentic cadence.\n\n<div data-tmr-embed=\"0\"></div>\n\n## Chains of dominants\n\nSecondary dominants can string together, each one tonicising the next: `E7 → A7 → D7 → G7 → C`. Every chord is the dominant of the one that follows, so the whole passage tumbles downhill toward the tonic. This \"dominant chain\" powers countless jazz turnarounds and Romantic-era sequences.\n\n## Check yourself\n\nIn G major, spell `V/V` and name its target. (Answer: `A7`, resolving to `D`, the dominant — the raised third `C♯` is A7's leading tone into D.) Then build `V/ii`, `V/vi`, and `V/IV` in C major and listen for the out-of-key note in each. Next, see cadences and voice-leading to hear how these tonicisations resolve smoothly into place.",
    "details": {
      "form": "lesson",
      "related": [
        "omt-diatonic-chords",
        "omt-seventh-chords",
        "omt-cadences",
        "omt-voice-leading",
        "omt-triads-and-inversions"
      ],
      "embeds": [
        {
          "tool": "progression",
          "title": "A secondary dominant in action",
          "caption": "A7 is V/ii — it pulls strongly to Dm.",
          "key": "C",
          "chords": [
            "C",
            "A7",
            "Dm",
            "G7"
          ]
        }
      ]
    },
    "extraTags": [
      "cc-by-sa"
    ]
  },
  "omt-seventh-chords": {
    "bodyMdx": "## Adding a fourth note\n\nA **seventh chord** is a triad with one more third stacked on top — a note a seventh above the root. That extra note adds colour and, crucially, a **tendency to resolve**. Seventh chords are the harmonic vocabulary of blues, jazz, and Romantic music.\n\nThe four members are **root, third, fifth, seventh**. Two thirds set the triad quality; the interval from the root to the top note sets the seventh's quality (major 7th = 11 semitones, minor 7th = 10 semitones).\n\n## The five common qualities\n\nFive seventh-chord qualities cover most music, each stacking a different pair of thirds on the root. Play the five built on `C` in the score below and listen to how the colour shifts from bright to tense:\n\n<div data-tmr-embed=\"0\"></div>\n\nReading left to right they are the **major seventh** (`maj7` / `Δ7` — major triad + major 7th), the **dominant seventh** (`7` — major triad + minor 7th), the **minor seventh** (`m7` — minor triad + minor 7th), the **half-diminished seventh** (`m7♭5` / `ø7` — diminished triad + minor 7th), and the **fully diminished seventh** (`dim7` / `°7` — diminished triad + diminished 7th, its top note spelled `B♭♭`/`A`).\n\nTwo things to notice: the **dominant seventh** (major triad, minor 7th) is the workhorse of tension because it contains a **tritone** between its third and seventh; and the **fully diminished seventh** stacks three minor thirds, so it divides the octave evenly and can resolve in several directions.\n\n## Diatonic seventh chords in a major key\n\nStack sevenths on each degree of the major scale, exactly as you did with triads, and the qualities line up as a fixed pattern. Tap each chord below to hear the seven diatonic sevenths of C major, labelled with their Roman numerals — the colour runs major 7th, minor 7th, minor 7th, major 7th, dominant 7th, minor 7th, half-diminished:\n\n<div data-tmr-embed=\"1\"></div>\n\nThe **only dominant-seventh chord that occurs naturally** in a major key is on the fifth degree — `V7` — which is why `V7` so reliably signals \"we are heading home to the tonic.\"\n\n## Resolving the tension\n\nThe power of a `V7` comes from its tritone. In `G7 → C`, the tritone `B–F` squeezes inward: the leading tone `B` rises to `C`, and the seventh `F` falls to `E`. That double resolution is the strongest cadence in tonal music (a `V7–I` authentic cadence).\n\n## Figured-bass inversions\n\nSeventh chords have four notes, so they have three inversions plus root position, labelled with figures:\n\n| Position | Figure |\n|---|---|\n| Root position | `7` (full: `7/5/3`) |\n| First inversion | `6/5` |\n| Second inversion | `4/3` |\n| Third inversion | `4/2` (or just `2`) |\n\nSo `V6/5` is a dominant seventh with its third in the bass.\n\n## Where you'll meet them\n\n- **Blues** leans on dominant sevenths for *every* chord — `A7`, `D7`, `E7` — not just the V.\n- **Jazz** strings minor and dominant sevenths through `ii7–V7–Imaj7`.\n- **Classical** uses `V7` for cadences and diminished sevenths for dramatic tension and modulation.\n\n## Check yourself\n\nSpell the `ii7–V7–Imaj7` in C major and resolve it. (Answer: `Dm7` → `G7` → `Cmaj7`; listen for `G7`'s `B` rising and `F` falling into the C chord.) Replay the five qualities built on C in the score above to fix the colour of each in your ear. Next, see cadences and secondary dominants to hear these chords in action.",
    "details": {
      "form": "lesson",
      "related": [
        "omt-triads-and-inversions",
        "omt-diatonic-chords",
        "omt-cadences",
        "omt-secondary-dominants",
        "walking-bass-basics"
      ],
      "embeds": [
        {
          "tool": "score",
          "title": "The five seventh-chord qualities",
          "caption": "Cmaj7, C7, Cm7, Cm7♭5, C°7 — listen to the colour of each.",
          "tex": ":1 (c4 e4 g4 b4) | (c4 e4 g4 bb4) | (c4 eb4 g4 bb4) | (c4 eb4 gb4 bb4) | (c4 eb4 gb4 a4) |"
        },
        {
          "tool": "chord-board",
          "title": "The diatonic sevenths of C major",
          "caption": "Imaj7 ii7 iii7 IVmaj7 V7 vi7 vii∅7 — tap each to hear it.",
          "chords": [
            "Cmaj7",
            "Dm7",
            "Em7",
            "Fmaj7",
            "G7",
            "Am7",
            "Bm7b5"
          ],
          "labels": [
            "Imaj7",
            "ii7",
            "iii7",
            "IVmaj7",
            "V7",
            "vi7",
            "vii∅7"
          ]
        }
      ]
    },
    "extraTags": [
      "cc-by-sa"
    ]
  },
  "omt-triads-and-inversions": {
    "bodyMdx": "## What a triad is\n\nA **triad** is a three-note chord built by stacking two thirds. Its members have names:\n\n- **Root** — the note the chord is named for and built from.\n- **Third** — a third above the root; it decides *major vs. minor*.\n- **Fifth** — a fifth above the root; it decides *stability*.\n\nStack `C`, then a third up (`E`), then another third up (`G`) and you have a **C major** triad: `C–E–G`.\n\n## The four qualities\n\nThe two thirds inside the triad can each be major (M3, 4 semitones) or minor (m3, 3 semitones). The combination sets the quality: **major** stacks M3 then m3 (`C–E–G`, perfect 5th), **minor** stacks m3 then M3 (`C–E♭–G`, perfect 5th), **diminished** stacks two m3s (`C–E♭–G♭`, diminished 5th), and **augmented** stacks two M3s (`C–E–G♯`, augmented 5th). Tap each card below to hear all four built on `C`:\n\n<div data-tmr-embed=\"0\"></div>\n\nMajor and minor triads are consonant and common; diminished and augmented triads contain an unstable fifth and sound tense.\n\n## Inversions: which note is in the bass\n\nA triad is in **root position** when the root is the lowest sounding note. Move the root up an octave and a different chord tone sits in the bass — that is an **inversion**. The notes are the same, so it is still a C major chord, but its voicing and function shift. Play the three positions in the score below — root position (`C` in the bass), first inversion (`E` in the bass), then second inversion (`G` in the bass) — and hear how the same three notes re-stack:\n\n<div data-tmr-embed=\"1\"></div>\n\n## Figured bass shorthand\n\nClassical harmony labels inversions with **figured bass** — numbers showing the intervals above the bass note. The full figures reduce to a familiar shorthand:\n\n- **Root position** — intervals of a 5th and 3rd above the bass → figure `5/3`, usually written as nothing at all.\n- **First inversion** — a 6th and a 3rd above the bass → `6/3`, shortened to **`6`**.\n- **Second inversion** — a 6th and a 4th above the bass → **`6/4`**.\n\nSo a C major chord with `E` in the bass is a \"six chord\"; with `G` in the bass it is a \"six-four.\"\n\n## Roman numerals plus inversion\n\nCombine the two systems and you can describe any diatonic chord precisely. In C major:\n\n- `I` — C major, root position (`C–E–G`).\n- `I6` — C major, first inversion (`E–G–C`).\n- `V6/4` — G major, second inversion (`D–G–B`).\n\nThe lowercase/uppercase of the Roman numeral shows quality; the added figure shows the inversion. This is the notation you will use to analyse the pieces in the catalogue.\n\n## Why inversions matter\n\nInversions let the bass line move smoothly instead of leaping between roots, and they change a chord's stability. A root-position tonic feels final; a `6/4` chord is unstable and typically resolves onward. Composers choose inversions largely to control **voice leading** — how each line moves from chord to chord.\n\n## Check yourself\n\nSpell the F major triad, then write all three positions. (Answer: `F–A–C` root position; `A–C–F` first inversion, figure `6`; `C–F–A` second inversion, figure `6/4`.) Replay the C major triad and its inversions in the score above to hear how the same three notes shift, then continue to the diatonic-chords and seventh-chords lessons.",
    "details": {
      "form": "lesson",
      "related": [
        "omt-intervals",
        "omt-diatonic-chords",
        "omt-seventh-chords",
        "omt-voice-leading"
      ],
      "embeds": [
        {
          "tool": "chord-board",
          "title": "The four triad qualities on C",
          "caption": "Major, minor, diminished, augmented — tap each to hear it.",
          "chords": [
            "C",
            "Cm",
            "Cdim",
            "Caug"
          ],
          "labels": [
            "major",
            "minor",
            "dim",
            "aug"
          ]
        },
        {
          "tool": "score",
          "title": "C major triad and its inversions",
          "caption": "Root position, first inversion, second inversion.",
          "tex": ":1 (c4 e4 g4) | (e4 g4 c5) | (g4 c5 e5) |"
        }
      ]
    },
    "extraTags": [
      "cc-by-sa"
    ]
  },
  "omt-voice-leading": {
    "bodyMdx": "## Lines, not just chords\n\n**Voice leading** is how the individual melodic lines — the *voices* — move from one chord to the next. A progression like `C–F–G–C` tells you *which* chords sound, but not *how* each note travels to the next. Good voice leading connects those notes smoothly, so the harmony sounds like several singing lines rather than a stack of blocks being shoved around.\n\nThink of a four-part choir: soprano, alto, tenor, bass. Each singer holds one line and wants an easy note to move to. The art is choosing chord positions so that every voice moves as little as possible while the harmony still changes.\n\n## Keep the common tones\n\nIf two chords share a note, **hold that note in the same voice**. `C` (C–E–G) and `F` (F–A–C) share the note `C`; keeping `C` in one voice means only the other two notes have to move. Common tones are the glue that make consecutive chords feel related.\n\n## Move by the smallest interval\n\nWhen a voice must move, prefer a **step** (a second) over a **leap**. Inner voices especially should tiptoe from one chord tone to the nearest one in the next chord. Big jumps draw attention and break the illusion of independent lines; small moves keep everything smooth.\n\n## Resolve the tendency tones\n\nSome notes carry built-in pull and want to move a specific way:\n\n- The **leading tone** (scale degree 7) wants to rise a half-step to the tonic.\n- The **seventh of a chord** wants to fall by step.\n\nIn `G7–C`, the leading tone `B` rises to `C` and the seventh `F` falls to `E`. Honour those tendencies and cadences resolve convincingly; ignore them and the harmony sounds unfinished.\n\n## Favour contrary motion\n\n**Contrary motion** — one voice rising while another falls — is the single most reliable way to keep voices independent and the texture clean. When the bass climbs, let an upper voice descend, and vice versa. It is the opposite of everyone moving in the same direction, which tends to flatten the lines into a single thickened melody.\n\n## Avoid parallel fifths and octaves\n\nIf two voices are a fifth (or an octave) apart and both move to *another* fifth (or octave) in the same direction, they briefly fuse into one — you lose an independent voice. Classical part-writing forbids these **parallel fifths and octaves** for exactly that reason. Contrary or oblique motion is the usual cure.\n\n## A worked example\n\nThe score below is pure **contrary motion**: the top voice climbs a full scale while the bass walks down against it, one two-note chord per beat. Play it slowly and follow each line separately — the outer voices mirror each other, which is why it sounds so smooth.\n\n<div data-tmr-embed=\"0\"></div>\n\n## Where it matters\n\n- **Harmonising a melody:** choose chord voicings that keep the accompaniment lines smooth under the tune.\n- **Arranging a lead sheet:** a lead sheet gives symbols; voice leading decides which note of each chord sits where.\n- **Writing bass lines:** a stepwise bass moving in contrary motion to the melody is a hallmark of strong writing.\n\n## Check yourself\n\nVoice `C–Am–F–G` for four parts, keeping common tones and moving the rest by step. (One good answer keeps the shared `C` between `C` and `Am`, and the shared `A` between `Am` and `F`, so each change moves only one or two notes.) Small, smooth moves beat big jumps almost every time. Next, see cadences to hear where these resolving lines come to rest.",
    "details": {
      "form": "lesson",
      "related": [
        "omt-diatonic-chords",
        "omt-cadences",
        "omt-seventh-chords",
        "omt-secondary-dominants",
        "omt-triads-and-inversions"
      ],
      "embeds": [
        {
          "tool": "score",
          "title": "Contrary motion",
          "caption": "Top voice rises while the bass falls — the smoothest way between chords.",
          "tex": "\\title \"Contrary motion\" .\n:4 (c4 e3) (d4 d3) (e4 c3) (f4 b2) | (g4 a2) (a4 g2) (b4 f2) (c5 e2) |"
        }
      ]
    },
    "extraTags": [
      "cc-by-sa"
    ]
  },
  "satie-gnossienne-no1": {
    "bodyMdx": "## About this piece\nIf the *Gymnopédies* made Satie famous, the *Gnossiennes* show just how far ahead of his time he was. Composed around 1890, the first *Gnossienne* is one of his most beguiling creations. Satie invented the word \"Gnossienne\" himself — it may nod to the ancient Cretan palace of Knossos — for a set of pieces that ignore the ordinary rules of classical music. There are no bar lines and no time signature at all; instead, Satie scattered strange, poetic instructions through the score in French (\"very shiny,\" \"question yourself,\" \"wonder about yourself\"). The result is hypnotic, exotic, and a touch mysterious.\n\n## What to listen for\nA steady, swaying left-hand accompaniment holds everything together while the right hand winds a snake-charmer melody above it, full of decorative turns and unusual scale colours. The tune leans on modal and minor sounds rather than a bright major key, which gives it that faintly Middle-Eastern or Eastern-European flavour. Notice how the same melodic idea returns, slightly changed each time, like a thought you keep circling back to.\n\n## What you'll learn\nBecause there are no bar lines, you get to feel rhythm as flow rather than counting. This is a superb piece for developing rubato — the art of gently stretching and easing the tempo for expression — and for shaping an ornamented melodic line over a calm accompaniment.\n\n## How to practise\nStart by learning the repeating left-hand pattern until it is completely secure and quiet; it is your anchor. Then float the right hand on top, giving the little ornaments time to speak rather than rushing them. Read Satie's written directions and let them colour your mood. Keep the pedal light and change it with the harmony.\n\n## If you like this\nExplore Satie's *Gymnopédie No. 1* for a gentler cousin, or step into Debussy's *Première Arabesque* and *Clair de Lune* for related impressionist atmospheres.",
    "details": {
      "key": "F minor (modal)",
      "era": "Impressionist",
      "form": "Gnossienne (free-metered character piece)",
      "timeSignature": "None — no bar lines or time signature",
      "composer": "Erik Satie",
      "composerDates": "1866–1925",
      "composedYear": "1890",
      "related": [
        "satie-gymnopedie-no1",
        "debussy-clair-de-lune",
        "debussy-arabesque-no1"
      ]
    },
    "extraTags": [
      "public-domain",
      "advanced"
    ]
  },
  "satie-gymnopedie-no1": {
    "bodyMdx": "## About this piece\nErik Satie published his three *Gymnopédies* in 1888, and this first one has quietly become the most famous. Satie was a young, unconventional figure in Paris — years before Debussy and Ravel made \"impressionism\" a household word — and these pieces already sound like nobody else's. The odd title borrows an ancient Greek word for a festival dance, but don't picture anything energetic: the music barely moves, and that stillness is the whole point. It is spare, tender, and just a little melancholy, marked *lent et douloureux* (\"slow and sorrowful\"). Once you have heard it, you never forget it.\n\n## What to listen for\nThe magic is in the left hand. It keeps a gentle, rocking three-beat pattern — a low bass note, then a soft chord — while the right hand sings a long, unhurried melody above it. Listen to how the harmony drifts between two rich seventh chords rather than resolving in the usual way; that floating, unresolved colour is why the piece feels like a dream. Nothing is in a hurry, and every note is given room to breathe.\n\n## What you'll learn\nYou'll practise voicing a melody above a soft accompaniment, keeping a steady waltz-like pulse in one hand while shaping a singing line in the other. It's a wonderful study in playing slowly and musically — harder than it looks, because there is nowhere to hide.\n\n## How to practise\nKeep the left hand quiet and even; let the bass notes ring under the chords. Bring the right-hand melody out gently on top. Use the sustain pedal to blend each bar, changing it cleanly with the harmony so the sound never turns muddy. Above all, resist the urge to speed up — the beauty lives in patience and calm.\n\n## If you like this\nTry Satie's *Gnossienne No. 1* for more of his hypnotic, modal world, or Debussy's *Clair de Lune* for the fuller flowering of French impressionism.",
    "details": {
      "key": "D major",
      "era": "Impressionist",
      "form": "Gymnopédie (slow triple-time character piece)",
      "timeSignature": "3/4",
      "composer": "Erik Satie",
      "composerDates": "1866–1925",
      "composedYear": "1888",
      "related": [
        "satie-gnossienne-no1",
        "debussy-clair-de-lune",
        "debussy-arabesque-no1"
      ]
    },
    "extraTags": [
      "public-domain",
      "intermediate"
    ]
  },
  "scarborough-fair": {
    "bodyMdx": "## About this piece\n\"Scarborough Fair\" is a traditional Northern English ballad (Roud 12), related to the older Scottish \"The Elfin Knight\" (Child Ballad #2), which has been traced back to around 1670. It has **no single composer** — it circulated for centuries with many tunes and verses before settling into the version popularised in the 20th century (famously by Simon & Garfunkel). Its most distinctive feature is its **Dorian mode**, giving it that unmistakable haunting, ancient quality. The refrain \"parsley, sage, rosemary and thyme\" is its signature.\n\n## What to listen for\nThe Dorian sound — a minor scale with one brightened note (a raised sixth) — which makes the melody feel neither fully sad nor fully happy, but suspended in an old, mysterious place. The lilting triple time and the returning herb refrain give it a spellbound, incantatory feel.\n\n## What you'll learn\nPlaying in a **mode** rather than a standard major/minor key, fingerstyle melody-and-accompaniment, and shaping long, calm phrases. It's an excellent piece for hearing how a single altered note can transform a scale's character.\n\n## Chords, keys and approach\nOften played in **E Dorian** (chords like **Em – D – G – Em**, with the D and G giving the modal colour) or transposed to A minor / D Dorian to suit a voice. Best suited to gentle **fingerpicking** — a soft, rolling arpeggio under the melody — though a light arpeggiated strum works too. Keep it quiet and unhurried.\n\n## How to practise\nPlay the melody alone first and let the Dorian raised sixth register in your ear. Add a simple arpeggiated accompaniment beneath it. Keep the pulse steady and the touch soft. Resist \"fixing\" the modal notes — they define the song.\n\n## If you like this\nTry *Greensleeves*, another modal English tune, or *House of the Rising Sun*.",
    "details": {
      "key": "E Dorian (commonly played in A minor / D Dorian too)",
      "era": "Traditional",
      "form": "song (strophic ballad)",
      "timeSignature": "3/4",
      "composer": "Traditional (anonymous)",
      "composedYear": "traced to 17th c.; melody documented 19th c.",
      "related": [
        "greensleeves-trad",
        "house-of-the-rising-sun",
        "wildwood-flower",
        "frankie-and-johnny"
      ]
    },
    "extraTags": [
      "public-domain"
    ]
  },
  "schubert-ave-maria": {
    "bodyMdx": "## About this piece\nSchubert's \"Ave Maria\" is one of the most cherished melodies ever written, though its origins may surprise you. Composed in 1825, it is really \"Ellens dritter Gesang\" (Ellen's Third Song), D. 839 — a setting of words from Sir Walter Scott's poem *The Lady of the Lake*, in which the young heroine Ellen sings a prayer to the Virgin Mary. Only later did the familiar Latin \"Ave Maria\" text get fitted to Schubert's tune, and the association stuck so firmly that the song is now sung at weddings and services the world over. Schubert wrote more than 600 songs in his short life; this is among the most beloved of them all. Here it is arranged for solo piano.\n\n## What to listen for\nAbove all, listen for the serene, arching vocal melody, now sung by the pianist's hands instead of a voice. Underneath it flows a steady, rocking accompaniment of gently repeated chords that creates a calm, prayerful atmosphere. Notice how the melody rises to tender high points and then settles again — Schubert's gift for pure, singing melody is on full display.\n\n## What you'll learn\nThis is a lovely study in \"singing\" at the piano: bringing out a smooth melodic line over a soft, flowing accompaniment. You'll practise balancing the hands so the tune stands out, keeping a steady pulse in the accompaniment, and using the pedal to warm the sound.\n\n## How to practise\nLearn the accompaniment first and keep it quiet and even — it should support, never compete. Then shape the melody on top, phrasing it as a singer would breathe. Change the pedal cleanly with each harmony so the chords stay clear. Take it slowly and expressively; the beauty is in the calm, unhurried flow.\n\n## If you like this\nTry the gentle simplicity of Beethoven's *Ode to Joy*, or move toward the impressionists with Satie's *Gymnopédie No. 1* and Debussy's *Clair de Lune*.",
    "details": {
      "key": "B-flat major (original song key; piano arrangements vary)",
      "era": "Romantic",
      "form": "Song (Lied) arranged for solo piano — strophic",
      "timeSignature": "4/4 (common time)",
      "composer": "Franz Schubert",
      "composerDates": "1797–1828",
      "composedYear": "1825",
      "related": [
        "beethoven-ode-to-joy",
        "satie-gymnopedie-no1",
        "debussy-clair-de-lune"
      ]
    },
    "extraTags": [
      "public-domain",
      "intermediate"
    ]
  },
  "schubert-landler-d366": {
    "bodyMdx": "## About this piece\nFranz Schubert wrote hundreds of short dances for piano — Ländler, waltzes, German dances, écossaises — the kind of music that filled Viennese homes and evenings among friends (the famous \"Schubertiades\"). D. 366 is a set of seventeen Ländler, and this brief B-flat major dance is a friendly first taste of them. The Ländler is a slow Austrian country dance in triple time, the rustic ancestor of the waltz. These pieces were never meant to be grand; they are warm, tuneful, and utterly charming — Schubert at his most companionable. (Individual dances in the set carry different keys; this one is in B-flat major.)\n\n## What to listen for\nListen for the easy lilt of 3/4 at a relaxed, dancing tempo — heavier on beat one, lighter after. The B-flat major key gives it a gentle, sunny glow. The shape is tiny and clear: short repeated strains, a melody in the right hand over a simple bass-and-chords accompaniment. There's a homely, slightly nostalgic sweetness to it that is pure Schubert.\n\n## What you'll learn\nThis little dance builds a secure triple-time feel, the basic waltz/Ländler left-hand pattern, tidy phrasing of short strains, and a light, singing right-hand touch. It's an ideal, low-pressure introduction to Romantic-era style.\n\n## How to practise\nFeel the dance in one pulse per bar rather than counting three stiffly — a gentle lean on beat one keeps it lilting. Keep the left hand soft and springy so the tune stays on top. Because the strains repeat, use the repeats to add a little dynamic contrast (say it once plainly, once more warmly). Learn hands separately, then join slowly; there's very little here to trip you, so aim for musical grace rather than mere accuracy.\n\n## If you like this\nIt pairs naturally with Chopin's *Waltz in A minor* (the dance grown up) and Schumann's gentle *Melody, Op. 68 No. 1*. Mozart's *Minuet in F* is another courtly-dance cousin.",
    "details": {
      "key": "B-flat major",
      "era": "Romantic",
      "form": "Ländler (Austrian folk dance, from a set of 17)",
      "timeSignature": "3/4",
      "composer": "Franz Schubert",
      "composerDates": "1797–1828",
      "composedYear": "c. 1816–1824",
      "related": [
        "chopin-waltz-a-minor-b150",
        "schumann-melody-op68-no1",
        "mozart-minuet-in-f-k2"
      ]
    },
    "extraTags": [
      "public-domain",
      "beginner"
    ]
  },
  "schumann-melody-op68-no1": {
    "bodyMdx": "## About this piece\nIn 1848 Robert Schumann wrote his *Album for the Young* (*Album für die Jugend*, Op. 68), a collection of 43 short pieces, partly as a birthday gift for his eldest daughter. He arranged them roughly from easiest to hardest, and *Melodie* (Melody) opens the whole album — the gentlest possible welcome. It's a small, tender piece, but written by a great composer with real care, so it teaches good habits from the very first note. Generations of beginners have started their Romantic-era journey right here.\n\n## What to listen for\nJust what the title promises: a simple, flowing melody in warm C major, in an unhurried 4/4. The right hand carries the tune while the left hand supplies quiet, supportive harmony, often in flowing lines of its own. The form is short and symmetrical, built from balanced phrases that answer one another. There's nothing flashy — the beauty is in the calm, singing line and its gentle rise and fall.\n\n## What you'll learn\nThis piece develops a legato singing tone, balance between a melody and a soft accompaniment, and clear phrasing — hearing where a musical sentence begins, peaks, and ends. It's also excellent gentle sight-reading practice in an easy key.\n\n## How to practise\nPlay the right-hand melody on its own first and shape it like a sung line, breathing at the phrase ends. Then bring in the left hand softly so it never competes. Aim for smooth, connected legato — join each note to the next with the fingers, keeping the hand relaxed. Keep a steady, easy tempo; this is not a piece to rush. Listen constantly to your tone, since evenness and warmth are the whole goal here.\n\n## If you like this\nExplore more of the *Album for the Young* — the lively *Wild Horseman* is a favourite next step. Burgmüller's *La Candeur* offers the same gentle, singing character, and Schubert's *Ländler* is a friendly dance in a similar spirit.",
    "details": {
      "key": "C major",
      "era": "Romantic",
      "form": "Character piece (from Album for the Young)",
      "timeSignature": "4/4",
      "composer": "Robert Schumann",
      "composerDates": "1810–1856",
      "composedYear": "1848",
      "related": [
        "schumann-the-wild-horseman-op68",
        "schubert-landler-d366",
        "burgmuller-la-candeur-op100-no1"
      ]
    },
    "extraTags": [
      "public-domain",
      "beginner"
    ]
  },
  "schumann-the-wild-horseman-op68": {
    "bodyMdx": "## About this piece\n*The Wild Horseman* (*Wilder Reiter*) is No. 8 from Schumann's 1848 *Album for the Young*, and it's a perennial favourite because it does exactly what it says: it gallops. Where the album's opening *Melody* was calm and singing, this one is all energy and mischief — a picture in sound of a young rider tearing across the countryside. It's short, exciting, and hugely rewarding for a beginner, giving a real sense of drama with modest technical means.\n\n## What to listen for\nThe galloping feel comes from its bouncy 6/8 metre and crisp, detached (staccato) chords tossed between the hands. It's in A minor and built as a neat ternary form (ABA): a boisterous outer section in the minor, a brighter middle section that leaps into the major with the theme handed to the left hand, then the wild opening returns. Listen for the hands \"passing the horse\" back and forth and for the sudden dynamic surprises.\n\n## What you'll learn\nThis piece teaches crisp staccato touch, quick and accurate hand-to-hand coordination, a strong sense of the 6/8 gallop rhythm, and playful dynamic contrast (loud outbursts against quieter moments). It's a great confidence-builder in rhythmic drive.\n\n## How to practise\nKeep the chords light and bouncy — staccato comes from a quick release, not a hard press. Practise the hand-swapping slowly so each chord lands cleanly on the beat before you speed up. Feel the 6/8 in two big pulses per bar to get the gallop, not six stiff beats. Bring out the dynamic contrasts boldly; the drama is half the fun. Learn the three sections separately, noting how the middle jumps to major, then assemble. Only chase the exciting tempo once it's rock-solid slow.\n\n## If you like this\nStay in the *Album for the Young* with the gentle *Melody, Op. 68 No. 1* for contrast. For more sparkling energy, Burgmüller's *Arabesque* is a perfect next challenge; Schubert's *Ländler* keeps the dance feeling.",
    "details": {
      "key": "A minor",
      "era": "Romantic",
      "form": "Character piece, ternary (ABA)",
      "timeSignature": "6/8",
      "composer": "Robert Schumann",
      "composerDates": "1810–1856",
      "composedYear": "1848",
      "related": [
        "schumann-melody-op68-no1",
        "burgmuller-arabesque-op100-no2",
        "schubert-landler-d366"
      ]
    },
    "extraTags": [
      "public-domain",
      "beginner"
    ]
  },
  "scott-frog-legs-rag": {
    "bodyMdx": "## About this piece\n\"Frog Legs Rag\" (1906) was James Scott's breakthrough. Scott was, along with Joplin and Joseph Lamb, one of the three great masters of \"classic\" ragtime, and this was his first big success — published by John Stark, Joplin's own publisher, it reportedly sold better than any Stark rag except the *Maple Leaf* itself. Scott had a brilliant, cascading style all his own, and this piece shows it off: bright, busy, and dazzling, full of tumbling right-hand runs.\n\n## What to listen for\nWhere Joplin often strides with dignity, Scott sparkles and cascades. Listen for the busy, rippling right-hand figures that pour downward like a waterfall, over a steady \"oom-pah\" left hand. The piece moves through several contrasting strains in the classic ragtime march form, each with its own bright idea, and the whole thing glitters in the warm key of D-flat major.\n\n## What you'll learn\nThis is an advanced study in right-hand agility and evenness — those cascading runs demand clean, quick fingers — combined with the ragtime staple of keeping a rock-steady left hand underneath. It's a real test of coordination and control.\n\n## How to practise\nTake the fast right-hand passages slowly and evenly, building speed only once every note is clean; a metronome helps enormously. Keep the left-hand accompaniment quiet and mechanical so the sparkling right hand can shine. Learn one strain at a time. And even though the notes tumble, hold to Joplin's ragtime creed — never play it fast; a controlled, moderate tempo keeps every note clear.\n\n## If you like this\nHear the other classic-rag masters: Joplin's *Maple Leaf Rag* and *The Entertainer*, and Joseph Lamb's richly harmonised *American Beauty Rag*.",
    "details": {
      "key": "D-flat major",
      "era": "Ragtime",
      "form": "Classic rag (multi-strain march form)",
      "timeSignature": "2/4",
      "composer": "James Scott",
      "composerDates": "1885–1938",
      "composedYear": "1906",
      "related": [
        "joplin-maple-leaf-rag",
        "lamb-american-beauty-rag",
        "joplin-the-entertainer"
      ]
    },
    "extraTags": [
      "public-domain",
      "advanced"
    ]
  },
  "shenandoah": {
    "bodyMdx": "## About this song\n\"Shenandoah\" (also known as \"Oh Shenandoah\") is a traditional American folk song dating to the early 19th century. Like most folk songs its exact origin can't be pinned down, but it is widely believed to have grown among American and Canadian voyageurs and fur traders paddling down the Missouri River, and versions were also sung by flatboatmen on the great rivers. By the mid-1800s it had been taken up as a sea shanty — a work song used to coordinate hauling the anchor or ropes — and carried around the world by sailors. Its meaning is as fluid as its history: some hear a longing for the Shenandoah River and valley, while a widely-told version tells of a river trader courting Sally, the daughter of an Oswego chief named Shenandoah. Whatever the reading, its mood is one of distance, farewell, and yearning for home.\n\n## What to listen for\n\"Shenandoah\" is prized for its broad, gently rolling melodic line. Sung in a relaxed 4/4, its long phrases swell and fall like the river it evokes, with wide, singable leaps that reward a legato, connected touch. The harmony is warm and diatonic; in D major it moves comfortably through the primary chords with the occasional gentle turn to a minor or a IV chord for colour.\n\n## What you'll learn\nThis is a wonderful study in legato phrasing and expressive shaping. You will practise carrying a melody smoothly across bar lines, controlling dynamics to follow the natural rise and fall of each line, and pacing a slow tune without letting it drag.\n\n## How to play it\nIn D major, lean on D, G, A (add A7) with an optional Bm or Em for warmth; the song also sits well in F for singers. Pianists can voice the melody over sustained or slowly-arpeggiated chords, using the sustain pedal to blend. Guitarists suit it to fingerpicking or slow strums; take it broadly, breathe between phrases, and let each long note bloom before moving on.\n\n## If you like this",
    "details": {
      "key": "D major",
      "era": "Folk",
      "form": "Strophic (verse)",
      "timeSignature": "4/4",
      "composer": "Traditional (American)",
      "composedYear": "early 19th century",
      "related": [
        "amazing-grace-trad",
        "simple-gifts",
        "swing-low-sweet-chariot"
      ]
    },
    "extraTags": [
      "public-domain",
      "beginner",
      "folk",
      "americana"
    ]
  },
  "simple-gifts": {
    "bodyMdx": "## About this song\n\"Simple Gifts\" is a Shaker song written in 1848 by Elder Joseph Brackett (1797–1882) of the Shaker community at Alfred, Maine. Contrary to how it is often sung today, Brackett wrote it not as a slow hymn but as a lively **dancing song** for worship — the Shakers danced as part of their devotion, and the words describe the very movements: \"to bow and to bend we shan't be ashamed, to turn, turn will be our delight.\" The song was little known outside Shaker circles until Aaron Copland borrowed its melody for his 1944 ballet score *Appalachian Spring* (and again in his *Old American Songs*), which made the tune famous worldwide. The English songwriter Sydney Carter later adapted it for the 1963 hymn \"Lord of the Dance.\"\n\n## What to listen for\nThe melody is clean, bright, and eminently singable, moving mostly by step within a major scale. It falls into a short verse (\"'Tis the gift to be simple...\") answered by a contrasting \"turning\" section (\"When true simplicity is gained...\") that lifts higher before coming home — a simple AABA-like arch. Traditionally it dances along in a brisk 2/4; the harmony is diatonic and rests on the primary chords.\n\n## What you'll learn\nThis is a fine study in clarity and rhythmic lift. You will practise a crisp, dancing pulse, phrasing a tune in two contrasting halves, and keeping a light, buoyant touch rather than a heavy one — remembering it was written to move to.\n\n## How to play it\nIn F major, lean on F, B-flat, and C7; it sits equally well in G or A for singers and works beautifully on ukulele. Keep the tempo lively and the articulation light and detached rather than legato, to honour its origins as a dance. Pianists can add a simple left-hand oom-pah; ukulele and guitar players can strum a bright, even 2/4.\n\n## If you like this",
    "details": {
      "key": "F major",
      "era": "Traditional",
      "form": "Strophic with a contrasting 'turning' section (AABA-like)",
      "timeSignature": "2/4",
      "composer": "Joseph Brackett (Shaker elder)",
      "composerDates": "Joseph Brackett 1797–1882",
      "composedYear": "1848",
      "related": [
        "amazing-grace-trad",
        "shenandoah",
        "when-the-saints-go-marching-in"
      ]
    },
    "extraTags": [
      "public-domain",
      "beginner",
      "shaker",
      "folk",
      "americana"
    ]
  },
  "sor-study-op35-no22": {
    "bodyMdx": "## About this piece\nThis is one of the most loved pieces Fernando Sor (1778–1839) ever wrote — a lyrical study in B minor from his Op. 35 set. It is far better known by the number Andrés Segovia gave it: **Study No. 5** in his 1945 anthology *Twenty Studies for the Guitar*. Segovia's edition made a handful of Sor's studies household names among guitarists, and this melancholy, song-like piece is the crown of that collection. Despite its emotional depth it stays technically within reach of a committed intermediate player.\n\n## What to listen for\nA clear melody floating on top of a rolling arpeggio accompaniment — the hallmark of the Romantic-era \"singing study.\" The music is in rounded binary form and, unusually for a minor-key piece, never really escapes the pull of home; the tonic B minor keeps drawing it back, which is part of its wistful character.\n\n## What you'll learn\nVoicing a melody above a moving accompaniment (bringing out the top notes with the **a** or **m** finger while **p–i–m** keep the arpeggio soft), plus barre chords — mainly F# and Bm shapes — held smoothly while the right hand keeps flowing. It's an excellent study in tone control and legato phrasing.\n\n## How to practise\nLearn the left-hand shapes first, silently, so barre changes feel secure before you add speed. Practise the melody notes alone to hear the tune, then re-introduce the accompaniment beneath it, kept deliberately quieter. Watch that your barre stays firm enough to avoid buzzes but relaxed enough to survive the whole piece without fatigue.\n\n## If you like this\nExplore more Segovia-edition Sor studies, Tárrega's *Lágrima*, or Carcassi's Op. 60 No. 7 in A minor.",
    "details": {
      "key": "B minor",
      "era": "Classical",
      "form": "study/étude (arpeggio study, rounded binary form)",
      "timeSignature": "3/4",
      "composer": "Fernando Sor",
      "composerDates": "1778–1839",
      "composedYear": "c. 1828",
      "related": [
        "sor-study-op60-no1",
        "tarrega-lagrima",
        "carcassi-study-op60-no7",
        "tarrega-adelita"
      ]
    },
    "extraTags": [
      "public-domain",
      "intermediate"
    ]
  },
  "sor-study-op60-no1": {
    "bodyMdx": "## About this piece\nFernando Sor (1778–1839) was a Spanish guitarist-composer whose studies remain the backbone of classical-guitar teaching almost two centuries after they were written. This piece opens his *Introduction à l'étude de la guitare*, Op. 60 — published in Paris around 1836–37 with the full title \"Introduction to the study of the guitar in 25 progressive lessons.\" As the very first lesson, No. 1 in C major is deliberately gentle: it sits in first position, uses open strings freely, and asks nothing that a careful beginner can't manage after a few weeks with the instrument. Sor's genius was that even his simplest exercises sound like real music, not finger drills.\n\n## What to listen for\nA clear, singing top-line melody carried over quiet, supporting lower notes. The key of C major keeps the mood bright and open. Listen for the sense of phrases that breathe — small musical sentences that rise and settle, much like speaking a line and pausing.\n\n## What you'll learn\nFoundational right-hand alternation (typically **i–m** free strokes) and simple two-voice playing, where the thumb (**p**) handles bass notes while the fingers voice the melody. You'll practise keeping a steady pulse, reading in first position, and letting notes ring cleanly without buzzing.\n\n## How to practise\nBegin very slowly and count aloud. Name each note as you read it — this doubles as sight-reading practice. Keep your left-hand fingers close to the strings and press just behind the frets. Aim for an even tone between thumb and fingers so no voice overpowers the other. Once secure, add gentle dynamic shaping to bring the melody forward.\n\n## If you like this\nMove on to other lessons in Op. 60, then Carcassi's Op. 60 No. 1 for a first taste of continuous arpeggios, or Sor's celebrated Op. 35 No. 22 as an intermediate goal.",
    "details": {
      "key": "C major",
      "era": "Classical",
      "form": "study/étude (progressive lesson)",
      "timeSignature": "4/4",
      "composer": "Fernando Sor",
      "composerDates": "1778–1839",
      "composedYear": "c. 1836–37",
      "related": [
        "sor-study-op35-no22",
        "carcassi-guitar-study-op60-no1",
        "carulli-guitar-study",
        "carulli-andante-op241"
      ]
    },
    "extraTags": [
      "public-domain",
      "beginner"
    ]
  },
  "swing-low-sweet-chariot": {
    "bodyMdx": "## About this song\n\"Swing Low, Sweet Chariot\" is an African-American spiritual, one of the most cherished in the tradition. It is generally attributed to Wallace Willis and his daughter Minerva Willis — Choctaw Freedmen — who are thought to have composed it in the late 1860s in Indian Territory (present-day Oklahoma). Wallace Willis, formerly enslaved, is said to have been moved by the sight of the Red River, which recalled the Jordan and the story of the prophet Elijah carried to heaven in a chariot. A minister, Alexander Reid, heard the Willises singing and transcribed the words and melody, sending them to the Fisk Jubilee Singers, whose late-19th-century tours carried the spiritual to audiences worldwide. Like many spirituals, its imagery of deliverance (\"coming for to carry me home\") has been understood to hold coded meanings of hope and freedom for enslaved people. It deserves to be sung with respect for that history.\n\n## What to listen for\nThe song is built on call-and-response: a leader sings a line and the group answers, a hallmark of the spiritual tradition. The melody is largely pentatonic and easy to sing, sitting in a warm 4/4 that can be taken slowly and soulfully or with a gentle swing. The harmony is simple and rooted; in G major it rests mostly on I, IV, and V.\n\n## What you'll learn\nYou will explore call-and-response phrasing, a relaxed feel for the beat, and the expressive weight that makes a spiritual land. It is also an easy, satisfying song for coordinating a slow, steady accompaniment beneath a singable tune.\n\n## How to play it\nIn G major, use G, C, D (and D7); a C-major setting (C, F, G7) suits many singers too. Pianists can play warm block chords or a rocking left hand under the melody; guitarists can strum gently or fingerpick. Let the \"swing low\" refrain settle deeply, and keep space in the phrasing so the call and the answer each breathe.\n\n<div data-tmr-embed=\"0\"></div>\n\n## If you like this",
    "details": {
      "key": "G major",
      "era": "Spiritual",
      "form": "Verse / refrain (call-and-response)",
      "timeSignature": "4/4",
      "composer": "Traditional (African-American spiritual); attributed to Wallace & Minerva Willis",
      "composedYear": "c. late 1860s",
      "related": [
        "when-the-saints-go-marching-in",
        "amazing-grace-trad",
        "shenandoah"
      ],
      "embeds": [
        {
          "tool": "progression",
          "title": "The call-and-response chords",
          "caption": "A I–IV–V in G under the spiritual's call and response. Play it through to feel the shape.",
          "key": "G",
          "chords": [
            "G",
            "C",
            "G",
            "D7",
            "G"
          ]
        }
      ]
    },
    "extraTags": [
      "public-domain",
      "beginner",
      "spiritual",
      "gospel"
    ]
  },
  "tarrega-adelita": {
    "bodyMdx": "## About this piece\n*Adelita* is a short mazurka by Francisco Tárrega (1852–1909), one of a handful of intimate salon miniatures he wrote that have become cornerstones of the guitar repertoire alongside *Lágrima* and *Recuerdos de la Alhambra*. A mazurka is a Polish dance in triple time, and Tárrega uses its lilting rhythm to frame a wistful, elegant little character piece. It's compact but demands genuine musical maturity to shape well.\n\n## What to listen for\nThe mazurka's characteristic 3/4 swing, often with a gentle emphasis on the second or third beat rather than the first — this \"leaning\" feel is what makes it dance. The opening section is in E minor, brooding and expressive; a contrasting middle section brightens to E major before the minor mood returns. Rubato and dynamic shading are central to its charm.\n\n## What you'll learn\nExpressive rubato and phrasing over a dance rhythm, dynamic shaping (crescendo and diminuendo within short phrases), and controlled melody-over-accompaniment texture. You'll also refine tone colour — Tárrega's music rewards playing near the bridge or over the fingerboard to change the mood.\n\n## How to practise\nEstablish the mazurka pulse first by tapping or counting \"ONE-two-three\" with the lean on the right beat, so the rhythm dances rather than marches. Learn the notes securely before adding rubato — expressive timing only works from a solid foundation. Contrast the two sections deliberately in colour and dynamics. Record yourself to check that your phrases truly breathe.\n\n## If you like this\nPair it with Tárrega's *Lágrima*, then work toward *Recuerdos de la Alhambra* for tremolo.",
    "details": {
      "key": "E minor (B section in E major)",
      "era": "Romantic",
      "form": "mazurka (miniature, ternary A–B–A)",
      "timeSignature": "3/4",
      "composer": "Francisco Tárrega",
      "composerDates": "1852–1909",
      "composedYear": "late 19th c.",
      "related": [
        "tarrega-lagrima",
        "tarrega-recuerdos-de-la-alhambra",
        "sor-study-op35-no22",
        "carcassi-study-op60-no7"
      ]
    },
    "extraTags": [
      "public-domain",
      "intermediate"
    ]
  },
  "tarrega-lagrima": {
    "bodyMdx": "## About this piece\n*Lágrima* — Spanish for \"teardrop\" — is one of the best-loved short pieces by Francisco Tárrega (1852–1909), often called \"the father of the modern classical guitar.\" In under two minutes it captures a complete emotional arc, which is why it's a rite of passage for guitarists stepping into the Romantic repertoire. It's brief, deeply expressive, and technically approachable, making it a perfect first \"real\" recital piece.\n\n## What to listen for\nA tender opening melody in E major, warm and consoling, followed by a middle section that turns to the parallel key of E minor — the same home note, but suddenly clouded and grieving. Then the bright opening returns. That shift from major to minor and back is the whole story of the piece: a smile, a tear, and a smile again.\n\n## What you'll learn\nSinging melody notes over sustained lower voices, smooth position shifts up the neck, and expressive tone control. You'll work on rest strokes (*apoyando*) to make the melody sing out, subtle rubato (gentle push-and-pull of tempo), and clean legato so the phrases feel unbroken.\n\n## How to practise\nLearn the two sections separately — they have different characters. Play the melody alone first to internalise its shape, then add the accompaniment softly. Take the position shifts slowly, moving with a light, guided left hand so you land accurately without a scrape. Once secure, add expressive timing: let phrase-ends relax rather than click along mechanically.\n\n## If you like this\nContinue with Tárrega's *Adelita*, then set your sights on his tremolo masterpiece *Recuerdos de la Alhambra*.",
    "details": {
      "key": "E major (B section in E minor)",
      "era": "Romantic",
      "form": "prelude (miniature, ternary A–B–A)",
      "timeSignature": "2/4",
      "composer": "Francisco Tárrega",
      "composerDates": "1852–1909",
      "composedYear": "late 19th c.",
      "related": [
        "tarrega-adelita",
        "tarrega-recuerdos-de-la-alhambra",
        "sor-study-op35-no22",
        "carcassi-study-op60-no7"
      ]
    },
    "extraTags": [
      "public-domain",
      "intermediate"
    ]
  },
  "tarrega-recuerdos-de-la-alhambra": {
    "bodyMdx": "## About this piece\n*Recuerdos de la Alhambra* (\"Memories of the Alhambra\") is the most famous tremolo piece ever written for guitar, composed by Francisco Tárrega (1852–1909) in Málaga around 1899 and named for the Moorish palace in Granada. Its rapid repeated melody notes create the illusion of a sustained singing line shimmering above a flowing bass — an effect that sounds like far more than one instrument. It is a genuine advanced piece and a lifelong technical goal for many guitarists.\n\n## What to listen for\nA continuous, glimmering top melody that seems to hang in the air, supported by a rolling arpeggiated bass. The A section is in A minor, dark and yearning; the B section moves to the radiant relative-major key of A major before the minor returns. The magic is that the melody never seems to stop, even though it's actually a fast repetition of single notes.\n\n## What you'll learn\n**Tremolo technique** — the signature right-hand pattern **p–a–m–i**, where the thumb plays the bass and the ring, middle, and index fingers rapidly repeat a melody note. This is one of the guitar's hardest skills: it demands perfect evenness, independence between thumb and fingers, and stamina.\n\n## How to practise\nPractise tremolo slowly and evenly long before attempting speed — an uneven fast tremolo is worse than a slow clean one. Use a metronome and focus on four perfectly equal notes per beat. Keep the thumb's bass line calm and independent. Isolate difficult bars and the section shifts. Build tempo gradually over weeks; patience here is everything.\n\n## If you like this\nBuild up through Tárrega's *Lágrima* and *Adelita* first, and explore other tremolo works once the technique is secure.",
    "details": {
      "key": "A minor (B section in A major)",
      "era": "Romantic",
      "form": "tremolo study (ternary A–B–A)",
      "timeSignature": "3/4",
      "composer": "Francisco Tárrega",
      "composerDates": "1852–1909",
      "composedYear": "1899",
      "related": [
        "tarrega-lagrima",
        "tarrega-adelita",
        "sor-study-op35-no22",
        "carcassi-study-op60-no7"
      ]
    },
    "extraTags": [
      "public-domain",
      "advanced"
    ]
  },
  "ukulele-fingerpicking-primer": {
    "bodyMdx": "## From strumming to picking\n\n**Fingerpicking** (or fingerstyle) means plucking strings individually instead of strumming them all at once. It turns a chord into a flowing, arpeggiated texture — perfect for ballads and instrumentals. This primer assumes you can hold basic chords and are in standard `g–C–E–A` tuning.\n\n## The picking hand\n\nAssign one finger per string. Rest your picking hand lightly and let each finger \"own\" a string:\n\n| String | Finger | Symbol |\n| --- | --- | --- |\n| g | thumb | p |\n| C | index | i |\n| E | middle | m |\n| A | ring | a |\n\n(`p`, `i`, `m`, `a` are the classical-guitar symbols for thumb, index, middle, and ring.)\n\n- **Thumb (p)** plucks the top `g` string with a downward motion.\n- **Index (i), middle (m), ring (a)** pluck the `C`, `E`, and `A` strings with a slight upward curl.\n\nKeep the hand relaxed and let the fingers move from the knuckle, not the whole arm. Aim for an even, warm tone — pluck, don't yank.\n\n## Pattern 1: straight roll\n\nPluck the strings one after another, low to high, as an arpeggio. Hold a **C chord** (`0 0 0 3`) and play:\n\n| Count | 1 | 2 | 3 | 4 |\n| --- | --- | --- | --- | --- |\n| String | g | C | E | A |\n| Finger | p | i | m | a |\n\nEach note rings into the next, outlining the chord. Practise slowly and evenly with a [metronome](/tools/metronome).\n\n## Pattern 2: roll up and back\n\nA fuller, four-note-plus pattern that goes up then partway back down — eight notes over the bar:\n\n| Count | 1 | & | 2 | & | 3 | & | 4 | & |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- |\n| String | g | C | E | A | E | C | E | A |\n| Finger | p | i | m | a | m | i | m | a |\n\nThis \"wave\" shape is the backbone of gentle fingerstyle accompaniment.\n\n## Pattern 3: pinch and alternate\n\nPlay the thumb and a finger **together** (a \"pinch\") on beat 1, then fill in:\n\n| Beat | String(s) | Finger(s) |\n| --- | --- | --- |\n| 1 | g + A (pinch together) | p + a |\n| 2 | E | m |\n| 3 | C | i |\n| 4 | E | m |\n\nThe simultaneous bass-and-melody pinch gives the illusion of two players at once — the foundation of melodic fingerstyle.\n\n## Making it musical\n\n- **Let notes ring:** keep the fretting hand holding the full chord so plucked notes sustain into a harmony.\n- **Bring out the top:** the `A`-string note (ring finger) often carries the melody — pluck it slightly louder.\n- **Anchor lightly:** some players rest a pinky near the soundhole for stability, but don't press down or tense up.\n- **Stay steady:** fingerpicking exposes timing. A rock-solid thumb pulse holds everything together.\n\n## Combining with chords\n\nThe real payoff comes from changing chords *while* keeping the pattern going. Loop `| C | Am | F | G |`, one bar each, and play Pattern 1 through every chord. The picking hand keeps doing the same `p-i-m-a` roll; only the fretting hand changes shape. Because the pattern is chord-shape-agnostic, you can apply it to any progression you already know. Tap the interactive chord diagrams below to hear each grip you'll pick over.\n\n<div data-tmr-embed=\"0\"></div>\n\n## Try it\n\nHold a C chord and play Pattern 1 (`p-i-m-a`) slowly at 60 BPM on a [metronome](/tools/metronome) until each note is clean and even. Then loop `| C | Am | F | G |` and keep the roll going through the changes, letting every note ring. Check each grip you'll pick over against the interactive chord diagrams above. When comfortable, try Pattern 3's pinch to start shaping a melody. Revisit the first-four-chords lesson for the shapes and the strumming lesson for rhythmic variety.",
    "details": {
      "form": "lesson",
      "timeSignature": "4/4",
      "related": [
        "ukulele-first-four-chords",
        "ukulele-strumming-patterns",
        "omt-rhythm-and-meter"
      ],
      "embeds": [
        {
          "tool": "chord-diagrams",
          "title": "The chords to pick",
          "instrument": "ukulele",
          "chords": [
            "C",
            "Am",
            "F",
            "G"
          ]
        }
      ]
    },
    "extraTags": [
      "intermediate",
      "technique",
      "arpeggios"
    ]
  },
  "ukulele-first-four-chords": {
    "bodyMdx": "## Four chords, dozens of songs\n\nThe ukulele is the friendliest fretted instrument to start on, and just four chords — **C, G, Am, and F** — unlock an enormous number of songs. Together they form a `I – V – vi – IV` progression in the key of C, the pattern behind countless pop hits. This lesson assumes **standard tuning**, `g–C–E–A` (the top `g` is a high \"re-entrant\" string).\n\n## Reading a chord diagram\n\nA ukulele has four strings, in order `g C E A` (the top `g` is a high, \"re-entrant\" string). In the interactive chord diagrams below, each shape shows those four strings: a dot marks a string you press, and an open (undotted) string rings freely. Tap any shape to hear it.\n\nKeep fingertips just behind the fret, press firmly, and arch your fingers so they don't mute neighbouring strings.\n\n## The four shapes\n\nTap any shape in the diagrams below to hear it, then copy the grip. Each chord adds a finger:\n\n- **C major** — the easiest chord on the instrument: ring finger on the A string, 3rd fret (one finger).\n- **A minor** — one finger: middle finger on the g string, 2nd fret.\n- **F major** — two fingers: index on the E string 1st fret, middle on the g string 2nd fret.\n- **G major** — three fingers forming a little triangle: index on C-2, middle on A-2, ring on E-3.\n\n<div data-tmr-embed=\"0\"></div>\n\n## Practise the changes, not just the chords\n\nHolding a chord is easy; *switching* is the real skill. Two friendly pairs to drill first:\n\n- **C ↔ Am:** only your fretting hand's position shifts — a great confidence builder.\n- **F ↔ C:** lift to one finger and back.\n\nThen tackle the harder move, **anything ↔ G**, since G uses three fingers. Practise each change slowly: strum the first chord, switch, strum the second, repeat. Speed comes from repetition, not force.\n\n## Your first progression\n\nPut them in this order and strum each chord four times (one bar of 4/4 each):\n\n| Bar 1 | Bar 2 | Bar 3 | Bar 4 |\n| --- | --- | --- | --- |\n| C | G | Am | F |\n\nThat `C – G – Am – F` loop is the \"four-chord song\" — try singing along to any pop tune over it. Reverse or reorder them (`Am – F – C – G`, `C – Am – F – G`) for different moods; the same four shapes cover them all.\n\n## Tips for clean chords\n\n- **Tune first, every time** — an out-of-tune uke makes correct fingering sound wrong. Aim for `g C E A`.\n- Press just hard enough to sound clear; if a string buzzes, move your finger closer to the fret.\n- Strum over the spot where the neck meets the body for a bright, even tone.\n\n## Try it\n\nSet a [metronome](/tools/metronome) to a slow 60 BPM and play `| C | G | Am | F |`, changing chords exactly on beat 1 of each bar. If a change is late, slow down until it lands on time. Once smooth, speed up gradually. Then move on to the ukulele-strumming-patterns lesson to add rhythm, and check your finger placement against the interactive chord diagrams above — tap any shape to hear it.",
    "details": {
      "key": "C",
      "form": "lesson",
      "timeSignature": "4/4",
      "related": [
        "ukulele-strumming-patterns",
        "ukulele-fingerpicking-primer",
        "omt-diatonic-chords"
      ],
      "embeds": [
        {
          "tool": "chord-diagrams",
          "title": "Your first four chords",
          "caption": "Tap a shape to hear it. C, G, Am, F — enough for hundreds of songs.",
          "instrument": "ukulele",
          "chords": [
            "C",
            "G",
            "Am",
            "F"
          ]
        }
      ]
    },
    "extraTags": [
      "beginner",
      "chords"
    ]
  },
  "ukulele-major-scale-shapes": {
    "bodyMdx": "## Goal\n\nMajor-scale shapes turn the ukulele fretboard from a mystery into a map. Learn one shape and you can\nplay a scale in any key just by sliding it — the same movable idea guitarists and bassists use. This\nbuilds finger accuracy, fretboard knowledge, and the melodic vocabulary behind riffs and solos.\n(Standard re-entrant tuning, strings 4→1: `G C E A`.)\n\n## How to do it\n\nStart with the **open-position C major scale** — the clearest one to hear and see. Strings numbered\n`4` (top `G`) to `1` (bottom `A`):\n\n| String | Notes (fret) |\n| --- | --- |\n| C string (3) | C (open), D (fr 2) |\n| E string (2) | E (open), F (fr 1), G (fr 3) |\n| A string (1) | A (open), B (fr 2), C (fr 3) |\n\nSo the scale runs `C D E F G A B C` across the bottom three strings. See it on the neck — tap a note to hear it:\n\n<div data-tmr-embed=\"0\"></div>\n\nSteps:\n\n1. **Play it up and down slowly,** one finger per fret, saying the note names.\n2. **Fret cleanly** just behind each fret so open and fretted notes ring equally.\n3. Loop it until the sound of the major scale is locked in your ear.\n\n**Making it movable (closed shape).** Replace the open strings with a fretted root so the shape can\nslide. A one-octave closed major shape with the root on the C string (string 3) at fret `n`:\n\n| String | Frets (scale degree) |\n| --- | --- |\n| C string (3) | n (deg 1), n+2 (deg 2), n+4 (deg 3) |\n| E string (2) | n+1 (deg 4), n+3 (deg 5) |\n| A string (1) | n (deg 6), n+2 (deg 7), n+3 (deg 8) |\n\nBecause there are no open strings, sliding the whole shape up two frets raises the whole scale a whole\nstep — move it and read off the new key. Practise to a click at ♩ = 60.\n\nPlay the C-major scale on the playable score below to hear the target sound as you learn the shapes.\n\n## Common mistakes\n\n- **Muting the next string** by letting a fretting finger lean flat — keep fingertips arched.\n- **Uneven volume between open and fretted notes** — press a touch firmer on fretted ones at first.\n- **Forgetting where the root is.** Always know which note is \"1\"; that is what makes the shape movable.\n\n## How to progress\n\nSlide the closed shape into different keys, add a second octave, and speed up on\n[/tools/metronome](/tools/metronome). Map the notes with the [Fretboard tool](/tools/fretboard), then\napply the scale melodically in [Aloha ʻOe](/aloha-oe-ukulele).",
    "details": {
      "key": "C major",
      "form": "exercise",
      "related": [
        "aloha-oe-ukulele",
        "major-scales-all-keys",
        "bass-major-scale-fingerings"
      ],
      "embeds": [
        {
          "tool": "fingering",
          "title": "C major on the ukulele",
          "caption": "The C major scale across the ukulele neck (g C E A), root C highlighted. Tap a note to hear it.",
          "instrument": "ukulele",
          "root": "C",
          "scale": "major"
        }
      ]
    },
    "extraTags": [
      "beginner",
      "exercise"
    ]
  },
  "ukulele-strumming-patterns": {
    "bodyMdx": "## Rhythm is what brings chords to life\n\nOnce you can hold a few ukulele chords, the **strumming hand** is what turns them into music. Good strumming is mostly about a relaxed, *constant* arm motion and knowing when to actually touch the strings. Throughout this lesson `↓` is a downstroke (strum toward the floor), `↑` is an upstroke (strum back up), and `·` is a rest where your hand keeps moving but misses the strings.\n\n## How to strum\n\nStrum with the pad of your index finger (nail-side going down, fleshy pad coming up) or a felt pick, over the spot where the neck meets the body. Keep your wrist loose — the motion comes from a gentle rotation of the forearm and wrist, not stiff fingers. Aim to brush all four strings evenly.\n\n## Pattern 1: all downstrokes\n\nStart dead simple — four downstrokes per bar of 4/4. Press play and strum with the head:\n\n<div data-tmr-embed=\"0\"></div>\n\n## Pattern 2: down-up eighths\n\nFill in the \"and\" between each beat with an upstroke. Your hand now moves down-up continuously:\n\n<div data-tmr-embed=\"1\"></div>\n\n## Pattern 3: the most common pop strum\n\nMiss a couple of strums to create a groove. The hand still moves down-up throughout, but you *skip* the strings on some motions — the famous **D–DU–UDU**:\n\n<div data-tmr-embed=\"2\"></div>\n\nThe secret is that your strumming hand never stops moving down-up — the skipped strums are just the hand passing *near* the strings without touching them.\n\n## Pattern 4: the island strum\n\nThe signature ukulele groove is the **same D–DU–UDU shape**, played through a chord progression. Emphasise beat 1 slightly for a lilt:\n\n<div data-tmr-embed=\"3\"></div>\n\n## Adding chunks (muting)\n\nFor a percussive feel, add a **chunk**: as your hand strums down, lightly slap the strings with the side or heel of your palm to deaden them, making a \"chuck\" sound on the backbeat (beats 2 and 4). This is what gives reggae and modern pop ukulele its bounce.\n\n## The chords to strum over\n\nCheck each grip before you strum over it — tap any shape to hear it.\n\n<div data-tmr-embed=\"4\"></div>\n\n## Practice strategy\n\n1. Pick **one** chord you already know and drill the pattern until it's automatic — don't fight the chord changes and the rhythm at once.\n2. Keep the strumming hand moving continuously; think of missed strums as the hand passing *near* the strings.\n3. Only then add chord changes, keeping the strum steady even if the chords lag at first.\n\n## Try it\n\nLoop `| C | G | Am | F |` and apply pattern 3 (**D–DU–UDU**) to each bar. Keep the arm swinging even during skipped strums, and when the groove feels natural add palm chunks on beats 2 and 4. Then explore the [fingerpicking primer](/catalogue/ukulele-fingerpicking-primer) for a gentler, melodic approach.",
    "details": {
      "form": "lesson",
      "timeSignature": "4/4",
      "related": [
        "ukulele-first-four-chords",
        "ukulele-fingerpicking-primer",
        "omt-rhythm-and-meter"
      ],
      "embeds": [
        {
          "tool": "strum",
          "title": "Four on the floor",
          "caption": "One downstroke per beat over a C chord. Build the steady pulse everything else sits on.",
          "instrument": "ukulele",
          "chords": [
            "C"
          ],
          "pattern": [
            "D",
            "-",
            "D",
            "-",
            "D",
            "-",
            "D",
            "-"
          ],
          "tempo": 80
        },
        {
          "tool": "strum",
          "title": "Down-up eighths",
          "caption": "Keep the hand pumping down-up like a metronome — that constant motion keeps your timing locked.",
          "instrument": "ukulele",
          "chords": [
            "C"
          ],
          "pattern": [
            "D",
            "U",
            "D",
            "U",
            "D",
            "U",
            "D",
            "U"
          ],
          "tempo": 80
        },
        {
          "tool": "strum",
          "title": "D–DU–UDU (the pop strum)",
          "caption": "Down, skip, down-up, skip-up, down-up. This one pattern fits a huge number of songs.",
          "instrument": "ukulele",
          "chords": [
            "C"
          ],
          "pattern": [
            "D",
            "-",
            "D",
            "U",
            "-",
            "U",
            "D",
            "U"
          ],
          "tempo": 80
        },
        {
          "tool": "strum",
          "title": "The island strum over a progression",
          "caption": "The pop pattern applied to C–G–Am–F, one chord per bar — the classic feel-good ukulele groove.",
          "instrument": "ukulele",
          "chords": [
            "C",
            "G",
            "Am",
            "F"
          ],
          "pattern": [
            "D",
            "-",
            "D",
            "U",
            "-",
            "U",
            "D",
            "U"
          ],
          "tempo": 80
        },
        {
          "tool": "chord-diagrams",
          "instrument": "ukulele",
          "chords": [
            "C",
            "G",
            "Am",
            "F"
          ]
        }
      ]
    },
    "extraTags": [
      "beginner",
      "rhythm",
      "technique"
    ]
  },
  "walking-bass-basics": {
    "bodyMdx": "## What \"walking\" means\n\nA **walking bass line** is a smooth, mostly stepwise line of steady quarter notes — one note per beat — that outlines the chords while keeping the swing feel moving forward. It's the heartbeat of jazz, and the same principles serve blues and swing. We'll build one over a **ii–V–I** in C major, the most important progression in jazz: `Dm7 – G7 – Cmaj7`. Standard bass tuning `E–A–D–G`.\n\n## The one unbreakable rule: root on beat 1\n\nWhatever else you do, **play the chord's root on beat 1** of each new chord. That single note tells the listener the harmony has changed. Everything between downbeats is your freedom to connect smoothly to the *next* root.\n\n| Beat | 1 | 2–3 | 4 | → next bar's beat 1 |\n| --- | --- | --- | --- | --- |\n| Note | **Root** (chord tone) | connecting tones | approach note | **Root** |\n\n## The four beats of a bar\n\nA reliable recipe for each bar:\n\n- **Beat 1** — the **root** (always).\n- **Beats 2 & 3** — other **chord tones** (3rd, 5th, 7th) or scale notes that move by step.\n- **Beat 4** — an **approach note** that leads by a half step or a step into the next bar's root.\n\nThat beat-4 approach is the glue. The strongest is a chromatic (half-step) approach from just above or below the target root.\n\n## A worked ii–V–I line\n\nOver `Dm7 – G7 – Cmaj7` (one chord per bar) in C, here is a line — spelled out beat by beat:\n\n- **Bar 1 (Dm7):** `D – A – F – A♭`. Root on beat 1, then chord tones (`A` the 5th, `F` the ♭3rd), then `A♭` on beat 4 — a chromatic half step **down** into the next root, `G`.\n- **Bar 2 (G7):** `G – B – D – D♭`. Root, then chord tones (`B` the 3rd, `D` the 5th), then `D♭` on beat 4 — a chromatic half step **down** into `C`.\n- **Bar 3 (Cmaj7):** lands on the root `C` on beat 1, resolving the line.\n\nThose beat-4 half-step approaches (`A♭→G`, `D♭→C`) are what make the line sound intentional and connected rather than random. Play and loop a full walking line on the interactive score below to hear the steady quarter-note motion.\n\n<div data-tmr-embed=\"0\"></div>\n\n## Techniques for smoothness\n\n- **Approach notes:** a half step above or below the next root is the most common and strongest connector; a scale step also works.\n- **Prefer steps over leaps.** A walking line should mostly *walk*, not jump. Occasional octave leaps add variety but shouldn't dominate.\n- **Use chord tones on strong beats (1 and 3),** passing/approach tones on weak beats (2 and 4).\n- **Keep it steady.** Even, swung quarter notes with consistent note length and volume are more important than fancy note choices.\n\n## Practice approach\n\n1. First play *only roots* on beat 1 of each chord through the progression — get the changes solid.\n2. Add the fifth on beat 3.\n3. Fill in beat 2 with a chord tone.\n4. Finally add a chromatic approach on beat 4. You've built a full walking line one layer at a time.\n\n## Try it\n\nLoop `Dm7 – G7 – Cmaj7 – Cmaj7`, one chord per bar, at 80 BPM on a [metronome](/tools/metronome) with a swing feel. Play only roots on beat 1 for four passes, then add the fifth, then a beat-4 chromatic approach into each next root. Keep the quarter notes dead steady. Hear the worked line on the interactive score above — hit play, or loop it to drill the beat-4 approaches — and review the seventh-chords lesson so you know which notes belong to each chord.",
    "details": {
      "key": "C",
      "form": "lesson",
      "timeSignature": "4/4",
      "related": [
        "bass-blues-line-basics",
        "bass-root-fifth-patterns",
        "omt-seventh-chords",
        "omt-diatonic-chords"
      ],
      "embeds": [
        {
          "tool": "score",
          "title": "A walking bass line",
          "caption": "Quarter-note walking bass over a ii–V–I. Play it and loop it.",
          "mode": "tab",
          "tuning": [
            28,
            33,
            38,
            43
          ],
          "tex": "\\tempo 90\n.\n\\track \"Bass\"\n  \\staff{tabs score} \\tuning (G2 D2 A1 E1)\n  :4 0.2 0.3 1.4 4.4 | 3.4 2.3 0.2 4.3 | 3.3 2.2 0.1 2.1 | 0.1 3.2 2.2 4.3 |"
        }
      ]
    },
    "extraTags": [
      "intermediate",
      "jazz",
      "improvisation"
    ]
  },
  "when-the-saints-go-marching-in": {
    "bodyMdx": "## About this song\n\"When the Saints Go Marching In\" began life as a Christian hymn and became a jazz anthem. Its precise origins are unclear; it appears to have evolved in the early 1900s out of several similarly-titled gospel songs, including \"When the Saints Are Marching In\" (1896) and \"When the Saints March In for Crowning\" (1908). The song is inseparable from New Orleans, where brass bands took it up in the tradition of the \"jazz funeral\" — played slowly and mournfully on the way to the cemetery, then joyfully on the way back. The first known recording dates to 1923 by the Paramount Jubilee Singers, and Louis Armstrong's exuberant 1938 recording made \"The Saints\" famous around the world. Today it is the unofficial anthem of New Orleans.\n\n## What to listen for\nThe tune could hardly be simpler or more infectious. It moves mostly by step within a bright major scale, set in a marching 4/4, with a verse-and-refrain shape that invites everyone to join in. The harmony leans on just I, IV, and V, which is exactly why it works as a first song and as a bandstand crowd-pleaser.\n\n## What you'll learn\nThis is a superb first tune for confidence and timing. You will practise a steady, marching pulse, changing between three chords in time, and — for singers and horn players alike — a melody easy enough to memorise fast, freeing you to focus on feel and swing.\n\n## How to play it\nIn C major the chords are C, F, and G7; it transposes easily to G (G, C, D7) or any comfortable key. Pianists can play a bouncy left-hand pattern under the melody; guitarists and ukulele players can strum a confident, even beat. Once it is under your fingers, try adding a light swing to the rhythm to capture its New Orleans spirit.\n\n<div data-tmr-embed=\"0\"></div>\n\n## If you like this",
    "details": {
      "key": "C major",
      "era": "Spiritual",
      "form": "Verse / refrain",
      "timeSignature": "4/4",
      "composer": "Traditional (African-American gospel / spiritual)",
      "composedYear": "evolved early 1900s (from earlier gospel songs, 1890s–1900s)",
      "related": [
        "swing-low-sweet-chariot",
        "amazing-grace-trad"
      ],
      "embeds": [
        {
          "tool": "progression",
          "title": "The chords behind the tune",
          "caption": "A bright I–IV–V march in C. Play the sequence through, one bar per chord.",
          "key": "C",
          "chords": [
            "C",
            "C7",
            "F",
            "C",
            "G7",
            "C"
          ]
        }
      ]
    },
    "extraTags": [
      "public-domain",
      "beginner",
      "gospel",
      "jazz",
      "new-orleans"
    ]
  },
  "wildwood-flower": {
    "bodyMdx": "## About this piece\n\"Wildwood Flower\" is an Appalachian classic and a rite of passage for country and flatpicking guitarists. It descends from an 1860 parlour song, \"I'll Twine 'Mid the Ringlets\" (lyrics attributed to Maud Irving, music to Joseph Philbrick Webster), which entered Southern oral tradition and mutated over decades. The Carter Family's landmark 1928 recording — with Maybelle Carter's iconic guitar picking — made it a foundation stone of American folk and country music. Because it passed through so many hands it's rightly called **traditional**, with no single living composer.\n\n## What to listen for\nMaybelle Carter's \"thumb-lead\" style: the melody picked out on the bass strings by the thumb while the fingers brush chords in between. This became known as the \"Carter scratch\" and defined how generations play the tune. The mood is bright, tuneful, and gently rolling.\n\n## What you'll learn\nThe essential country-guitar technique of playing **melody and rhythm at once** — thumb picks the tune on the lower strings, fingers strum the chords on the off-beats. It builds thumb independence, alternating bass, and clean single-note picking.\n\n## Chords, keys and approach\nMost commonly played in **C major** (also G). The core chords are simple: **C, F, G7** (and G). Approach it either as a **flatpicked** melody (single notes with a pick) or in the **Carter-scratch fingerstyle** — the classic way. Keep a steady, moderate tempo; the tune should feel relaxed and singable.\n\n## How to practise\nLearn the melody as single notes first, slowly, until it's memorised. Separately practise the chord strums. Then combine: thumb (or pick) plays melody notes, brush the chord in the gaps. Start well under tempo with a metronome and speed up only when the two parts lock together cleanly.\n\n## If you like this\nExplore more traditional American tunes like *Frankie and Johnny* and *House of the Rising Sun*.",
    "details": {
      "key": "C major",
      "era": "Traditional",
      "form": "song (strophic verses)",
      "timeSignature": "3/4",
      "composer": "Traditional (tune attrib. Joseph Philbrick Webster; lyrics attrib. Maud Irving)",
      "composedYear": "1860 (as 'I'll Twine 'Mid the Ringlets'); popularized by the Carter Family 1928",
      "related": [
        "house-of-the-rising-sun",
        "frankie-and-johnny",
        "scarborough-fair",
        "greensleeves-trad"
      ]
    },
    "extraTags": [
      "public-domain",
      "beginner"
    ]
  }
};
