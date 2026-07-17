import { Button } from '@TheY2T/tmr-ui';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import DrillFeedback from './DrillFeedback';

// DrillFeedback is a full-screen, pointer-events-none particle overlay for the ear-training / quiz
// tools: each transition of `result` to 'correct'/'wrong' fires a one-shot burst. It has no static
// visual, so this story lets you trigger the bursts.
const meta: Meta = { title: 'MusicKit UI/DrillFeedback' };
export default meta;

export const Default: StoryObj = {
  render: function DrillFeedbackDemo() {
    const [result, setResult] = useState<'correct' | 'wrong' | null>(null);
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Click a button to fire a feedback burst (a brief particle animation over the whole frame).
        </p>
        <div className="flex gap-2">
          <Button onClick={() => setResult(result === 'correct' ? null : 'correct')}>
            Correct ✓
          </Button>
          <Button variant="outline" onClick={() => setResult(result === 'wrong' ? null : 'wrong')}>
            Wrong ✗
          </Button>
        </div>
        <DrillFeedback result={result} />
      </div>
    );
  },
};
