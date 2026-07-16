import { Button, Icon, Select } from '@TheY2T/tmr-ui';
import { useState } from 'react';
import LevelToggle from '@/components/LevelToggle';
import { isWithinLevel, pitchName, ROOT_CHOICES } from '@/lib/music-theory';
import {
  PROGRESSION_GENRES,
  PROGRESSION_TEMPLATES,
  type ProgressionTemplate,
  realizeProgression,
} from '@/lib/progressions';
import { playNote } from '@/lib/soundfont';
import { useLevel } from '@/lib/use-level';

const CHORD_MIDI = 60; // voice chords around C4

export default function ProgressionGenerator() {
  const { level, setLevel } = useLevel();
  const [root, setRoot] = useState(0);
  const [genre, setGenre] = useState<string>('pop');

  const flats = [1, 3, 5, 8, 10].includes(root);
  const templates = PROGRESSION_TEMPLATES.filter(
    (t) => t.genre === genre && isWithinLevel(t.level, level),
  );

  function playProgression(template: ProgressionTemplate) {
    const chords = realizeProgression(root, template, flats);
    chords.forEach((chord, index) => {
      window.setTimeout(() => {
        for (const pc of chord.pitchClasses) playNote(CHORD_MIDI + pc, 0.95);
      }, index * 850);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <label className="space-y-1 text-sm">
          <span className="block font-medium">Key</span>
          <Select
            value={root}
            onChange={(e) => setRoot(Number(e.target.value))}
            className="h-auto w-auto px-2 py-1"
          >
            {ROOT_CHOICES.map((pc) => (
              <option key={pc} value={pc}>
                {pitchName(pc)}
              </option>
            ))}
          </Select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="block font-medium" data-help="chords">
            Style
          </span>
          <Select
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            className="h-auto w-auto px-2 py-1 capitalize"
          >
            {PROGRESSION_GENRES.map((g) => (
              <option key={g} value={g} className="capitalize">
                {g}
              </option>
            ))}
          </Select>
        </label>
        <LevelToggle level={level} onChange={setLevel} />
      </div>

      {templates.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No {genre} progressions at this level — raise the level to see richer options.
        </p>
      ) : (
        <ul className="space-y-3">
          {templates.map((template) => {
            const chords = realizeProgression(root, template, flats);
            return (
              <li key={template.key} className="rounded-lg border border-border p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="font-semibold">{template.label}</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => playProgression(template)}
                  >
                    <Icon name="play" className="size-4" />
                    Play
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {chords.map((chord, i) => (
                    <div
                      // Chords repeat within a progression, so index keeps keys unique.
                      key={`${chord.name}-${i}`}
                      className="min-w-14 rounded-md border border-border px-3 py-2 text-center"
                    >
                      <div className="text-xs text-muted-foreground">{chord.roman}</div>
                      <div className="font-semibold">{chord.name}</div>
                    </div>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-xs text-muted-foreground">
        Common progressions by style, transposed to your key. Press Play to hear one, then take it
        into the chord analyzer or a play-along tool. Raise the level for jazz 7ths, turnarounds and
        secondary dominants.
      </p>
    </div>
  );
}
