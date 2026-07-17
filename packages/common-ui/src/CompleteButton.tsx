import { Button, Icon } from '@TheY2T/tmr-ui';
import { getProgress, markComplete, markIncomplete } from '@TheY2T/tmr-web-data/progress-api';
import { useEffect, useState } from 'react';

/** Toggle "completed" for a content item on its detail page. Fetches its own initial state. */
export default function CompleteButton({ slug }: { slug: string }) {
  const [completed, setCompleted] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getProgress().then((summary) => {
      if (summary) {
        setCompleted(summary.completedSlugs.includes(slug));
      }
    });
  }, [slug]);

  async function toggle() {
    const next = !completed;
    setBusy(true);
    setCompleted(next); // optimistic
    try {
      await (next ? markComplete(slug) : markIncomplete(slug));
    } catch {
      setCompleted(!next);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button variant={completed ? 'default' : 'outline'} size="sm" disabled={busy} onClick={toggle}>
      {completed ? (
        <>
          <Icon name="check" className="size-4" />
          Completed
        </>
      ) : (
        'Mark complete'
      )}
    </Button>
  );
}
