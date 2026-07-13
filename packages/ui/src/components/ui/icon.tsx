import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpen,
  Calendar,
  Check,
  ChevronDown,
  ChevronRight,
  CircleCheck,
  Clock,
  Crown,
  Disc3,
  Download,
  ExternalLink,
  Filter,
  Flame,
  Folder,
  Gauge,
  Globe,
  GraduationCap,
  Guitar,
  Headphones,
  Heart,
  Info,
  LayoutGrid,
  Library,
  ListMusic,
  Lock,
  LogIn,
  LogOut,
  type LucideProps,
  Menu,
  Moon,
  Music,
  Palette,
  PartyPopper,
  Pencil,
  Piano,
  Play,
  Plus,
  RefreshCw,
  Search,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Square,
  Star,
  Sun,
  Trash2,
  TriangleAlert,
  User,
  Users,
  Volume2,
  Wrench,
  X,
} from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * Curated icon registry (Lucide). Direct named imports so only registered icons ship — a
 * `import * as` / dynamic-by-name lookup would defeat tree-shaking and pull the whole library.
 * To add an icon: import it from `lucide-react` and add a kebab-case entry here (ADR 0019).
 */
const registry = {
  'arrow-left': ArrowLeft,
  'arrow-right': ArrowRight,
  'book-open': BookOpen,
  calendar: Calendar,
  chart: BarChart3,
  check: Check,
  'chevron-down': ChevronDown,
  'chevron-right': ChevronRight,
  'circle-check': CircleCheck,
  clock: Clock,
  crown: Crown,
  disc: Disc3,
  download: Download,
  'external-link': ExternalLink,
  filter: Filter,
  flame: Flame,
  folder: Folder,
  gauge: Gauge,
  globe: Globe,
  'graduation-cap': GraduationCap,
  guitar: Guitar,
  headphones: Headphones,
  heart: Heart,
  info: Info,
  'layout-grid': LayoutGrid,
  library: Library,
  'list-music': ListMusic,
  lock: Lock,
  'log-in': LogIn,
  'log-out': LogOut,
  menu: Menu,
  moon: Moon,
  music: Music,
  palette: Palette,
  'party-popper': PartyPopper,
  pencil: Pencil,
  piano: Piano,
  play: Play,
  plus: Plus,
  refresh: RefreshCw,
  search: Search,
  settings: Settings,
  sliders: SlidersHorizontal,
  sparkles: Sparkles,
  square: Square,
  star: Star,
  sun: Sun,
  trash: Trash2,
  'alert-triangle': TriangleAlert,
  user: User,
  users: Users,
  volume: Volume2,
  wrench: Wrench,
  x: X,
} as const;

export type IconName = keyof typeof registry;

export interface IconProps extends Omit<LucideProps, 'ref'> {
  /** Registered icon name (see the registry above). */
  name: IconName;
  /**
   * Already-localized accessible name. Omit for decorative icons (the common case) — the icon is
   * then hidden from assistive tech. Pass a translated string (from the app's `t()`, never inside
   * the library) only when the icon carries meaning on its own. ADR 0017 / ADR 0019.
   */
  label?: string;
}

/**
 * The single sanctioned way to render an icon in React islands. Size + color via Tailwind on
 * `className` (`size-4`, `text-muted-foreground`); Lucide uses `currentColor` so `text-*` just works.
 */
export function Icon({ name, label, className, ...props }: IconProps) {
  const Glyph = registry[name];
  return (
    <Glyph
      className={cn('shrink-0', className)}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? 'img' : undefined}
      focusable="false"
      {...props}
    />
  );
}
