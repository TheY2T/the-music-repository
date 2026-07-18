import { type Locale, localizedPath, t } from '@TheY2T/tmr-i18n';
import type { DrillItem } from '@TheY2T/tmr-music-core/drills/drill-types';
import { DRILL_GENERATORS, findGenerator } from '@TheY2T/tmr-music-core/drills/generators';
import { playRewardChime, playWrongCue } from '@TheY2T/tmr-music-core/drills/reward-chime';
import {
  Button,
  buttonVariants,
  Card,
  cn,
  EmptyState,
  Icon,
  Progress,
  Toaster,
  toast,
} from '@TheY2T/tmr-ui';
import { recordDrillAttempt } from '@TheY2T/tmr-web-data/drills-api';
import { getDeckReviews } from '@TheY2T/tmr-web-data/reviews-api';
import { useEffect, useRef, useState } from 'react';
import DrillFeedback from './DrillFeedback';
import ComboCounter from './drills/celebration/ComboCounter';
import { answerCelebration } from './drills/celebration/celebration-tiers';
import ScorePop from './drills/celebration/ScorePop';
import SessionSummary from './drills/celebration/SessionSummary';
import EarIdentifyInput from './drills/inputs/EarIdentifyInput';
import InstrumentInput from './drills/inputs/InstrumentInput';
import MultipleChoiceInput from './drills/inputs/MultipleChoiceInput';
import PitchMicInput from './drills/inputs/PitchMicInput';
import RhythmTapInput from './drills/inputs/RhythmTapInput';
import { LEVEL_MESSAGE_KEY } from './drills/levels';

const SESSION_LIMIT = 12;
const SOUND_PREF_KEY = 'tmr.drill.sound';

interface QueueItem {
  deck: string;
  card: string;
}

function readSoundPref(): boolean {
  if (typeof localStorage === 'undefined') {
    return true;
  }
  return localStorage.getItem(SOUND_PREF_KEY) !== 'off';
}

/**
 * The objective drill session — the successor to ReviewSession for the drill engine. Same SM-2 queue
 * (due + fresh via getDeckReviews), but each item is generated + objectively checked, fires Tier-1
 * rewards (score pop, chime, particle burst) and records an attempt to the backend. Single-deck when
 * `deckKey` is set; otherwise all due cards across every deck.
 */
