import { type Locale, t } from '@TheY2T/tmr-i18n';
import { voicingsFor } from '@TheY2T/tmr-music-core/chord-voicings';
import { tuningFor } from '@TheY2T/tmr-music-core/embeds';
import {
  defaultInstrumentFor,
  type InstrumentFamily,
} from '@TheY2T/tmr-music-core/instrument-choice';
import {
  CHORDS,
  chordsByLevel,
  pitchName,
  ROOT_CHOICES,
} from '@TheY2T/tmr-music-core/music-theory';
import { buildPianoVoicings } from '@TheY2T/tmr-music-core/piano-voicings';
import { loadInstrument, playNote, setDefaultInstrument } from '@TheY2T/tmr-music-core/soundfont';
import { useLevel } from '@TheY2T/tmr-music-core/use-level';
import { DEFAULT_PAGE_SIZES, PaginationBar, usePagination } from '@TheY2T/tmr-ui';
import { Select } from '@TheY2T/tmr-ui/components/ui/select';
import { useEffect, useMemo, useState } from 'react';
import InstrumentLoading from './InstrumentLoading';
import LevelToggle from './LevelToggle';
import {
  ChordDiagram,
  type ChordShape,
  type Instrument,
  KeyboardChordDiagram,
} from './organisms/index';

type DictInstrument = Instrument | 'piano';

const INSTRUMENTS: { key: DictInstrument; label: string }[] = [
  { key: 'guitar', label: 'Guitar' },
  { key: 'ukulele', label: 'Ukulele' },
  { key: 'bass', label: 'Bass' },
  { key: 'piano', label: 'Piano' },
];

const familyFor = (i: DictInstrument): InstrumentFamily =>
  i === 'piano' ? 'piano' : i === 'bass' ? 'bass' : 'guitar';

const flatsFor = (pc: number) => [1, 3, 5, 8, 10].includes(pc);

/** One renderable voicing card: either a fretboard shape or a keyboard voicing. */
type VoicingCard =
  | {
      id: string;
      label: string;
      kind: 'fret';
      shape: ChordShape;
      frets: number[];
      tuning: number[];
    }
  | { id: string; label: string; kind: 'keyboard'; midis: number[]; flats: boolean };

function fretCards(root: number, quality: string, instrument: Instrument): VoicingCard[] {
  const tuning = tuningFor(instrument);
  return voicingsFor(root, quality, instrument).map((shape, i) => ({
    id: `${shape.name}-${i}`,
    label: (shape as ChordShape & { family?: string }).family ?? `Position ${i + 1}`,
    kind: 'fret',
    shape,
    frets: shape.frets,
    tuning,
  }));
}

function keyboardCards(root: number, intervals: number[]): VoicingCard[] {
  return buildPianoVoicings(60 + root, intervals).map((v) => ({
    id: v.key,
    label: v.name,
    kind: 'keyboard',
    midis: v.midis,
    flats: flatsFor(root),
  }));
}

/** All voicings for a single chord on the chosen instrument. */
function cardsFor(root: number, quality: string, instrument: DictInstrument): VoicingCard[] {
  if (instrument === 'piano') {
    const intervals = CHORDS.find((c) => c.key === quality)?.intervals ?? [0, 4, 7];
    return keyboardCards(root, intervals);
  }
  return fretCards(root, quality, instrument);
}

/** Sound a voicing: arpeggiate keyboard notes, or strum a fret shape low→high. */
function play(card: VoicingCard): void {
  if (card.kind === 'keyboard') {
    card.midis.forEach((midi, i) => window.setTimeout(() => playNote(midi, 1.1), i * 24));
    return;
  }
  let delay = 0;
  card.frets.forEach((fret, i) => {
    if (fret < 0) return;
    const midi = card.tuning[i]! + fret;
    window.setTimeout(() => playNote(midi, 1.1), delay);
    delay += 22;
  });
}

function VoicingTile({ card }: { card: VoicingCard }) {
  return (
    <button
      type="button"
      onClick={() => play(card)}
      className="flex flex-col items-center gap-1 rounded-lg border border-border p-3 transition-colors hover:bg-muted"
    >
      {card.kind === 'fret' ? (
        <ChordDiagram chord={card.shape} />
      ) : (
        <KeyboardChordDiagram midis={card.midis} flats={card.flats} label={card.label} />
      )}
      <span className="text-xs text-muted-foreground">
        {card.kind === 'fret' ? card.label : ''}
      </span>
    </button>
  );
}

interface ChordDictionaryProps {
  locale: Locale;
}

