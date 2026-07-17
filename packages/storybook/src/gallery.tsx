import { Component, type ComponentType, lazy, type ReactNode, Suspense } from 'react';

/** Catches a single component's render/import failure so it can't blank the whole gallery. Smart
 * islands that need a live API / audio / MIDI context surface their error here instead of crashing. */
class Boundary extends Component<{ children: ReactNode }, { err?: Error }> {
  state: { err?: Error } = {};
  static getDerivedStateFromError(err: Error) {
    return { err };
  }
  render() {
    if (this.state.err) {
      return (
        <p className="text-xs text-destructive">
          needs props / a running dev API — {String(this.state.err.message).slice(0, 140)}
        </p>
      );
    }
    return this.props.children;
  }
}

// Skip stories/tests/ambient files and known NON-component modules (config/helper/node builders that
// export functions taking args, not React components — rendering them as components crashes).
const skip = (p: string) =>
  /\.(stories|test)\.[tj]sx?$/.test(p) ||
  /\/(index|env\.d|vite-env\.d|vitest\.setup|gallery)\.[tj]sx?$/.test(p) ||
  /(-config|-nodes|-helpers|manager-helpers|editor-ui|embed-fields|drill-decks|tools-taxonomy)\.[tj]sx?$/.test(
    p,
  );

/**
 * Renders every component module in a package (from an `import.meta.glob` map) in an error-bounded
 * grid — a "render all" catalogue. Presentational components render fully; smart ones that need props
 * or live data show a graceful note. Curated per-component stories live co-located in each package.
 */
export function Gallery({
  modules,
  props = {},
}: {
  modules: Record<string, () => Promise<unknown>>;
  props?: Record<string, unknown>;
}) {
  const entries = Object.entries(modules)
    .filter(([p]) => !skip(p))
    .sort(([a], [b]) => a.localeCompare(b));
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {entries.map(([path, loader]) => {
        const name =
          path
            .split('/')
            .pop()
            ?.replace(/\.tsx?$/, '') ?? path;
        const Lazy = lazy(async () => {
          const mod = (await loader()) as Record<string, unknown>;
          // Only render a genuine React component (default-exported island). Non-visual modules
          // (config/helper builders) get a muted note rather than being mis-rendered as components.
          if (typeof mod.default !== 'function') {
            const Note = () => <p className="text-xs text-muted-foreground">non-visual module</p>;
            return { default: Note as ComponentType<Record<string, unknown>> };
          }
          return { default: mod.default as ComponentType<Record<string, unknown>> };
        });
        return (
          <section key={path} className="overflow-hidden rounded-lg border border-border p-4">
            <h3 className="mb-3 font-display text-sm text-muted-foreground">{name}</h3>
            <Boundary>
              <Suspense fallback={<p className="text-xs text-muted-foreground">loading…</p>}>
                <Lazy {...props} />
              </Suspense>
            </Boundary>
          </section>
        );
      })}
    </div>
  );
}
