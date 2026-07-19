import { type Locale, t } from '@TheY2T/tmr-i18n';
import { tabTuningFor } from '@TheY2T/tmr-music-core/score/loop';
import type { ScoreDisplayMode } from '@TheY2T/tmr-music-core/score/score-engine';
import { Button, Icon, Textarea } from '@TheY2T/tmr-ui';
import { useRef, useState } from 'react';
import ScorePlayer from './ScorePlayer';

/**
 * `/tools/score` — an alphaTab score playground (ADR 0027). Type
 * alphaTex (alphaTab's native notation format) or paste/upload MusicXML — the engine sniffs the format
 * by its leading `<` — then render + play it through the shared {@link ScorePlayer}. The MusicXML import
 * tool (`/tools/musicxml`) folds in here as the "MusicXML" input format (consolidation C5).
 */
const ALPHATEX_SAMPLE = `\\title "Sketch" \\tempo 96
.
\\track "Piano"
  \\staff{score} \\tuning piano \\instrument acousticgrandpiano
  :4 c4 d4 e4 f4 | :4 g4 g4 :2 e4 |
  :4 f4 e4 d4 c4 | :1 c4 |`;

const MUSICXML_SAMPLE = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">
  <part-list><score-part id="P1"><part-name>Music</part-name></score-part></part-list>
  <part id="P1">
    <measure number="1">
      <attributes><divisions>2</divisions><clef><sign>G</sign><line>2</line></clef></attributes>
      <note><pitch><step>C</step><octave>4</octave></pitch><duration>2</duration><type>quarter</type></note>
      <note><pitch><step>D</step><octave>4</octave></pitch><duration>2</duration><type>quarter</type></note>
      <note><pitch><step>E</step><octave>4</octave></pitch><duration>2</duration><type>quarter</type></note>
      <note><pitch><step>F</step><octave>4</octave><alter>1</alter></pitch><duration>2</duration><type>quarter</type></note>
    </measure>
    <measure number="2">
      <note><pitch><step>G</step><octave>4</octave></pitch><duration>2</duration><type>quarter</type></note>
      <note><rest/><duration>2</duration><type>quarter</type></note>
      <note><pitch><step>B</step><octave>4</octave><alter>-1</alter></pitch><duration>2</duration><type>quarter</type></note>
      <note><pitch><step>C</step><octave>5</octave></pitch><duration>2</duration><type>quarter</type></note>
    </measure>
  </part>
</score-partwise>`;

type InputFormat = 'alphatex' | 'musicxml';
const SAMPLES: Record<InputFormat, string> = {
  alphatex: ALPHATEX_SAMPLE,
  musicxml: MUSICXML_SAMPLE,
};

export default function ScoreRenderer({ locale }: { locale: Locale }) {
  const [format, setFormat] = useState<InputFormat>('alphatex');
  const [text, setText] = useState(ALPHATEX_SAMPLE);
  const [applied, setApplied] = useState(ALPHATEX_SAMPLE);
  const [mode, setMode] = useState<ScoreDisplayMode>('standard');
  const fileRef = useRef<HTMLInputElement | null>(null);

  function selectFormat(next: InputFormat) {
    setFormat(next);
    setText(SAMPLES[next]);
    setApplied(SAMPLES[next]);
    if (next === 'musicxml') setMode('standard');
  }

  const onUpload = async (file: File) => {
    const content = await file.text();
    setText(content);
    setApplied(content);
    // Sniff the uploaded format so the editor's labels/toggles match.
    setFormat(content.trimStart().startsWith('<') ? 'musicxml' : 'alphatex');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-lg border border-border p-1">
          {(['alphatex', 'musicxml'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => selectFormat(f)}
              className={`rounded px-2 py-1 text-xs ${format === f ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
            >
              {f === 'alphatex' ? 'alphaTex' : 'MusicXML'}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        {t(locale, format === 'alphatex' ? 'score.playgroundHint' : 'score.importPasteHint')}
      </p>

      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={format === 'alphatex' ? 8 : 10}
        spellCheck={false}
        className="font-mono text-xs"
        aria-label={format === 'alphatex' ? 'alphaTex' : 'MusicXML'}
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
        <Button type="button" variant="ghost" onClick={() => selectFormat(format)}>
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
        {format === 'alphatex' ? (
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
        ) : null}
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
