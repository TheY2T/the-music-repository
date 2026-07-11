import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { findDeck } from '@/lib/drill-decks';
import { getDeckReviews, gradeCard } from '@/lib/reviews-api';

const SESSION_LIMIT = 10;
const GRADES = [
  { label: 'Again', quality: 2, className: 'border-red-500 text-red-600' },
  { label: 'Good', quality: 4, className: 'border-green-600 text-green-700' },
  { label: 'Easy', quality: 5, className: 'border-blue-500 text-blue-600' },
];

export default function ReviewSession({ deckKey }: { deckKey: string }) {
  const deck = findDeck(deckKey);
  const [queue, setQueue] = useState<string[] | null>(null);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const [busy, setBusy] = useState(false);

  // Build the session queue: due cards first, then new (unseen) cards, capped.
  useEffect(() => {
    if (!deck) {
      return;
    }
    getDeckReviews(deck.key).then((states) => {
      const now = Date.now();
      const seen = new Set(states.map((s) => s.card));
      const due = states.filter((s) => new Date(s.dueAt).getTime() <= now).map((s) => s.card);
      const fresh = deck.cards.filter((c) => !seen.has(c));
      setQueue([...due, ...fresh].slice(0, SESSION_LIMIT));
    });
  }, [deck]);

  // Auto-play the current card's question (silent until the first user gesture unlocks audio).
  useEffect(() => {
    if (deck && queue && index < queue.length) {
      deck.play(queue[index]);
    }
  }, [deck, queue, index]);

  if (!deck) {
    return <p className="text-sm text-red-500">Unknown deck.</p>;
  }
  if (!queue) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }
  if (queue.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nothing due right now — come back later, or{' '}
        <a href="/drills" className="underline">
          pick another deck
        </a>
        .
      </p>
    );
  }
  if (index >= queue.length) {
    return (
      <div className="space-y-4">
        <p className="text-lg font-medium">Session complete — reviewed {reviewed} cards. 🎉</p>
        <div className="flex gap-3">
          <a href="/drills">
            <Button variant="outline">Back to drills</Button>
          </a>
          <Button
            onClick={() => {
              setIndex(0);
              setReviewed(0);
              setRevealed(false);
            }}
          >
            Go again
          </Button>
        </div>
      </div>
    );
  }

  const card = queue[index];

  async function grade(quality: number) {
    if (!deck) {
      return;
    }
    setBusy(true);
    await gradeCard(deck.key, card, quality);
    setBusy(false);
    setReviewed((r) => r + 1);
    setRevealed(false);
    setIndex((i) => i + 1);
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Card {index + 1} of {queue.length}
      </p>

      <div className="flex justify-center">
        <Button variant="outline" size="lg" onClick={() => deck.play(card)}>
          ▶ Play
        </Button>
      </div>

      {revealed ? (
        <div className="space-y-4 text-center">
          <div className="text-2xl font-bold">{deck.answer(card)}</div>
          <div className="flex justify-center gap-3">
            {GRADES.map((g) => (
              <Button
                key={g.label}
                variant="outline"
                disabled={busy}
                className={g.className}
                onClick={() => grade(g.quality)}
              >
                {g.label}
              </Button>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center">
          <Button onClick={() => setRevealed(true)}>Show answer</Button>
        </div>
      )}
    </div>
  );
}
