import ContentBody from '@TheY2T/tmr-musickit-ui/content/ContentBody';
import {
  ChordDiagram,
  GUITAR_CHORDS,
  KeyboardChordDiagram,
  type StaffNoteDatum,
  StaffSequence,
} from '@TheY2T/tmr-musickit-ui/organisms';
import ScorePlayer from '@TheY2T/tmr-musickit-ui/ScorePlayer';
import AlphaTexScore from '@TheY2T/tmr-musickit-ui/score/AlphaTexScore';
import type { Locale } from '@TheY2T/tmr-web-acl';

// Wrappers for music components that need example data props (organisms take shapes/notes; score
// surfaces take an alphaTex string). Injected as specimens so testers see them fully rendered.

const SAMPLE_TEX = `\\title "C major scale"
.
C4 D4 E4 F4 | G4 A4 B4 c4`;

export function ChordDiagramExample() {
  const cChord = GUITAR_CHORDS.find((c) => c.name === 'C') ?? GUITAR_CHORDS[0];
  return <ChordDiagram chord={cChord} />;
}

export function KeyboardChordDiagramExample() {
  return <KeyboardChordDiagram midis={[60, 64, 67]} label="C major" />;
}

export function StaffSequenceExample() {
  const notes: StaffNoteDatum[] = [
    { step: 0, label: 'C', beats: 1 },
    { step: 1, label: 'D', beats: 1 },
    { step: 2, label: 'E', beats: 1 },
    { step: 3, label: 'F', beats: 1 },
    { step: 4, label: 'G', beats: 1 },
    { step: 5, label: 'A', beats: 1 },
    { step: 6, label: 'B', beats: 1 },
    { step: 7, label: 'C', beats: 1 },
  ];
  return <StaffSequence notes={notes} showLabels activeIndex={2} />;
}

export function AlphaTexScoreExample({ locale }: { locale: Locale }) {
  return <AlphaTexScore tex={SAMPLE_TEX} locale={locale} />;
}

export function ScorePlayerExample({ locale }: { locale: Locale }) {
  return <ScorePlayer tex={SAMPLE_TEX} locale={locale} mode="standard" />;
}

export function ContentBodyExample({ locale }: { locale: Locale }) {
  const bodyHtml =
    '<h2>About this piece</h2><p>A gentle study in phrasing and dynamics, suitable for early ' +
    'intermediate players. Focus on an even legato in the right hand.</p><ul><li>Key: C major</li>' +
    '<li>Form: Ternary (ABA)</li></ul>';
  return <ContentBody bodyHtml={bodyHtml} embeds={undefined} locale={locale} interactive={false} />;
}
