# Extended Features Backlog

Ideas captured for **review after all phases (0 → 6) are complete**. Nothing here is committed work — it
is a parking lot of candidate extensions, primarily for **Phase 5 (play-along & practice tools)** but
some bridge into other phases. Each item notes rough **effort**, **value**, and whether it holds our
**dependency-free, client-side** pattern or would need a library.

Status legend: 🟢 dependency-free · 📚 needs a library · 🔗 touches the backend/other phases.

> Context: Phase 5 shipped Slices A–Z (19 play-along tools; 34 total in the `/tools` hub), all
> client-side and dependency-free — including MusicXML import, multi-voice engraving, and a
> pitch-preserving practice player achieved with `DOMParser`, SVG, and `HTMLAudioElement.preservesPitch`.
> The items below go **beyond** the delivered plan menu.

---

## Group 1 — Deepen what exists (low effort, high polish)

| Idea | Notes | Effort | Value |
|---|---|---|---|
| 🟢 **More content, not tools** | More songs (Song Player), licks/turnarounds (jazz ii-V, country, funk), voicings (9/13, quartal), CAGED for minor/7th chords, rhythm figures (triplets, 16ths, ties) | Low | Med |
| 🟢 **Web MIDI input** | Web MIDI API (built-in) → play a real keyboard / MIDI-guitar into the keyboard, chord identifier, and ear-trainers. Upgrades *every* existing input tool at once | Med | **High** |
| 🟢 **Metronome upgrades** | Subdivisions, accent patterns, polyrhythm, tap-tempo — fold into the existing metronome | Low | Med |

## Group 2 — New dependency-free tools (medium effort)

| Idea | Notes | Effort | Value |
|---|---|---|---|
| 🟢 **Melodic dictation** | Hear a short phrase, reconstruct it on a staff (ear-training's harder sibling) | Med | High |
| 🟢 **Sight-singing / solfège trainer** | Scale degrees on a staff, movable-do | Med | Med |
| 🟢 **Rhythm dictation / tap-to-match** | A rhythm plays; tap it back → timing-accuracy scoring | Med | High |
| 🟢 **Key-signature & interval-construction quizzes** | Round out the quiz family | Low | Med |
| 🟢 **Nashville-number / Roman-numeral analyzer** | Type a progression → functional analysis + a reharmonization suggestion | Med | High |
| 🟢 **Transposer / capo tool** | Transpose a chart; find capo positions | Low | Med |
| 🟢 **Drum-pattern / groove library** | Genre grooves on the existing sequencer engine | Low | Med |
| 🟢 **Bass-line generator** | Walking / root-fifth bass over the backing track | Med | Med |

## Group 3 — Integrative / "make it feel like an app" (medium–high effort)

| Idea | Notes | Effort | Value |
|---|---|---|---|
| 🟢 **"Practice room"** | Combine backing track + notation + chord diagrams under one key/tempo control | High | High |
| 🔗 **Save & share user creations** | Progressions, licks, custom songs — `localStorage` first, then the backend. Natural bridge into personalization | Med→High | High |
| 🔗 **Practice streaks / session logging for tools** | Tie tool usage into the Phase 2 progress dashboard (touches the API) | Med | Med |

## Group 4 — Where we'd finally add a library (honest)

| Idea | Notes | Effort | Value |
|---|---|---|---|
| 📚 **Full score rendering** | Multi-staff, beaming, slurs, dynamics, multi-part MusicXML → **Verovio / OSMD**. Our engraver is deliberately minimal | High | High |
| 📚 **High-quality instrument playback** | Real piano/guitar samples instead of oscillators → **soundfont-player / smplr** | Med | High |
| 📚 **Notation-synced playback of imported scores** | Moving cursor over a fully-engraved score → best paired with Verovio | High | High |

---

## Suggested first picks (when we return here)

1. 🟢 **Web MIDI input** — highest-leverage dependency-free addition; upgrades many existing tools at once.
2. 🔗 **localStorage save/share** — natural bridge toward Phase 6 (monetization gates *personalized* features).
3. 📚 **Soundfont playback** — the single biggest perceived-quality jump, if/when we accept a library.
