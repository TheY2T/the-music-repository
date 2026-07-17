import type { ContentRevisionSummary } from '@TheY2T/tmr-api-client';
import { type Locale, t } from '@TheY2T/tmr-i18n';
import { Button, Card, Icon } from '@TheY2T/tmr-ui';
import { adminApi } from '@TheY2T/tmr-web-data/admin-api';
import { useEffect, useState } from 'react';

/**
 * Version-history panel (ADR 0030): lists a content item's publish snapshots (newest first) and restores
 * one onto the item. Presentational + i18n-by-prop; reload is delegated to the parent form via `onRestored`.
 */
export function RevisionsPanel({
  slug,
  locale,
  onRestored,
}: {
  slug: string;
  locale: Locale;
  onRestored: () => void;
}) {
  const [items, setItems] = useState<ContentRevisionSummary[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    adminApi
      .listRevisions(slug)
      .then((r) => setItems(r.items))
      .catch((e: Error) => setError(e.message));
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: reload only when the item changes.
  useEffect(load, [slug]);

  const restore = async (revisionId: string) => {
    if (!confirm(t(locale, 'cform.confirmRestore'))) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await adminApi.restoreRevision(slug, revisionId);
      onRestored();
      load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="space-y-3 p-5">
      <h2 className="font-display text-lg font-semibold tracking-tight">
        {t(locale, 'cform.revisions')}
      </h2>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t(locale, 'cform.noRevisions')}</p>
      ) : (
        <ul className="space-y-1.5 text-sm">
          {items.map((rev) => (
            <li key={rev.id} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Icon name="clock" className="size-4" />
                <time dateTime={rev.createdAt}>
                  {new Date(rev.createdAt).toLocaleString(locale)}
                </time>
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => restore(rev.id)}
              >
                <Icon name="refresh" className="size-4" />
                {t(locale, 'cform.restore')}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
