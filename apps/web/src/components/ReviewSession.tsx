import { type Locale, localizedPath, type MessageKey, t } from '@TheY2T/tmr-i18n';
import { Badge, Button } from '@TheY2T/tmr-ui';
import { useEffect, useState } from 'react';
import { DECKS, findDeck } from '@/lib/drill-decks';
import { getDeckReviews, gradeCard } from '@/lib/reviews-api';

const SESSION_LIMIT = 12;
const GRADES: { labelKey: MessageKey; quality: number; className: string }[] = [
  { labelKey: 'review.again', quality: 2, className: 'border-red-500 text-red-600' },
  { labelKey: 'review.good', quality: 4, className: 'border-green-600 text-green-700' },
  { labelKey: 'review.easy', quality: 5, className: 'border-blue-500 text-blue-600' },
];

interface QueueItem {
  deckKey: string;
  card: string;
}

/** Single-deck (due + new) when `deckKey` is set; otherwise all due cards across every deck. */
export default function ReviewSession({ deckKey, locale }: { deckKey?: string; locale: Locale }) {
  const [queue, setQueue] = useState<QueueItem[] | null>(null);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    async function build() {
      const now = Date.now();
      if (deckKey) {
        const deck = findDeck(deckKey);
        if (!deck) {
          setQueue([]);
          return;
        }
        const states = await getDeckReviews(deckKey);
        const seen = new Set(states.map((s) => s.card));
        const due = states.filter((s) => new Date(s.dueAt).getTime() <= now).map((s) => s.card);
        const fresh = deck.cards.filter((c) => !seen.has(c));
        setQueue([...due, ...fresh].slice(0, SESSION_LIMIT).map((card) => ({ deckKey, card })));
        return;
      }
      // Cross-deck: due cards only, across every deck.
      const items: QueueItem[] = [];
      for (const deck of DECKS) {
        const states = await getDeckReviews(deck.key);
        for (const s of states) {
          if (new Date(s.dueAt).getTime() <= now) {
            items.push({ deckKey: deck.key, card: s.card });
          }
        }
      }
      setQueue(items.slice(0, SESSION_LIMIT));
    }
    build();
  }, [deckKey]);

  const item = queue && index < queue.length ? queue[index] : undefined;
  const deck = item ? findDeck(item.deckKey) : undefined;

  // Auto-play aural cards (silent until the first gesture); visual decks show a prompt instead.
  useEffect(() => {
    if (item && deck?.play && !deck.prompt) {
      deck.play(item.card);
    }
  }, [item, deck]);

  if (!queue) {
    return <p className="text-sm text-muted-foreground">{t(locale, 'review.loading')}</p>;
  }
  if (queue.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {t(locale, 'review.nothingDue')}{' '}
        <a href={localizedPath(locale, '/drills')} className="underline">
          {t(locale, 'review.pickADeck')}
        </a>
        .
      </p>
    );
  }
  if (!item || !deck) {
    return (
      <div className="space-y-4">
        <p className="text-lg font-medium">
          {t(locale, 'review.sessionComplete', { count: reviewed })}
        </p>
        <div className="flex gap-3">
          <a href={localizedPath(locale, '/drills')}>
            <Button variant="outline">{t(locale, 'review.backToDrills')}</Button>
          </a>
        </div>
      </div>
    );
  }

  async function grade(quality: number) {
    if (!item) {
      return;
    }
    setBusy(true);
    await gradeCard(item.deckKey, item.card, quality);
    setBusy(false);
    setReviewed((r) => r + 1);
    setRevealed(false);
    setIndex((i) => i + 1);
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        {t(locale, 'review.cardProgress', { current: index + 1, total: queue.length })}
        {!deckKey ? (
          <Badge variant="secondary" className="ml-2">
            {deck.title}
          </Badge>
        ) : null}
      </p>

      {deck.prompt ? <div className="flex justify-center">{deck.prompt(item.card)}</div> : null}
      {deck.play ? (
        <div className="flex justify-center">
          <Button variant="outline" size="lg" onClick={() => deck.play?.(item.card)}>
            ▶ {t(locale, 'review.play')}
          </Button>
        </div>
      ) : null}

      {revealed ? (
        <div className="space-y-4 text-center">
          <div className="text-2xl font-bold">{deck.answer(item.card)}</div>
          <div className="flex justify-center gap-3">
            {GRADES.map((g) => (
              <Button
                key={g.labelKey}
                variant="outline"
                disabled={busy}
                className={g.className}
                onClick={() => grade(g.quality)}
              >
                {t(locale, g.labelKey)}
              </Button>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center">
          <Button onClick={() => setRevealed(true)}>{t(locale, 'review.showAnswer')}</Button>
        </div>
      )}
    </div>
  );
}
