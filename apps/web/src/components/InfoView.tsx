import type { HelpTopic } from '@TheY2T/tmr-api-client';
import { Icon } from '@TheY2T/tmr-ui';
import { marked } from 'marked';
import { useEffect, useMemo, useState } from 'react';
import { listHelpTopics } from '@/lib/help-api';

const DISMISS_KEY = 'infoview-dismissed';

/**
 * Ableton-style Info View: a persistent, dismissible panel that shows context help for whatever the
 * user hovers or focuses. Elements opt in with `data-help="<topic-slug>"`; topics are preloaded once
 * and resolved via event delegation, so it works across every island on the page.
 */
export default function InfoView() {
  const [topics, setTopics] = useState<Map<string, HelpTopic>>(new Map());
  const [active, setActive] = useState<HelpTopic | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISS_KEY) === '1');
    listHelpTopics().then((list) => setTopics(new Map(list.map((t) => [t.slug, t]))));
  }, []);

  useEffect(() => {
    function onContext(event: Event) {
      const target = event.target as HTMLElement | null;
      const element = target?.closest?.('[data-help]');
      const slug = element?.getAttribute('data-help');
      if (slug && topics.has(slug)) {
        setActive(topics.get(slug) ?? null);
      }
    }
    document.addEventListener('mouseover', onContext);
    document.addEventListener('focusin', onContext);
    return () => {
      document.removeEventListener('mouseover', onContext);
      document.removeEventListener('focusin', onContext);
    };
  }, [topics]);

  const bodyHtml = useMemo(() => (active ? (marked.parse(active.body) as string) : ''), [active]);

  function dismiss() {
    setDismissed(true);
    localStorage.setItem(DISMISS_KEY, '1');
  }
  function reopen() {
    setDismissed(false);
    localStorage.removeItem(DISMISS_KEY);
  }

  if (dismissed) {
    return (
      <button
        type="button"
        onClick={reopen}
        aria-label="Show Info View"
        title="Show Info View"
        className="fixed bottom-4 right-4 z-40 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-lg shadow-md"
      >
        ?
      </button>
    );
  }

  return (
    <aside className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-start gap-4 p-4">
        <div className="min-h-[2.5rem] flex-1">
          {active ? (
            <>
              <div className="text-sm font-semibold">{active.term}</div>
              <div
                className="prose prose-sm max-w-none text-muted-foreground dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: bodyHtml }}
              />
              {active.linkSlug ? (
                <a href={`/catalogue/${active.linkSlug}`} className="text-sm underline">
                  Learn more →
                </a>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Info View</span> — hover a highlighted
              term for context help.
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss Info View"
          title="Dismiss"
          className="rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-muted"
        >
          <Icon name="x" className="size-4" />
        </button>
      </div>
    </aside>
  );
}
