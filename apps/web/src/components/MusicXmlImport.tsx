import { type Locale, t } from '@TheY2T/tmr-i18n';
import { Button, Icon, Textarea } from '@TheY2T/tmr-ui';
import { useRef, useState } from 'react';
import ScorePlayer from '@/components/ScorePlayer';

/**
 * `/tools/musicxml` — import + render MusicXML with alphaTab (ADR 0027; replaces the hand-rolled
 * DOMParser + StaffSequence path). Paste MusicXML or upload a `.musicxml`/`.xml` file; alphaTab imports
 * it natively and the shared {@link ScorePlayer} renders + plays it.
 */
const SAMPLE = `<?xml version="1.0" encoding="UTF-8"?>
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

export default function MusicXmlImport({ locale }: { locale: Locale }) {
  const [text, setText] = useState(SAMPLE);
  const [applied, setApplied] = useState(SAMPLE);
  const fileRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{t(locale, 'score.importPasteHint')}</p>

      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={10}
        spellCheck={false}
        className="font-mono text-xs"
        aria-label="MusicXML"
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
        <input
          ref={fileRef}
          type="file"
          accept=".musicxml,.xml,.txt"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            void file.text().then((content) => {
              setText(content);
              setApplied(content);
            });
          }}
        />
      </div>

      <ScorePlayer key={applied} tex={applied} mode="standard" locale={locale} interactive />
    </div>
  );
}
