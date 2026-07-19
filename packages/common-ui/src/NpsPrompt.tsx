import { type Locale, t } from '@TheY2T/tmr-i18n';
import { Button, cn, Icon, Textarea } from '@TheY2T/tmr-ui';
import { dismissNps, npsEligibility, submitNps } from '@TheY2T/tmr-web-acl/feedback-api';
import { useEffect, useState } from 'react';

export interface NpsPromptProps {
  locale: Locale;
  /** The prompt only shows to signed-in users; server-side eligibility gates the rest. */
  signedIn?: boolean;
  /** Where the prompt was shown, recorded with the response for close-the-loop context. */
  source?: string;
}

const SCORES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

/**
 * The relational NPS prompt: a slide-up card asking how likely the user is to recommend the site,
 * with an optional follow-up comment. Shown once per eligibility window to activated, signed-in
 * users; dismissible.
 */
export default function NpsPrompt({ locale, signedIn = false, source }: NpsPromptProps) {
  const [visible, setVisible] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!signedIn) return;
    let active = true;
    npsEligibility()
      .then((eligible) => {
        if (active && eligible) setVisible(true);
      })
      .catch(() => {
        // Eligibility is best-effort — stay hidden on error.
      });
    return () => {
      active = false;
    };
  }, [signedIn]);

  if (!visible) return null;

  async function onSubmit() {
    if (score === null) return;
    setBusy(true);
    try {
      await submitNps({ score, comment: comment.trim() || undefined, source });
      setDone(true);
      window.setTimeout(() => setVisible(false), 2000);
    } catch {
      setBusy(false);
    }
  }

  function onDismiss() {
    setVisible(false);
    dismissNps().catch(() => {
      // best-effort
    });
  }

  return (
    <div className="fixed bottom-4 left-1/2 z-40 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-lg border border-border bg-popover p-5 text-popover-foreground shadow-lg">
      {done ? (
        <div className="flex items-center gap-2 text-sm" role="status">
          <Icon name="check" className="size-4 text-accent" />
          {t(locale, 'nps.thanks')}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-medium">{t(locale, 'nps.question')}</p>
            <button
              type="button"
              aria-label={t(locale, 'feedback.close')}
              onClick={onDismiss}
              className="-mr-1 -mt-1 inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Icon name="x" className="size-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-1">
            {SCORES.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setScore(n)}
                aria-pressed={score === n}
                className={cn(
                  'size-8 rounded-md border text-sm tabular-nums transition-colors',
                  score === n
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border hover:bg-muted',
                )}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{t(locale, 'nps.notLikely')}</span>
            <span>{t(locale, 'nps.veryLikely')}</span>
          </div>
          {score !== null ? (
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t(locale, 'nps.commentPlaceholder')}
              aria-label={t(locale, 'nps.commentLabel')}
              rows={2}
            />
          ) : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onDismiss}>
              {t(locale, 'nps.dismiss')}
            </Button>
            <Button type="button" onClick={onSubmit} disabled={score === null || busy}>
              {t(locale, 'nps.submit')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
