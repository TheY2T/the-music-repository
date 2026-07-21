import AlphaTexScore from '@TheY2T/tmr-musickit-ui/score/AlphaTexScore';
import { Card, SegmentedToggle } from '@TheY2T/tmr-ui';
import type { Locale } from '@TheY2T/tmr-web-acl';
import { useState } from 'react';

const SAMPLES: Record<string, { label: string; tex: string; mode: 'standard' | 'tab' }> = {
  scale: {
    label: 'C major scale',
    mode: 'standard',
    tex: '\\title "C major scale"\n.\nC4 D4 E4 F4 | G4 A4 B4 c4',
  },
  triad: {
    label: 'C–F–G triads',
    mode: 'standard',
    tex: '\\title "Triads"\n.\n(C4 E4 G4) (F4 A4 c4) (G4 B4 d4) (C4 E4 G4)',
  },
  riff: {
    label: 'Guitar riff (tab)',
    mode: 'tab',
    tex: '\\title "Riff"\n.\n0.6 3.6 5.6 | 5.5 3.5 0.5',
  },
};

/**
 * Drives the single alphaTab score engine through the `AlphaTexScore` surface: pick a sample and mode,
 * and the engine renders + plays it. Reloading a new tex reuses the same warm engine.
 */
export default function ScoreInspector({ locale }: { locale: Locale }) {
  const [key, setKey] = useState('scale');
  const sample = SAMPLES[key] ?? SAMPLES.scale;

  return (
    <Card className="space-y-3 p-4">
      <SegmentedToggle
        value={key}
        onValueChange={setKey}
        options={Object.entries(SAMPLES).map(([value, s]) => ({ value, label: s.label }))}
      />
      <p className="text-xs text-muted-foreground">
        mode: <span className="font-mono">{sample.mode}</span>
      </p>
      <AlphaTexScore key={key} tex={sample.tex} mode={sample.mode} locale={locale} />
    </Card>
  );
}
