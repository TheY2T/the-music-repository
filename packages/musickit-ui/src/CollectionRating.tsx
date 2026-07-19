import { StarRating } from '@TheY2T/tmr-ui';
import { rateCollection } from '@TheY2T/tmr-web-acl/collections-api';
import { useState } from 'react';

/**
 * Collection rating widget. Readonly display (average + count), or interactive when `interactive` is
 * set (signed in) — submits via the API and updates the shown aggregate optimistically. i18n-by-prop.
 */
export default function CollectionRating({
  slug,
  average,
  count,
  yourRating,
  interactive,
  labels,
}: {
  slug: string;
  average?: number;
  count: number;
  yourRating?: number;
  interactive: boolean;
  labels: {
    yourRating: string;
    averageRating: string;
    rateAria: (star: number) => string;
    ratingCount: (count: number) => string;
  };
}) {
  const [avg, setAvg] = useState(average ?? 0);
  const [total, setTotal] = useState(count);
  const [mine, setMine] = useState(yourRating ?? 0);

  async function submit(value: number) {
    const prev = { avg, total, mine };
    setMine(value); // optimistic
    const result = await rateCollection(slug, value);
    if (result) {
      setAvg(result.average ?? value);
      setTotal(result.count);
      setMine(result.yourRating);
    } else {
      setAvg(prev.avg);
      setTotal(prev.total);
      setMine(prev.mine);
    }
  }

  if (!interactive) {
    return (
      <div className="flex items-center gap-2">
        <StarRating value={avg} readOnly size="sm" />
        <span className="text-xs text-muted-foreground">{labels.ratingCount(total)}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground">{labels.yourRating}</span>
      <div className="flex items-center gap-3">
        <StarRating value={mine} readOnly={false} onRate={submit} ariaLabelFor={labels.rateAria} />
        <span className="text-xs text-muted-foreground">
          {labels.averageRating} {avg.toFixed(1)} · {labels.ratingCount(total)}
        </span>
      </div>
    </div>
  );
}
