import { commonUiSpecimens } from './common-ui';
import { musicCoreSpecimens } from './music-core';
import { musickitSpecimens } from './musickit-ui';
import type { DomainTag, PackageId, Specimen } from './types';
import { uiSpecimens } from './ui';

export type { DomainTag, PackageId, Specimen } from './types';
export { initialProps } from './types';

/** Every specimen in the sandbox, ordered by package then declaration order. */
export const specimens: Specimen[] = [
  ...uiSpecimens,
  ...musickitSpecimens,
  ...commonUiSpecimens,
  ...musicCoreSpecimens,
];

/** Look up a specimen by its url slug. */
export function getSpecimen(id: string): Specimen | undefined {
  return specimens.find((s) => s.id === id);
}

/** Human labels + display order for the "by package" grouping. */
export const PACKAGE_META: Record<PackageId, { label: string; blurb: string }> = {
  ui: { label: '@TheY2T/tmr-ui', blurb: 'Atoms & molecules — the presentational foundation.' },
  'musickit-ui': { label: '@TheY2T/tmr-musickit-ui', blurb: 'Music & learning experiences.' },
  'common-ui': {
    label: '@TheY2T/tmr-common-ui',
    blurb: 'App-shell chrome, dashboards, account & admin.',
  },
  'music-core': {
    label: '@TheY2T/tmr-music-core',
    blurb: 'Portable engines (audio, theory, score, pixi).',
  },
};

export const PACKAGE_ORDER: PackageId[] = ['ui', 'musickit-ui', 'common-ui', 'music-core'];

/** Human labels + display order for the "by domain" (feature-area) grouping. */
export const DOMAIN_META: Record<DomainTag, string> = {
  atoms: 'Atoms',
  molecules: 'Molecules',
  organisms: 'Organisms',
  keyboard: 'Keyboard',
  fretboard: 'Fretboard',
  theory: 'Theory & harmony',
  chords: 'Chords',
  ear: 'Ear training',
  rhythm: 'Rhythm & time',
  reading: 'Reading & notation',
  scores: 'Scores & players',
  drills: 'Drills',
  catalogue: 'Catalogue',
  collections: 'Collections',
  content: 'Content',
  dashboard: 'Dashboards',
  account: 'Account & billing',
  admin: 'Admin CMS',
  chrome: 'Shell chrome',
  feedback: 'Feedback & NPS',
  engines: 'Engines',
};

export const DOMAIN_ORDER: DomainTag[] = [
  'atoms',
  'molecules',
  'organisms',
  'chrome',
  'catalogue',
  'collections',
  'content',
  'dashboard',
  'keyboard',
  'fretboard',
  'chords',
  'theory',
  'ear',
  'reading',
  'rhythm',
  'scores',
  'drills',
  'account',
  'feedback',
  'admin',
  'engines',
];

export interface SpecimenGroup {
  key: string;
  label: string;
  items: Specimen[];
}

/** Group specimens by their source package (first grouping axis). */
export function groupByPackage(): SpecimenGroup[] {
  return PACKAGE_ORDER.map((pkg) => ({
    key: pkg,
    label: PACKAGE_META[pkg].label,
    items: specimens.filter((s) => s.pkg === pkg),
  })).filter((group) => group.items.length > 0);
}

/** Group specimens by feature-area domain (second axis). A specimen appears under each of its domains. */
export function groupByDomain(): SpecimenGroup[] {
  return DOMAIN_ORDER.map((domain) => ({
    key: domain,
    label: DOMAIN_META[domain],
    items: specimens.filter((s) => s.domains.includes(domain)),
  })).filter((group) => group.items.length > 0);
}
