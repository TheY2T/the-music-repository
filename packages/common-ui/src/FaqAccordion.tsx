import { type Locale, t } from '@TheY2T/tmr-i18n';
import { Icon } from '@TheY2T/tmr-ui';
import type { FaqEntry } from '@TheY2T/tmr-web-acl/dto';
import { marked } from 'marked';
import { useMemo } from 'react';

/** Group entries by category, preserving the API's category-then-sortOrder ordering. */
function groupByCategory(entries: FaqEntry[]): { category: string; entries: FaqEntry[] }[] {
  const groups: { category: string; entries: FaqEntry[] }[] = [];
  const index = new Map<string, number>();
  for (const entry of entries) {
    let at = index.get(entry.category);
    if (at === undefined) {
      at = groups.length;
      index.set(entry.category, at);
      groups.push({ category: entry.category, entries: [] });
    }
    groups[at].entries.push(entry);
  }
  return groups;
}

/**
 * The public FAQ, rendered as one disclosure list per category. Each question is a native `<details>`
 * so the Markdown answer is always in the DOM (crawlable) and toggles without JavaScript.
 * Presentational + i18n-by-prop; the entries are fetched server-side and passed in.
 */
export default function FaqAccordion({ locale, entries }: { locale: Locale; entries: FaqEntry[] }) {
  const groups = useMemo(() => groupByCategory(entries), [entries]);
  const answers = useMemo(
    () => new Map(entries.map((entry) => [entry.slug, marked.parse(entry.answer) as string])),
    [entries],
  );

  if (groups.length === 0) {
    return <p className="text-sm text-muted-foreground">{t(locale, 'faq.empty')}</p>;
  }

  return (
    <div className="space-y-10">
      {groups.map((group) => (
        <section key={group.category} className="space-y-3">
          <h2 className="font-display text-xl font-semibold text-foreground">{group.category}</h2>
          <div className="divide-y divide-border rounded-lg border border-border">
            {group.entries.map((entry) => (
              <details key={entry.slug} className="group px-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2 py-4 text-left font-medium text-sm text-foreground [&::-webkit-details-marker]:hidden">
                  {entry.question}
                  <Icon
                    name="chevron-down"
                    className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                  />
                </summary>
                <div
                  className="prose prose-sm max-w-none pb-4 text-muted-foreground prose-headings:font-display prose-a:text-primary"
                  dangerouslySetInnerHTML={{ __html: answers.get(entry.slug) ?? '' }}
                />
              </details>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
