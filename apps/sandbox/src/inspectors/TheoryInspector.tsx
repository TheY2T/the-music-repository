import {
  CHORDS,
  CIRCLE_OF_FIFTHS,
  INTERVAL_NAMES,
  LEVELS,
  MODES,
  SCALES,
} from '@TheY2T/tmr-music-core/music-theory';
import {
  Badge,
  DEFAULT_PAGE_SIZES,
  PaginationBar,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  usePagination,
} from '@TheY2T/tmr-ui';
import type { ReactNode } from 'react';

interface Column<T> {
  header: string;
  cell: (row: T) => ReactNode;
}

function PaginatedTable<T>({ rows, columns }: { rows: readonly T[]; columns: Column<T>[] }) {
  const { page, pageSize, pageCount, pageItems, rangeFrom, rangeTo, setPage, setPageSize } =
    usePagination(rows as T[], { initialPageSize: 10 });
  return (
    <div className="space-y-3">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((c) => (
              <TableHead key={c.header}>{c.header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageItems.map((row) => (
            <TableRow key={JSON.stringify(row)}>
              {columns.map((c) => (
                <TableCell key={c.header}>{c.cell(row)}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <PaginationBar
        page={page}
        pageCount={pageCount}
        pageSize={pageSize}
        pageSizes={DEFAULT_PAGE_SIZES}
        rangeFrom={rangeFrom}
        rangeTo={rangeTo}
        total={rows.length}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        perPageLabel="Per page"
        showingLabel={`Showing ${rangeFrom}–${rangeTo} of ${rows.length}`}
        prevLabel="Prev"
        nextLabel="Next"
      />
    </div>
  );
}

const semitones = (intervals: number[]) => intervals.join(' · ');

/** Browsable view of the music-theory single source of truth (`@TheY2T/tmr-music-core/music-theory`). */
export default function TheoryInspector() {
  return (
    <Tabs defaultValue="scales">
      <TabsList>
        <TabsTrigger value="scales">Scales ({SCALES.length})</TabsTrigger>
        <TabsTrigger value="chords">Chords ({CHORDS.length})</TabsTrigger>
        <TabsTrigger value="modes">Modes ({MODES.length})</TabsTrigger>
        <TabsTrigger value="intervals">Intervals</TabsTrigger>
        <TabsTrigger value="circle">Circle of 5ths</TabsTrigger>
      </TabsList>

      <TabsContent value="scales">
        <PaginatedTable
          rows={SCALES}
          columns={[
            { header: 'Name', cell: (s) => s.name },
            {
              header: 'Intervals',
              cell: (s) => <span className="font-mono text-xs">{semitones(s.intervals)}</span>,
            },
            { header: 'Level', cell: (s) => <Badge variant="secondary">{s.level}</Badge> },
          ]}
        />
      </TabsContent>
      <TabsContent value="chords">
        <PaginatedTable
          rows={CHORDS}
          columns={[
            { header: 'Name', cell: (c) => c.name },
            {
              header: 'Intervals',
              cell: (c) => <span className="font-mono text-xs">{semitones(c.intervals)}</span>,
            },
          ]}
        />
      </TabsContent>
      <TabsContent value="modes">
        <PaginatedTable
          rows={MODES}
          columns={[
            { header: 'Name', cell: (m) => m.name },
            {
              header: 'Intervals',
              cell: (m) => <span className="font-mono text-xs">{semitones(m.intervals)}</span>,
            },
            { header: 'Characteristic', cell: (m) => m.characteristic },
          ]}
        />
      </TabsContent>
      <TabsContent value="intervals">
        <PaginatedTable
          rows={INTERVAL_NAMES.map((name, i) => ({ name, semis: i }))}
          columns={[
            { header: 'Semitones', cell: (r) => <span className="font-mono">{r.semis}</span> },
            { header: 'Name', cell: (r) => r.name },
          ]}
        />
      </TabsContent>
      <TabsContent value="circle">
        <PaginatedTable
          rows={CIRCLE_OF_FIFTHS}
          columns={[
            { header: 'Major', cell: (e) => e.major },
            { header: 'Relative minor', cell: (e) => e.relativeMinor },
            {
              header: 'Accidentals',
              cell: (e) => <span className="font-mono">{e.accidentals}</span>,
            },
          ]}
        />
      </TabsContent>

      <p className="mt-3 text-xs text-muted-foreground">Levels: {LEVELS.join(' · ')}</p>
    </Tabs>
  );
}
