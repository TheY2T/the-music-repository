// @TheY2T/tmr-ui — atomic-design component library barrel.
// Atoms (shadcn primitives) + molecules. Music organisms are exported separately from
// "@TheY2T/tmr-ui/music"; structural Astro components from "@TheY2T/tmr-ui/astro/*".

export { CardGrid, type CardGridProps } from './components/molecules/card-grid';
export { Chip, type ChipProps, chipVariants } from './components/molecules/chip';
export { EmptyState, type EmptyStateProps } from './components/molecules/empty-state';
// Molecules
export { Field, type FieldProps } from './components/molecules/field';
export { FormActions, type FormActionsProps } from './components/molecules/form-actions';
export { PageHeader, type PageHeaderProps } from './components/molecules/page-header';
export { SearchField, type SearchFieldProps } from './components/molecules/search-field';
export {
  SegmentedToggle,
  type SegmentedToggleOption,
  type SegmentedToggleProps,
} from './components/molecules/segmented-toggle';
export { StatCard, type StatCardProps } from './components/molecules/stat-card';
export { Badge, type BadgeProps, badgeVariants } from './components/ui/badge';
// Atoms
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
export { Input, type InputProps } from './components/ui/input';
export { Label, type LabelProps } from './components/ui/label';
export { Progress, type ProgressProps } from './components/ui/progress';
export { Select, type SelectProps } from './components/ui/select';
export { Separator, type SeparatorProps } from './components/ui/separator';
export { Textarea, type TextareaProps } from './components/ui/textarea';
export { cn } from './lib/utils';
