import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  ActiveFilters,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  buttonVariants,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardGrid,
  CardHeader,
  CardTitle,
  cn,
  DEFAULT_PAGE_SIZES,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  FacetPanel,
  FeaturedShelf,
  Field,
  FormActions,
  Input,
  MediaCard,
  PaginationBar,
  SegmentedToggle,
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Toaster,
  ToolStage,
  Tooltip,
  toast,
  usePagination,
} from '@TheY2T/tmr-ui';
import { useState } from 'react';

// Pre-composed showcases for compound components — the ones whose real shape is a tree of sub-parts or
// requires wiring (controlled open state, render props, pagination). Simple atoms/molecules are loaded
// straight from the barrel with playground controls instead.

export function CardExample() {
  return (
    <Card className="max-w-sm">
      <CardHeader>
        <CardTitle>Nocturne in E-flat</CardTitle>
        <CardDescription>Frédéric Chopin · Op. 9 No. 2</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        A lyrical study in rubato and ornamentation, ideal for developing an expressive right hand.
      </CardContent>
      <CardFooter>
        <Button size="sm">Open score</Button>
      </CardFooter>
    </Card>
  );
}

export function AccordionExample() {
  return (
    <Accordion type="single" defaultValue={['a']} className="max-w-md">
      <AccordionItem value="a">
        <AccordionTrigger>What is a major scale?</AccordionTrigger>
        <AccordionContent>Seven notes following the pattern W–W–H–W–W–W–H.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="b">
        <AccordionTrigger>What is a mode?</AccordionTrigger>
        <AccordionContent>
          A scale that starts on a different degree of a parent scale.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

export function BreadcrumbExample() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="#">Catalogue</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="#">Piano</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Nocturne</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export function AvatarExample() {
  return (
    <div className="flex items-center gap-3">
      <Avatar>
        <AvatarImage src="" alt="" />
        <AvatarFallback>MR</AvatarFallback>
      </Avatar>
      <span className="text-sm text-muted-foreground">Avatar with fallback initials</span>
    </div>
  );
}

export function DialogExample() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open dialog</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save progression?</DialogTitle>
            <DialogDescription>Store this chord progression to your library.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose className={cn(buttonVariants({ variant: 'outline' }))}>Cancel</DialogClose>
            <Button onClick={() => setOpen(false)}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function SheetExample() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open sheet</Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
            <SheetDescription>Refine the catalogue.</SheetDescription>
          </SheetHeader>
          <SheetFooter>
            <SheetClose className={cn(buttonVariants({ variant: 'outline' }))}>Done</SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}

export function DropdownMenuExample() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={cn(buttonVariants({ variant: 'outline' }))}>
        Account
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>My account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Dashboard</DropdownMenuItem>
        <DropdownMenuItem>Settings</DropdownMenuItem>
        <DropdownMenuItem>Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function TooltipExample() {
  return (
    <Tooltip content="Play the note">
      <Button variant="outline">Hover me</Button>
    </Tooltip>
  );
}

export function TabsExample() {
  return (
    <Tabs defaultValue="notes" className="max-w-md">
      <TabsList>
        <TabsTrigger value="notes">Notes</TabsTrigger>
        <TabsTrigger value="chords">Chords</TabsTrigger>
        <TabsTrigger value="scales">Scales</TabsTrigger>
      </TabsList>
      <TabsContent value="notes">The twelve pitches of the chromatic scale.</TabsContent>
      <TabsContent value="chords">Stacked thirds forming triads and sevenths.</TabsContent>
      <TabsContent value="scales">Ordered sequences of notes within an octave.</TabsContent>
    </Tabs>
  );
}

export function TableExample() {
  const rows = [
    { note: 'C', freq: '261.6 Hz' },
    { note: 'E', freq: '329.6 Hz' },
    { note: 'G', freq: '392.0 Hz' },
  ];
  return (
    <Table>
      <TableCaption>C major triad frequencies</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Note</TableHead>
          <TableHead>Frequency</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.note}>
            <TableCell>{r.note}</TableCell>
            <TableCell>{r.freq}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function SegmentedToggleExample() {
  const [value, setValue] = useState('beginner');
  return (
    <SegmentedToggle
      value={value}
      onValueChange={setValue}
      options={[
        { value: 'beginner', label: 'Beginner' },
        { value: 'intermediate', label: 'Intermediate' },
        { value: 'advanced', label: 'Advanced' },
      ]}
    />
  );
}

export function FacetPanelExample() {
  const [selected, setSelected] = useState<Record<string, string[]>>({ instrument: ['piano'] });
  const toggle = (group: string, value: string) =>
    setSelected((prev) => {
      const cur = prev[group] ?? [];
      return {
        ...prev,
        [group]: cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value],
      };
    });
  const groups = [
    {
      key: 'instrument',
      label: 'Instrument',
      options: [
        {
          value: 'piano',
          label: 'Piano',
          count: 42,
          selected: (selected.instrument ?? []).includes('piano'),
        },
        {
          value: 'guitar',
          label: 'Guitar',
          count: 31,
          selected: (selected.instrument ?? []).includes('guitar'),
        },
      ],
    },
    {
      key: 'era',
      label: 'Era',
      options: [
        {
          value: 'baroque',
          label: 'Baroque',
          count: 12,
          selected: (selected.era ?? []).includes('baroque'),
        },
        {
          value: 'romantic',
          label: 'Romantic',
          count: 18,
          selected: (selected.era ?? []).includes('romantic'),
        },
      ],
    },
  ];
  return <FacetPanel groups={groups} onToggle={toggle} className="max-w-xs" />;
}

export function ActiveFiltersExample() {
  const [filters, setFilters] = useState(['Piano', 'Romantic', 'Beginner']);
  return (
    <ActiveFilters
      filters={filters.map((label) => ({
        key: label,
        label,
        onRemove: () => setFilters((f) => f.filter((x) => x !== label)),
      }))}
      onClear={() => setFilters([])}
      clearLabel="Clear all"
    />
  );
}

export function CardGridExample() {
  const items = ['Nocturne', 'Prelude', 'Étude', 'Waltz', 'Mazurka', 'Ballade'];
  return (
    <CardGrid columns={3}>
      {items.map((title) => (
        <MediaCard
          key={title}
          title={title}
          href="#"
          summary="Chopin"
          seed={title}
          typeLabel="Score"
        />
      ))}
    </CardGrid>
  );
}

export function FeaturedShelfExample() {
  return (
    <FeaturedShelf title="Featured this week" action={<Button variant="link">See all</Button>}>
      <div className="grid grid-cols-3 gap-3">
        {['Bach', 'Chopin', 'Debussy'].map((t) => (
          <MediaCard key={t} title={t} href="#" seed={t} typeLabel="Composer" />
        ))}
      </div>
    </FeaturedShelf>
  );
}

export function FieldExample() {
  return (
    <Field label="Tempo (BPM)" description="Between 40 and 208." htmlFor="tempo" required>
      <Input id="tempo" defaultValue="120" className="w-40" />
    </Field>
  );
}

export function FormActionsExample() {
  return (
    <FormActions>
      <Button variant="outline">Cancel</Button>
      <Button>Save</Button>
    </FormActions>
  );
}

export function ToolStageExample() {
  return (
    <ToolStage enterLabel="Fullscreen" exitLabel="Exit fullscreen">
      {({ modeButtons }) => (
        <div className="space-y-3">
          <div className="flex justify-end">{modeButtons}</div>
          <div className="grid h-40 place-items-center rounded-md border border-border bg-card text-muted-foreground">
            Tool content sits here
          </div>
        </div>
      )}
    </ToolStage>
  );
}

export function PaginationBarExample() {
  const items = Array.from({ length: 137 }, (_, i) => i);
  const { page, pageSize, pageCount, rangeFrom, rangeTo, setPage, setPageSize } =
    usePagination(items);
  return (
    <PaginationBar
      page={page}
      pageCount={pageCount}
      pageSize={pageSize}
      pageSizes={DEFAULT_PAGE_SIZES}
      rangeFrom={rangeFrom}
      rangeTo={rangeTo}
      total={items.length}
      onPageChange={setPage}
      onPageSizeChange={setPageSize}
      perPageLabel="Per page"
      showingLabel={`Showing ${rangeFrom}–${rangeTo} of ${items.length}`}
      prevLabel="Prev"
      nextLabel="Next"
    />
  );
}

export function ToasterExample() {
  return (
    <div>
      <Button onClick={() => toast.success('Saved — your progression was stored.')}>
        Show toast
      </Button>
      <Toaster />
    </div>
  );
}
