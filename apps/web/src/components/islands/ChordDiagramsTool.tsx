import ChordDiagrams from '@TheY2T/tmr-musickit-ui/ChordDiagrams';
import { AppProviders } from '@/components/providers/AppProviders';

/** The standalone chord-diagram tool, wrapped with the app providers so its diagrams honour the saved
 *  guitar handedness preference. Account sync runs only when the customization feature is enabled. */
export default function ChordDiagramsTool({
  authenticated,
  customization,
}: {
  authenticated: boolean;
  customization: boolean;
}) {
  return (
    <AppProviders authenticated={authenticated && customization}>
      <ChordDiagrams />
    </AppProviders>
  );
}