export default function ChordDictionary({ locale }: ChordDictionaryProps) {
  const { level, setLevel } = useLevel();
  const [instrument, setInstrument] = useState<DictInstrument>('guitar');
  const [rootFilter, setRootFilter] = useState<'all' | number>('all');
  const [qualityFilter, setQualityFilter] = useState<'all' | string>('all');
  const [ready, setReady] = useState(false);

  // Warm the sampled timbre for the current instrument family so the first strum never lags.
  const family = familyFor(instrument);
  useEffect(() => {
    const inst = defaultInstrumentFor(family);
    setDefaultInstrument(inst);
    let cancelled = false;
    setReady(false);
    loadInstrument(inst).then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [family]);

  const levelChords = chordsByLevel(level);
  const qualityKeys = levelChords.map((c) => c.key);
  // Keep the quality filter valid as the level narrows.
  useEffect(() => {
    if (qualityFilter !== 'all' && !qualityKeys.includes(qualityFilter)) setQualityFilter('all');
  }, [qualityKeys, qualityFilter]);

  const detail = rootFilter !== 'all' && qualityFilter !== 'all';

  // Browse mode: one representative card per (root × quality) chord that has a voicing.
  const browseCards = useMemo(() => {
    if (detail) return [];
    const roots = rootFilter === 'all' ? ROOT_CHOICES : [rootFilter];
    const qualities = qualityFilter === 'all' ? qualityKeys : [qualityFilter];
    const out: { key: string; name: string; card: VoicingCard }[] = [];
    for (const root of roots) {
      for (const quality of qualities) {
        const [first] = cardsFor(root, quality, instrument);
        if (!first) continue;
        const symbol = CHORDS.find((c) => c.key === quality)?.symbol ?? '';
        out.push({
          key: `${root}:${quality}`,
          name: `${pitchName(root, flatsFor(root))}${symbol}`,
          card: first,
        });
      }
    }
    return out;
  }, [detail, rootFilter, qualityFilter, qualityKeys, instrument]);

  const pager = usePagination(browseCards, {
    initialPageSize: 25,
    pageSizes: DEFAULT_PAGE_SIZES,
    resetKey: `${instrument}:${level}:${rootFilter}:${qualityFilter}`,
  });

  const detailCards = detail ? cardsFor(rootFilter as number, qualityFilter, instrument) : [];
  const detailName =
    detail &&
    `${pitchName(rootFilter as number, flatsFor(rootFilter as number))} ${
      CHORDS.find((c) => c.key === qualityFilter)?.name ?? ''
    }`;

  if (!ready) return <InstrumentLoading />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3">
        <label className="space-y-1 text-sm">
          <span className="block font-medium">Instrument</span>
          <Select
            value={instrument}
            onChange={(e) => setInstrument(e.target.value as DictInstrument)}
            className="h-auto w-auto px-2 py-1"
          >
            {INSTRUMENTS.map((i) => (
              <option key={i.key} value={i.key}>
                {i.label}
              </option>
            ))}
          </Select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="block font-medium">Root</span>
          <Select
            value={String(rootFilter)}
            onChange={(e) =>
              setRootFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))
            }
            className="h-auto w-auto px-2 py-1"
          >
            <option value="all">All roots</option>
            {ROOT_CHOICES.map((pc) => (
              <option key={pc} value={pc}>
                {pitchName(pc)}
              </option>
            ))}
          </Select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="block font-medium" data-help="chords">
            Chord type
          </span>
          <Select
            value={qualityFilter}
            onChange={(e) => setQualityFilter(e.target.value)}
            className="h-auto w-auto px-2 py-1"
          >
            <option value="all">All types</option>
            {levelChords.map((c) => (
              <option key={c.key} value={c.key}>
                {c.name}
              </option>
            ))}
          </Select>
        </label>
        <LevelToggle level={level} onChange={setLevel} />
      </div>

      {detail ? (
        <div className="space-y-3">
          <h2 className="font-display text-lg">{detailName}</h2>
          {detailCards.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {detailCards.map((card) => (
                <VoicingTile key={card.id} card={card} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No voicing catalogued for this chord on{' '}
              {INSTRUMENTS.find((i) => i.key === instrument)?.label}.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {pager.pageItems.map((entry) => (
              <div key={entry.key} className="flex flex-col items-center gap-1">
                <span className="font-semibold">{entry.name}</span>
                <VoicingTile card={entry.card} />
              </div>
            ))}
          </div>
          <PaginationBar
            page={pager.page}
            pageCount={pager.pageCount}
            pageSize={pager.pageSize}
            pageSizes={pager.pageSizes}
            rangeFrom={pager.rangeFrom}
            rangeTo={pager.rangeTo}
            total={pager.total}
            onPageChange={pager.setPage}
            onPageSizeChange={pager.setPageSize}
            perPageLabel={t(locale, 'common.perPage')}
            showingLabel={t(locale, 'common.showing', {
              from: pager.rangeFrom,
              to: pager.rangeTo,
              total: pager.total,
            })}
            prevLabel={t(locale, 'common.prev')}
            nextLabel={t(locale, 'common.next')}
          />
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Pick an instrument and browse every chord, or choose a root and type to see all its
        voicings. Fretted diagrams show finger numbers and barres; keyboard diagrams show each
        inversion. Tap any diagram to hear it.
      </p>
    </div>
  );
}
