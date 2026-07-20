import type { Locale } from '@TheY2T/tmr-i18n';
import PianoKeyboard from '@TheY2T/tmr-musickit-ui/PianoKeyboard';
import { AppProviders } from '@/components/providers/AppProviders';

interface PianoKeyboardToolProps {
  locale: Locale;
  /** Shows the skin/fullscreen controls + syncs saved preferences. */
  customization: boolean;
  /** Whether a user is signed in (drives account-synced preferences). */
  authenticated: boolean;
  scaleHighlight?: boolean;
  instruments?: boolean;
}

/** The standalone keyboard tool: the shared island wrapped with the app providers so it can read + sync
 *  instrument preferences (skin/fullscreen). */
export default function PianoKeyboardTool({
  locale,
  customization,
  authenticated,
  scaleHighlight,
  instruments,
}: PianoKeyboardToolProps) {
  return (
    <AppProviders authenticated={authenticated && customization}>
      <PianoKeyboard
        locale={locale}
        customization={customization}
        scaleHighlight={scaleHighlight}
        instruments={instruments}
      />
    </AppProviders>
  );
}
