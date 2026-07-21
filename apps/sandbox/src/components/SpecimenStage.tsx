import { Card } from '@TheY2T/tmr-ui';
import type { Locale } from '@TheY2T/tmr-web-acl';
import {
  Component,
  type ComponentType,
  lazy,
  type ReactNode,
  Suspense,
  useMemo,
  useState,
} from 'react';
import { getSpecimen, initialProps } from '@/registry';
import type { InspectorId } from '@/registry/types';
import ControlsPanel from './ControlsPanel';
import { SandboxProviders } from './SandboxProviders';

const INSPECTORS: Record<InspectorId, ComponentType<{ locale: Locale }>> = {
  audio: lazy(() => import('@/inspectors/AudioInspector')),
  soundfont: lazy(() => import('@/inspectors/SoundfontInspector')),
  theory: lazy(() => import('@/inspectors/TheoryInspector')),
  score: lazy(() => import('@/inspectors/ScoreInspector')),
  pixi: lazy(() => import('@/inspectors/PixiInspector')),
};

/** Contains a rendering failure so one broken specimen can't take down the whole sandbox. */
class SpecimenBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <Card className="space-y-2 p-4">
          <p className="font-medium text-destructive">This specimen threw while rendering.</p>
          <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs text-muted-foreground">
            {this.state.error.message}
          </pre>
          <p className="text-xs text-muted-foreground">
            Some components expect live API data or a user gesture; that is expected in isolation.
          </p>
        </Card>
      );
    }
    return this.props.children;
  }
}

const Loading = () => <p className="text-sm text-muted-foreground">Loading component…</p>;

export default function SpecimenStage({
  specimenId,
  initialLocale,
}: {
  specimenId: string;
  initialLocale: Locale;
}) {
  const specimen = getSpecimen(specimenId);
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const [values, setValues] = useState<Record<string, unknown>>(() =>
    specimen ? initialProps(specimen) : {},
  );

  const LazyComponent = useMemo(() => {
    if (!specimen?.load) return null;
    const load = specimen.load;
    const exportName = specimen.exportName ?? 'default';
    return lazy(async () => {
      const mod = await load();
      const component = mod[exportName] ?? mod.default;
      if (!component) throw new Error(`Export "${exportName}" not found for "${specimen.id}".`);
      return { default: component as ComponentType<Record<string, unknown>> };
    });
  }, [specimen]);

  if (!specimen) {
    return <p className="text-sm text-destructive">Unknown specimen: {specimenId}</p>;
  }

  const Inspector = specimen.inspector ? INSPECTORS[specimen.inspector] : null;
  const hasControls = (specimen.controls?.length ?? 0) > 0;

  return (
    <SandboxProviders>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_17rem]">
        {/* Preview + inspector */}
        <div className="order-2 min-w-0 space-y-8 lg:order-1">
          {LazyComponent && (
            <section>
              <h2 className="mb-3 text-lg font-medium">Preview</h2>
              <div className="flex min-h-[12rem] items-center justify-center rounded-lg border border-border bg-background p-6 sm:p-8">
                <SpecimenBoundary key={`${specimen.id}-${locale}`}>
                  <Suspense fallback={<Loading />}>
                    <LazyComponent {...values} locale={locale} />
                  </Suspense>
                </SpecimenBoundary>
              </div>
            </section>
          )}

          {Inspector && (
            <section>
              <h2 className="mb-3 text-lg font-medium">Engine inspector</h2>
              <SpecimenBoundary key={`${specimen.id}-insp-${locale}`}>
                <Suspense fallback={<Loading />}>
                  <Inspector locale={locale} />
                </Suspense>
              </SpecimenBoundary>
            </section>
          )}
        </div>

        {/* Controls */}
        <aside className="order-1 lg:order-2">
          <div className="sticky top-[4.5rem] space-y-4 rounded-lg border border-border bg-muted/30 p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Controls
            </h2>
            <ControlsPanel
              controls={specimen.controls ?? []}
              values={values}
              onChange={(name, value) => setValues((prev) => ({ ...prev, [name]: value }))}
              locale={locale}
              onLocaleChange={setLocale}
            />
            {!hasControls && (
              <p className="text-xs text-muted-foreground">
                No prop controls — this specimen renders a fixed example. Use the locale + theme
                switchers to exercise it.
              </p>
            )}
          </div>
        </aside>
      </div>
    </SandboxProviders>
  );
}
