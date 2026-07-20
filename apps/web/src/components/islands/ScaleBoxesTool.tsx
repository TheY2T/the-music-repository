import ScaleBoxes from '@TheY2T/tmr-musickit-ui/ScaleBoxes';
import { AppProviders } from '@/components/providers/AppProviders';

/** The standalone scale-boxes tool, wrapped with the app providers so the grid honours the saved guitar
 *  handedness preference. Account sync runs only when the customization feature is enabled. */
export default function ScaleBoxesTool({
  authenticated,
  customization,
}: {
  authenticated: boolean;
  customization: boolean;
}) {
  return (
    <AppProviders authenticated={authenticated && customization}>
      <ScaleBoxes />
    </AppProviders>
  );
}
