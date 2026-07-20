import type { Locale } from '@TheY2T/tmr-i18n';
import GuitarFretboard from '@TheY2T/tmr-musickit-ui/GuitarFretboard';
import { AppProviders } from '@/components/providers/AppProviders';

interface GuitarFretboardToolProps {
  locale: Locale;
  /** Shows the skin/handedness/fullscreen controls + syncs saved preferences. */
  customization: boolean;
  /** Whether a user is signed in (drives account-synced preferences). */
  authenticated: boolean;
}

/** The standalone fretboard tool: the shared island wrapped with the app providers so it can read + sync
 *  instrument preferences (skin/handedness/fullscreen). */
export default function GuitarFretboardTool({
  locale,
  customization,
  authenticated,
}: GuitarFretboardToolProps) {
  return (
    <AppProviders authenticated={authenticated && customization}>
      <GuitarFretboard locale={locale} customization={customization} />
    </AppProviders>
  );
}
