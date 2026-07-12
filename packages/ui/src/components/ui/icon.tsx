import {
  ArrowLeft,
  ArrowRight,
  Check,
  Flame,
  Heart,
  Lock,
  type LucideProps,
  Music,
  PartyPopper,
  Piano,
  Play,
  RefreshCw,
  Search,
  Square,
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
  check: Check,
  flame: Flame,
  heart: Heart,
  lock: Lock,
  music: Music,
  'party-popper': PartyPopper,
  piano: Piano,
  play: Play,
  refresh: RefreshCw,
  search: Search,
  square: Square,
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
