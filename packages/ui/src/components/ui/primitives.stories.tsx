import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { DEFAULT_PAGE_SIZES } from '../../hooks/use-pagination';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './accordion';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from './breadcrumb';
import { Button } from './button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './dropdown-menu';
import { Pagination } from './pagination';
import { PaginationBar } from './pagination-bar';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from './sheet';
import { Skeleton } from './skeleton';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { Toaster, toast } from './toast';
import { Tooltip } from './tooltip';

const meta: Meta = {
  title: 'Primitives',
};
export default meta;

type Story = StoryObj;

export const DialogStory: Story = {
  name: 'Dialog',
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open dialog</Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete progression?</DialogTitle>
              <DialogDescription>This action cannot be undone.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose className="h-10 border border-border px-4">Cancel</DialogClose>
              <Button variant="destructive" onClick={() => setOpen(false)}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  },
};

export const SheetStory: Story = {
  name: 'Sheet',
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open sheet</Button>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="left">
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
              <SheetDescription>Mobile navigation drawer.</SheetDescription>
            </SheetHeader>
            <nav className="flex flex-col gap-2 text-sm">
              <a href="#catalogue">Catalogue</a>
              <a href="#practice">Practice</a>
            </nav>
            <SheetClose className="mt-auto h-10 border border-border">Close</SheetClose>
          </SheetContent>
        </Sheet>
      </>
    );
  },
};

export const TabsStory: Story = {
  name: 'Tabs',
  render: () => (
    <Tabs defaultValue="piano" className="max-w-sm">
      <TabsList>
        <TabsTrigger value="piano">Piano</TabsTrigger>
        <TabsTrigger value="guitar">Guitar</TabsTrigger>
      </TabsList>
      <TabsContent value="piano">Piano lessons and repertoire.</TabsContent>
      <TabsContent value="guitar">Guitar lessons and repertoire.</TabsContent>
    </Tabs>
  ),
};

export const DropdownMenuStory: Story = {
  name: 'DropdownMenu',
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger className="h-10 rounded-md border border-border px-4 text-sm">
        Account
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>My account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => {}}>Profile</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => {}}>Settings</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => {}}>Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
};

export const TooltipStory: Story = {
  name: 'Tooltip',
  render: () => (
    <Tooltip content="Add to favourites">
      <Button variant="outline">Hover me</Button>
    </Tooltip>
  ),
};

export const ToastStory: Story = {
  name: 'Toast',
  render: () => (
    <div className="flex gap-3">
      <Button onClick={() => toast.success('Saved')}>Success</Button>
      <Button variant="destructive" onClick={() => toast.error('Something failed')}>
        Error
      </Button>
      <Button variant="outline" onClick={() => toast('Heads up')}>
        Default
      </Button>
      <Toaster />
    </div>
  ),
};

export const AccordionStory: Story = {
  name: 'Accordion',
  render: () => (
    <Accordion type="single" defaultValue={['what']} className="max-w-md">
      <AccordionItem value="what">
        <AccordionTrigger>What is this?</AccordionTrigger>
        <AccordionContent>A music-learning catalogue.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="cost">
        <AccordionTrigger>How much does it cost?</AccordionTrigger>
        <AccordionContent>Core content is free.</AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

export const AvatarStory: Story = {
  name: 'Avatar',
  render: () => (
    <div className="flex items-center gap-3">
      <Avatar>
        <AvatarImage src="https://invalid.example/none.png" alt="" />
        <AvatarFallback>MR</AvatarFallback>
      </Avatar>
      <Avatar className="size-14">
        <AvatarFallback>JS</AvatarFallback>
      </Avatar>
    </div>
  ),
};

export const SkeletonStory: Story = {
  name: 'Skeleton',
  render: () => (
    <div className="flex max-w-sm flex-col gap-2">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  ),
};

export const BreadcrumbStory: Story = {
  name: 'Breadcrumb',
  render: () => (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="#home">Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="#piano">Piano</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Für Elise</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  ),
};

export const PaginationStory: Story = {
  name: 'Pagination',
  render: () => {
    const [page, setPage] = useState(3);
    return <Pagination page={page} pageCount={12} onPageChange={setPage} />;
  },
};

export const PaginationBarStory: Story = {
  name: 'PaginationBar',
  render: () => {
    const total = 237;
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const pageCount = Math.max(1, Math.ceil(total / pageSize));
    const clampedPage = Math.min(page, pageCount);
    return (
      <PaginationBar
        page={clampedPage}
        pageCount={pageCount}
        pageSize={pageSize}
        pageSizes={DEFAULT_PAGE_SIZES}
        rangeFrom={(clampedPage - 1) * pageSize + 1}
        rangeTo={Math.min(clampedPage * pageSize, total)}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
        perPageLabel="Per page"
        showingLabel={`Showing ${(clampedPage - 1) * pageSize + 1}–${Math.min(clampedPage * pageSize, total)} of ${total}`}
      />
    );
  },
};

export const TableStory: Story = {
  name: 'Table',
  render: () => (
    <Table>
      <TableCaption>Recently added pieces.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Instrument</TableHead>
          <TableHead>Level</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Für Elise</TableCell>
          <TableCell>Piano</TableCell>
          <TableCell>Intermediate</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Romanza</TableCell>
          <TableCell>Guitar</TableCell>
          <TableCell>Beginner</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
};
