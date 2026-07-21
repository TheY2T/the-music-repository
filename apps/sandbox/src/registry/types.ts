/** Which shared package a specimen comes from — one axis of the "by package" grouping. */
export type PackageId = 'ui' | 'musickit-ui' | 'common-ui' | 'music-core';

/** Feature-area tags — the "by domain" grouping axis. A specimen may belong to several. */
export type DomainTag =
  | 'atoms'
  | 'molecules'
  | 'organisms'
  | 'keyboard'
  | 'fretboard'
  | 'theory'
  | 'chords'
  | 'ear'
  | 'rhythm'
  | 'reading'
  | 'scores'
  | 'drills'
  | 'catalogue'
  | 'collections'
  | 'content'
  | 'dashboard'
  | 'account'
  | 'admin'
  | 'chrome'
  | 'feedback'
  | 'engines';

/** The live engine inspectors a specimen can surface alongside its rendered component. */
export type InspectorId = 'audio' | 'soundfont' | 'theory' | 'score' | 'pixi';

/** How a specimen renders — drives hydration + whether it is exercised only via E2E. */
export type SpecimenKind = 'presentational' | 'interactive' | 'pixi' | 'organism' | 'engine';

/** A single tweakable prop in the playground controls panel. */
export type ControlSpec =
  | { name: string; label?: string; type: 'boolean'; default?: boolean }
  | {
      name: string;
      label?: string;
      type: 'number';
      default?: number;
      min?: number;
      max?: number;
      step?: number;
    }
  | { name: string; label?: string; type: 'text'; default?: string; placeholder?: string }
  | {
      name: string;
      label?: string;
      type: 'enum';
      default?: string;
      options: { value: string; label?: string }[];
    };

/**
 * The module shape a `load()` resolves to. Loosely typed as unknown values so any real package module
 * (whose components carry specific prop types) is assignable; the stage narrows the picked export.
 */
export type SpecimenModule = Record<string, unknown>;

/**
 * One entry in the sandbox catalogue: a component to render in the playground, with everything needed
 * to mount it (loader + props), tweak it (controls), and inspect it (engine inspector). The registry is
 * pure data + lazy loaders, so it is safe to import on the server (for nav/titles) — no component is
 * evaluated until `load()` runs client-side.
 */
export interface Specimen {
  /** URL slug — unique across the registry. */
  id: string;
  /** Display name. */
  name: string;
  pkg: PackageId;
  domains: DomainTag[];
  kind: SpecimenKind;
  /** Lazy import of the component's package subpath. Omitted for inspector-only (engine) specimens. */
  load?: () => Promise<SpecimenModule>;
  /** Named export to pick from the loaded module; defaults to the module's default export. */
  exportName?: string;
  /** Playground controls; a built-in locale toggle is always added on top of these. */
  controls?: ControlSpec[];
  /** Static props merged under the live control values (e.g. example data). */
  defaultProps?: Record<string, unknown>;
  /** Attach a live engine inspector panel. Engine specimens set this with no `load`. */
  inspector?: InspectorId;
  /** Short description shown on the specimen page. */
  notes?: string;
}

/** Build the initial prop object for a specimen from its control defaults + static props. */
export function initialProps(specimen: Specimen): Record<string, unknown> {
  const fromControls: Record<string, unknown> = {};
  for (const control of specimen.controls ?? []) {
    if (control.default !== undefined) fromControls[control.name] = control.default;
  }
  return { ...fromControls, ...specimen.defaultProps };
}
