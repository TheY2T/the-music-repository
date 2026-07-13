---
slug: omt-diatonic-chords
key: ""
era: ""
form: "lesson"
timeSignature: ""
suggestedDifficulty: 3
suggestedTags: ["cc-by-sa"]
relatedSlugs: ["omt-triads-and-inversions", "omt-seventh-chords", "omt-cadences", "omt-major-scale-key-signatures", "omt-secondary-dominants"]
sources: ["general knowledge", "Open Music Theory (CC BY-SA 4.0)"]
---
## Chords that belong to a key

A **diatonic chord** is a chord built only from the notes of one scale. Take a major scale, build a triad on each degree by stacking thirds *within the scale*, and you get the seven chords that "belong" to that key.

## Building them in C major

Using only the white keys, stack a third and a fifth above each scale degree:

```
Degree  Triad      Notes      Quality      Roman numeral
1        C          C–E–G      major        I
2        D          D–F–A      minor        ii
3        E          E–G–B      minor        iii
4        F          F–A–C      major        IV
5        G          G–B–D      major        V
6        A          A–C–E      minor        vi
7        B          B–D–F      diminished   vii°
```

## The pattern is the same in every major key

Because a major scale always has the same step pattern, the *qualities* of its diatonic triads never change — only the note names do. Memorise this one sequence and it works for all twelve keys:

```
I   ii   iii   IV   V   vi   vii°
maj min  min   maj  maj min  dim
```

**Roman-numeral notation** encodes both position and quality: uppercase for major (`I`, `IV`, `V`), lowercase for minor (`ii`, `iii`, `vi`), and lowercase with a small circle for diminished (`vii°`). This lets you describe a progression independently of key — `I–V–vi–IV` is the same "shape" whether you play it in C, G, or E♭.

## The three functional families

The seven chords group by **function** — the role they play in tension and release:

- **Tonic (rest):** `I`, and its relatives `vi` and `iii`. Home base.
- **Predominant (motion):** `ii` and `IV`. They set up the dominant.
- **Dominant (tension):** `V` and `vii°`. They pull strongly back to `I`, because both contain the leading tone (scale degree 7) that wants to rise to the tonic.

A huge amount of tonal music is just **T → PD → D → T**, for example `I – IV – V – I` or `I – ii – V – I`.

## Diatonic chords in minor keys

The natural-minor scale gives a different set of qualities (`i – ii° – III – iv – v – VI – VII`). In practice composers **raise the seventh** (the harmonic-minor adjustment) so the `v` becomes a major `V` with a true leading tone — that is what gives minor keys their strong dominant pull, as in `i – iv – V – i`.

## Reading real progressions

Once you can label chords with Roman numerals, patterns jump off the page:

- `I – V – vi – IV` — the ubiquitous pop progression.
- `ii – V – I` — the backbone of jazz.
- `I – vi – IV – V` — the classic doo-wop / 50s progression.

## Check yourself

Write the seven diatonic triads of **G major** and label each. (Answer: `G` I, `Am` ii, `Bm` iii, `C` IV, `D` V, `Em` vi, `F♯°` vii° — the pattern maj-min-min-maj-maj-min-dim, exactly as in C.) Then build the same set in **/tools/scale-explorer**, play the `I–IV–V–I` in **/tools/circle-of-fifths**, and move on to the cadences and seventh-chords lessons to hear how these chords resolve.
