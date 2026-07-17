// @TheY2T/tmr-ui — atomic-design component library barrel.
// Atoms (shadcn primitives) + molecules. Music organisms are exported separately from
// "@TheY2T/tmr-ui/music"; structural Astro components from "@TheY2T/tmr-ui/astro/*".

// Molecules
export {
  type ActiveFilterItem,
  ActiveFilters,
  type ActiveFiltersProps,
} from './components/molecules/active-filters';
export { CardGrid, type CardGridProps } from './components/molecules/card-grid';
export { Chip, type ChipProps, chipVariants } from './components/molecules/chip';
export {
  CoverArt,
  type CoverArtMotif,
  type CoverArtProps,
} from './components/molecules/cover-art';
export { EmptyState, type EmptyStateProps } from './components/molecules/empty-state';
export {
  type FacetGroup,
  type FacetOption,
  FacetPanel,
  type FacetPanelProps,
} from './components/molecules/facet-panel';
export { FeaturedShelf, type FeaturedShelfProps } from './components/molecules/featured-shelf';
export { Field, type FieldProps } from './components/molecules/field';
export { FormActions, type FormActionsProps } from './components/molecules/form-actions';
export { Hero, type HeroProps } from './components/molecules/hero';
export { MediaCard, type MediaCardProps } from './components/molecules/media-card';
export { PageHeader, type PageHeaderProps } from './components/molecules/page-header';
export { SearchField, type SearchFieldProps } from './components/molecules/search-field';
export {
  SegmentedToggle,
  type SegmentedToggleOption,
  type SegmentedToggleProps,
} from './components/molecules/segmented-toggle';
export { StarRating, type StarRatingProps } from './components/molecules/star-rating';
export { StatCard, type StatCardProps } from './components/molecules/stat-card';
export { StatTile, type StatTileProps } from './components/molecules/stat-tile';
// Atoms
export {
  Accordion,
  AccordionContent,
  AccordionItem,
  type AccordionItemProps,
  type AccordionProps,
  AccordionTrigger,
} from './components/ui/accordion';
export {
  Avatar,
  AvatarFallback,
  AvatarImage,
  type AvatarImageProps,
} from './components/ui/avatar';
export { Badge, type BadgeProps, badgeVariants } from './components/ui/badge';
export {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from './components/ui/breadcrumb';
export { Button, type ButtonProps, buttonVariants } from './components/ui/button';
export {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './components/ui/card';
export { Checkbox, type CheckboxProps } from './components/ui/checkbox';
export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  type DialogProps,
  DialogTitle,
} from './components/ui/dialog';
export {
  DropdownMenu,
  DropdownMenuContent,
  type DropdownMenuContentProps,
  DropdownMenuItem,
  type DropdownMenuItemProps,
  DropdownMenuLabel,
  type DropdownMenuProps,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './components/ui/dropdown-menu';
export { Icon, type IconName, type IconProps } from './components/ui/icon';
export { Input, type InputProps } from './components/ui/input';
export { Label, type LabelProps } from './components/ui/label';
export { Pagination, type PaginationProps } from './components/ui/pagination';
export { Progress, type ProgressProps } from './components/ui/progress';
export { Select, type SelectProps } from './components/ui/select';
export { Separator, type SeparatorProps } from './components/ui/separator';
export {
  Sheet,
  SheetClose,
  SheetContent,
  type SheetContentProps,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  type SheetProps,
  SheetTitle,
} from './components/ui/sheet';
export { Skeleton } from './components/ui/skeleton';
export { Slider, type SliderProps } from './components/ui/slider';
export {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from './components/ui/table';
export {
  Tabs,
  TabsContent,
  type TabsContentProps,
  TabsList,
  type TabsProps,
  TabsTrigger,
  type TabsTriggerProps,
} from './components/ui/tabs';
export { Textarea, type TextareaProps } from './components/ui/textarea';
export { Toaster, toast } from './components/ui/toast';
export { Tooltip, type TooltipProps } from './components/ui/tooltip';
export { cn } from './lib/utils';
