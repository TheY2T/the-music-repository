import {
  instrumentStatus,
  isSampled,
  loadInstrument,
  playNote,
  SOUNDFONT_INSTRUMENTS,
  type SoundfontStatus,
} from '@TheY2T/tmr-music-core/soundfont';
import {
  Badge,
  Button,
  DEFAULT_PAGE_SIZES,
  PaginationBar,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  usePagination,
} from '@TheY2T/tmr-ui';
import { useState } from 'react';

const STATUS_VARIANT: Record<SoundfontStatus, 'success' | 'info' | 'warning' | 'secondary'> = {
  sampled: 'success',
  loading: 'info',
  fallback: 'warning',
  idle: 'secondary',
};

/**
 * The sampled-first note service: each General-MIDI instrument with its load status (sampled samples vs.
 * the oscillator fallback). Load an instrument to fetch its samples, then play a middle C through it.
 */
const INSTRUMENTS = [...SOUNDFONT_INSTRUMENTS];

export default function SoundfontInspector() {
  const [, force] = useState(0);
  const rerender = () => force((n) => n + 1);
  const { page, pageSize, pageCount, pageItems, rangeFrom, rangeTo, setPage, setPageSize } =
    usePagination(INSTRUMENTS, { initialPageSize: 25 });

  async function load(name: string) {
    rerender();
    await loadInstrument(name);
    rerender();
  }

  return (
    <div className="space-y-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Instrument</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageItems.map((inst) => {
            const status = instrumentStatus(inst.name);
            return (
              <TableRow key={inst.name}>
                <TableCell>
                  <span className="font-medium">{inst.label}</span>
                  <span className="ml-2 font-mono text-xs text-muted-foreground">{inst.name}</span>
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[status]}>{status}</Badge>
                  {isSampled(inst.name) && (
                    <span className="ml-2 text-xs text-muted-foreground">sampled</span>
                  )}
                </TableCell>
                <TableCell className="space-x-2 text-right">
                  <Button size="sm" variant="outline" onClick={() => void load(inst.name)}>
                    Load
                  </Button>
                  <Button size="sm" onClick={() => playNote(60, 1, { instrument: inst.name })}>
                    Play C4
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <PaginationBar
        page={page}
        pageCount={pageCount}
        pageSize={pageSize}
        pageSizes={DEFAULT_PAGE_SIZES}
        rangeFrom={rangeFrom}
        rangeTo={rangeTo}
        total={INSTRUMENTS.length}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        perPageLabel="Per page"
        showingLabel={`Showing ${rangeFrom}–${rangeTo} of ${INSTRUMENTS.length}`}
        prevLabel="Prev"
        nextLabel="Next"
      />
    </div>
  );
}
