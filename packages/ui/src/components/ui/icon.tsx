import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bookmark,
  BookmarkCheck,
  BookOpen,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Circle,
  CircleCheck,
  Clock,
  Compass,
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
  GripVertical,
  Guitar,
  Headphones,
  Heart,
  Info,
  LayoutGrid,
  Library,
  ListMusic,
  LoaderCircle,
  Lock,
  LogIn,
  LogOut,
  type LucideProps,
  Menu,
  Mic,
  Moon,
  Music,
  Palette,
  PartyPopper,
  Pause,
  Pencil,
  Piano,
  Play,
  Plus,
  RefreshCw,
  Repeat,
  Search,
  Settings,
  Signpost,
  SkipBack,
  SlidersHorizontal,
  Sparkles,
  Square,
  Star,
  Sun,
  Trash2,
  TrendingUp,
  TriangleAlert,
  Upload,
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
  bookmark: Bookmark,
  'bookmark-check': BookmarkCheck,
  'book-open': BookOpen,
  calendar: Calendar,
  chart: BarChart3,
  check: Check,
  'chevron-down': ChevronDown,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  'chevron-up': ChevronUp,
  circle: Circle,
  'circle-check': CircleCheck,
  clock: Clock,
  compass: Compass,
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
  'grip-vertical': GripVertical,
  guitar: Guitar,
  headphones: Headphones,
  heart: Heart,
  info: Info,
  'layout-grid': LayoutGrid,
  library: Library,
  'list-music': ListMusic,
  loader: LoaderCircle,
  lock: Lock,
  'log-in': LogIn,
  'log-out': LogOut,
  menu: Menu,
  mic: Mic,
  moon: Moon,
  music: Music,
  palette: Palette,
  'party-popper': PartyPopper,
  pencil: Pencil,
  piano: Piano,
  pause: Pause,
  play: Play,
  plus: Plus,
  refresh: RefreshCw,
  repeat: Repeat,
  'skip-back': SkipBack,
  search: Search,
  settings: Settings,
  signpost: Signpost,
  sliders: SlidersHorizontal,
  sparkles: Sparkles,
  square: Square,
  star: Star,
  sun: Sun,
  trash: Trash2,
  'trending-up': TrendingUp,
  'alert-triangle': TriangleAlert,
  upload: Upload,
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