export default function DrillSession({
  deckKey,
  locale,
  celebrations = true,
}: {
  deckKey?: string;
  locale: Locale;
  celebrations?: boolean;
}) {
  const [queue, setQueue] = useState<QueueItem[] | null>(null);
  const [index, setIndex] = useState(0);
  const [item, setItem] = useState<DrillItem<string> | null>(null);
  const [answered, setAnswered] = useState<string | null>(null);
  const [answerCorrect, setAnswerCorrect] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [personalBest, setPersonalBest] = useState(false);
  const [leveledUpTo, setLeveledUpTo] = useState<string | null>(null);
  const [combo, setCombo] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | 'combo' | null>(null);
  const [scorePop, setScorePop] = useState<{ points: number | null; trigger: number }>({
    points: null,
    trigger: 0,
  });
  const [soundOn, setSoundOn] = useState(true);
  const startedAt = useRef(0);

  useEffect(() => setSoundOn(readSoundPref()), []);

  // Build the review queue: due-then-fresh for one deck, or all due across decks.
  useEffect(() => {
    async function build() {
      const now = Date.now();
      if (deckKey) {
        const gen = findGenerator(deckKey);
        if (!gen) {
          setQueue([]);
          return;
        }
        const states = await getDeckReviews(deckKey);
        const seen = new Set(states.map((s) => s.card));
        const due = states.filter((s) => new Date(s.dueAt).getTime() <= now).map((s) => s.card);
        const fresh = gen.cards.filter((c) => !seen.has(c));
        setQueue(
          [...due, ...fresh].slice(0, SESSION_LIMIT).map((card) => ({ deck: deckKey, card })),
        );
        return;
      }
      const items: QueueItem[] = [];
      for (const gen of DRILL_GENERATORS) {
        const states = await getDeckReviews(gen.deck);
        for (const s of states) {
          if (new Date(s.dueAt).getTime() <= now) {
            items.push({ deck: gen.deck, card: s.card });
          }
        }
      }
      setQueue(items.slice(0, SESSION_LIMIT));
    }
    build();
  }, [deckKey]);

  // Generate a concrete item whenever the queue position changes.
  const current = queue && index < queue.length ? queue[index] : undefined;
  useEffect(() => {
    if (!current) {
      setItem(null);
      return;
    }
    const gen = findGenerator(current.deck);
    if (!gen) {
      setItem(null);
      return;
    }
    setAnswered(null);
    setAnswerCorrect(false);
    setFeedback(null);
    setItem(gen.generate(current.card, 'beginner', Math.random));
    startedAt.current = Date.now();
  }, [current]);

  function toggleSound() {
    const next = !soundOn;
    setSoundOn(next);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(SOUND_PREF_KEY, next ? 'on' : 'off');
    }
  }

  async function answer(value: string) {
    if (!current || !item || answered != null) {
      return;
    }
    const gen = findGenerator(current.deck);
    if (!gen) {
      return;
    }
    const score = gen.check(item, value);
    const responseMs = Date.now() - startedAt.current;
    const nextCombo = score.correct ? combo + 1 : 0;
    const celebration = answerCelebration(score.correct, nextCombo);

    setAnswered(value);
    setAnswerCorrect(score.correct);
    setReviewed((r) => r + 1);
    setCombo(nextCombo);
    if (score.correct) {
      setCorrectCount((c) => c + 1);
    }
    if (celebrations) {
      // A combo milestone earns the bigger gold burst; otherwise the normal correct/wrong burst.
      setFeedback(celebration.comboMilestone != null ? 'combo' : celebration.burst);
      setScorePop((prev) => ({ points: celebration.scorePoints, trigger: prev.trigger + 1 }));
      if (soundOn) {
        if (score.correct) {
          playRewardChime();
        } else {
          playWrongCue();
        }
      }
    }

    const result = await recordDrillAttempt({
      deck: current.deck,
      card: current.card,
      modality: item.modality,
      accuracy: score.accuracy,
      correct: score.correct,
      responseMs,
    });
    if (result?.isPersonalBest) {
      setPersonalBest(true);
    }
    if (result?.leveledUp) {
      setLeveledUpTo(result.level);
      const levelLabel = t(locale, LEVEL_MESSAGE_KEY[result.level] ?? 'drill.level.beginner');
      toast.success(t(locale, 'drill.celebrate.levelUp', { level: levelLabel }));
    }
  }

  if (!queue) {
    return <p className="text-sm text-muted-foreground">{t(locale, 'review.loading')}</p>;
  }
  if (queue.length === 0) {
    return (
      <EmptyState
        icon={<Icon name="circle-check" className="size-6" />}
        title={t(locale, 'review.allCaughtUp')}
        action={
          <a
            href={localizedPath(locale, '/drills')}
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
          >
            {t(locale, 'review.pickADeck')}
          </a>
        }
      />
    );
  }
  if (!current || !item) {
    return (
      <SessionSummary
        reviewed={reviewed}
        correctCount={correctCount}
        personalBest={personalBest}
        leveledUpTo={leveledUpTo}
        locale={locale}
        celebrations={celebrations}
      />
    );
  }

  const isCorrect = answered != null && answerCorrect;

  return (
    <div className="space-y-6">
      <Toaster />
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
          <span>
            {t(locale, 'review.cardProgress', { current: index + 1, total: queue.length })}
          </span>
          <span className="flex items-center gap-2">
            <ComboCounter
              combo={combo}
              label={(count) => t(locale, 'drill.celebrate.combo', { count })}
            />
            <button
              type="button"
              onClick={toggleSound}
              aria-label={t(locale, 'drill.soundToggle')}
              aria-pressed={soundOn}
              className="text-muted-foreground hover:text-foreground"
            >
              <Icon name={soundOn ? 'volume' : 'volume-x'} className="size-4" />
            </button>
          </span>
        </div>
        <Progress value={(index / queue.length) * 100} />
      </div>

      <Card className="relative space-y-6 p-8">
        <ScorePop
          points={scorePop.points}
          trigger={scorePop.trigger}
          label={(points) => t(locale, 'drill.scorePop', { points })}
        />
        {item.modality === 'ear-identify' ? (
          <EarIdentifyInput item={item} answered={answered} onAnswer={answer} locale={locale} />
        ) : item.modality === 'play-instrument' ? (
          <InstrumentInput item={item} answered={answered} onAnswer={answer} locale={locale} />
        ) : item.modality === 'pitch-mic' ? (
          <PitchMicInput item={item} answered={answered} onAnswer={answer} locale={locale} />
        ) : item.modality === 'rhythm-tap' ? (
          <RhythmTapInput item={item} answered={answered} onAnswer={answer} locale={locale} />
        ) : (
          <MultipleChoiceInput item={item} answered={answered} onAnswer={answer} locale={locale} />
        )}

        {answered != null ? (
          <div className="space-y-4 text-center">
            <p
              className={cn(
                'flex items-center justify-center gap-2 font-medium',
                isCorrect ? 'text-success' : 'text-destructive',
              )}
            >
              <Icon name={isCorrect ? 'circle-check' : 'x'} className="size-4" />
              {isCorrect ? t(locale, 'drill.correct') : t(locale, 'drill.wrong')}
            </p>
            {!isCorrect ? (
              <p className="text-sm text-muted-foreground">
                {t(locale, 'drill.answerWas', { answer: item.answerLabel })}
              </p>
            ) : null}
            <Button onClick={() => setIndex((i) => i + 1)}>{t(locale, 'drill.next')}</Button>
          </div>
        ) : (
          <p className="text-center text-sm text-muted-foreground">
            {t(locale, 'drill.chooseAnswer')}
          </p>
        )}
      </Card>

      {celebrations ? <DrillFeedback result={feedback} /> : null}
    </div>
  );
}
