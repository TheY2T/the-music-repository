import { type Locale, t } from '@TheY2T/tmr-i18n';
import { Badge, Button, Card, EmptyState, Icon, SegmentedToggle } from '@TheY2T/tmr-ui';
import type { FeedbackBoardItem } from '@TheY2T/tmr-web-acl/dto';
import { fetchBoard, unvoteFeedback, voteFeedback } from '@TheY2T/tmr-web-acl/feedback-api';
import { useCallback, useEffect, useState } from 'react';

export interface FeedbackBoardProps {
  locale: Locale;
  /** Signed-in users can upvote; anonymous visitors are prompted to sign in. */
  signedIn?: boolean;
}

const PAGE_SIZE = 25;
type Sort = 'top' | 'new';

export default function FeedbackBoard({ locale, signedIn = false }: FeedbackBoardProps) {
  const [items, setItems] = useState<FeedbackBoardItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<Sort>('top');
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetchBoard({ sort, page, pageSize: PAGE_SIZE })
      .then((result) => {
        setItems(result.items);
        setTotal(result.total);
      })
      .finally(() => setLoading(false));
  }, [sort, page]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleVote(item: FeedbackBoardItem) {
    if (!signedIn) return;
    const updated = item.hasVoted ? await unvoteFeedback(item.id) : await voteFeedback(item.id);
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <SegmentedToggle<Sort>
        options={[
          { value: 'top', label: t(locale, 'board.sortTop') },
          { value: 'new', label: t(locale, 'board.sortNew') },
        ]}
        value={sort}
        onValueChange={(value) => {
          setPage(1);
          setSort(value);
        }}
        aria-label={t(locale, 'board.title')}
      />

      {!loading && items.length === 0 ? (
        <EmptyState title={t(locale, 'board.empty')} />
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id}>
              <Card className="flex items-start gap-4 p-4">
                <button
                  type="button"
                  onClick={() => toggleVote(item)}
                  disabled={!signedIn}
                  aria-pressed={item.hasVoted}
                  aria-label={
                    signedIn ? t(locale, 'board.upvote') : t(locale, 'board.signInToVote')
                  }
                  title={signedIn ? undefined : t(locale, 'board.signInToVote')}
                  className={`flex w-14 shrink-0 flex-col items-center gap-0.5 rounded-md border px-2 py-1.5 text-sm transition-colors ${
                    item.hasVoted
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:bg-muted'
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  <Icon name="thumbs-up" className="size-4" />
                  <span className="font-medium tabular-nums">{item.upvoteCount}</span>
                </button>
                <div className="min-w-0 space-y-1">
                  {item.title ? <p className="font-medium">{item.title}</p> : null}
                  <p className="text-sm text-muted-foreground">{item.message}</p>
                  <Badge variant="secondary">{t(locale, `feedback.status.${item.status}`)}</Badge>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <Icon name="chevron-left" className="size-4" />
          </Button>
          <span className="text-sm text-muted-foreground tabular-nums">
            {page} / {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            <Icon name="chevron-right" className="size-4" />
          </Button>
        </div>
      ) : null}
    </div>
  );
}
