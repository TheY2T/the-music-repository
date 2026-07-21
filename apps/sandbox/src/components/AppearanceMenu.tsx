import ThemeSwitcher from '@TheY2T/tmr-common-ui/ThemeSwitcher';
import {
  buttonVariants,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  Icon,
} from '@TheY2T/tmr-ui';
import type { Locale } from '@TheY2T/tmr-web-acl';

/**
 * Top-bar appearance control: the shared `ThemeSwitcher` (all three aesthetics × light/dark) in a
 * dropdown, so testers can re-theme every specimen from one place. Mutations land on `<html>`, which the
 * design tokens key off.
 */
export default function AppearanceMenu({ locale }: { locale: Locale }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
        <Icon name="palette" className="size-4" /> Appearance
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 p-3">
        <ThemeSwitcher locale={locale} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
