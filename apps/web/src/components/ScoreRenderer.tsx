import { type Locale, t } from '@TheY2T/tmr-i18n';
import { Button, Icon, Textarea } from '@TheY2T/tmr-ui';
import { useRef, useState } from 'react';
import ScorePlayer from '@/components/ScorePlayer';
import { tabTuningFor } from '@/lib/score/loop';
import type { ScoreDisplayMode } from '@/lib/score/score-engine';

/**
 * `/tools/score` — an alphaTab score playground (ADR 0027; replaces the old Verovio renderer). Type
 * alphaTex (alphaTab's native notation format) or upload a MusicXML / alphaTex file, then render + play
 * it through the shared {@link ScorePlayer}. Toggle between standard notation and guitar tab.
 */
const SAMPLE = `\\title "Sketch" \\tempo 96
.
\\track "Piano"
  \\staff{score} \\tuning piano \\instrument acousticgrandpiano
  :4 c4 d4 e4 f4 | :4 g4 g4 :2 e4 |
  :4 f4 e4 d4 c4 | :1 c4 |`;

export default function ScoreRenderer({ locale }: { locale: Locale }) {
  const [text, setText] = useState(SAMPLE);
  const [applied, setApplied] = useState(SAMPLE);
  const [mode, setMode] = useState<ScoreDisplayMode>('standard');
  const fileRef = useRef<HTMLInputElement | null>(null);

  const onUpload = async (file: File) => {
    const content = await file.text();
    setText(content);
    setApplied(content);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{t(locale, 'score.playgroundHint')}</p>

      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={8}
        spellCheck={false}
        className="font-mono text-xs"
        aria-label="alphaTex"
      />

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={() => setApplied(text)}>
          <Icon name="play" className="size-4" />
          {t(locale, 'score.render')}
        </Button>
        <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
          <Icon name="upload" className="size-4" />
          {t(locale, 'score.upload')}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setText(SAMPLE);
            setApplied(SAMPLE);
          }}
        >
          {t(locale, 'score.loadSample')}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept=".alphatex,.musicxml,.xml,.txt"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void onUpload(file);
          }}
        />
        <div className="ml-auto flex gap-1 rounded-lg border border-border p-1">
          {(['standard', 'tab'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded px-2 py-1 text-xs ${mode === m ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
            >
              {t(locale, m === 'standard' ? 'score.modeStandard' : 'score.modeTab')}
            </button>
          ))}
        </div>
      </div>

      {/* Re-mount the player when the source or mode changes so the engine reloads cleanly. */}
      <ScorePlayer
        key={`${mode}:${applied}`}
        tex={applied}
        mode={mode}
        tuning={mode === 'tab' ? tabTuningFor(['guitar']) : undefined}
        locale={locale}
        interactive
      />
    </div>
  );
}
