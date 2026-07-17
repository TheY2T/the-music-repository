// Generates one Storybook story per component across the UI packages, so every component is its own
// navigable entry (not only the aggregate galleries). Output lands in src/generated (gitignored) and
// is regenerated on `dev` / `build-storybook`, so it never goes stale and isn't committed — the same
// "generated code is regenerated, not tracked" convention as @TheY2T/tmr-api-client (orval).

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PKG = path.resolve(HERE, '..'); // packages/storybook
const ROOT = path.resolve(PKG, '../..'); // repo root
const OUT = path.join(PKG, 'src/generated');
fs.rmSync(OUT, { recursive: true, force: true });

// Copy MSW's browser service worker into the served static dir (msw-storybook-addon needs it there).
// Regenerated here rather than committed — same convention as the generated stories below.
const require = createRequire(import.meta.url);
const mswPkg = path.dirname(require.resolve('msw/package.json'));
const worker = path.join(mswPkg, 'lib/mockServiceWorker.js');
if (fs.existsSync(worker)) {
  fs.mkdirSync(path.join(PKG, 'public'), { recursive: true });
  fs.copyFileSync(worker, path.join(PKG, 'public/mockServiceWorker.js'));
}

const PKGS = [
  {
    dir: 'musickit-ui',
    label: 'MusicKit UI',
    pkg: '@TheY2T/tmr-musickit-ui',
    skipDirs: ['organisms'],
  },
  { dir: 'common-ui', label: 'Common UI', pkg: '@TheY2T/tmr-common-ui', skipDirs: [] },
];

// Skip stories/tests/ambient files and known NON-component modules (config/helper/node builders that
// export functions taking args, not React components).
const skipFile = (p) =>
  /\.(stories|test)\.[tj]sx?$/.test(p) ||
  /(^|\/)(index|env\.d|vite-env\.d|vitest\.setup|gallery)\.[tj]sx?$/.test(p) ||
  /(-config|-nodes|-helpers|manager-helpers|editor-ui|embed-fields|drill-decks|tools-taxonomy)\.[tj]sx?$/.test(
    p,
  ) ||
  // DashboardBackground has a curated variants story (BackgroundVariants) in the storybook package.
  /(DashboardBackground|AmbientBackground|ToolPracticeLogger)\.[tj]sx?$/.test(p);

function walk(dir, base, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, base, out);
    else if (e.name.endsWith('.tsx')) out.push(path.relative(base, full).split(path.sep).join('/'));
  }
  return out;
}
const titleCase = (s) => s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

let count = 0;
for (const { dir, label, pkg, skipDirs } of PKGS) {
  const srcRoot = path.join(ROOT, 'packages', dir, 'src');
  if (!fs.existsSync(srcRoot)) continue;
  for (const rel of walk(srcRoot, srcRoot)) {
    if (skipFile(rel)) continue;
    const segs = rel.split('/');
    if (skipDirs.includes(segs[0])) continue;
    const src = fs.readFileSync(path.join(srcRoot, rel), 'utf8');
    if (!/export\s+default/.test(src)) continue; // components are default-exported islands
    const relNoExt = rel.replace(/\.tsx$/, '');
    // Skip if the package ships a curated co-located story for this component (curated wins).
    if (fs.existsSync(path.join(srcRoot, `${relNoExt}.stories.tsx`))) continue;
    const name = segs[segs.length - 1].replace(/\.tsx$/, '');
    const subGroup = segs.slice(0, -1).map(titleCase).join('/');
    const title = [label, subGroup, name].filter(Boolean).join('/');
    const outFile = path.join(OUT, dir, `${relNoExt}.stories.tsx`);
    const up = '../'.repeat(2 + segs.length - 1); // depth from OUT/<dir>/<subdirs> back to src/
    const body = `import type { Meta, StoryObj } from '@storybook/react-vite';
import type { FC } from 'react';
import Component from '${pkg}/${relNoExt}';
import { sampleProps } from '${up}sample-props';

// AUTO-GENERATED per-component story (scripts/gen-stories.mjs) — do not edit; regenerated on dev/build.
// Renders the island with a broad bag of dummy props (see sample-props). Fetch-driven components pull
// dummy data from MSW; components with bespoke props/labels get a curated co-located story instead.
const meta: Meta = { title: '${title}' };
export default meta;

const C = Component as unknown as FC<Record<string, unknown>>;
export const Default: StoryObj = { render: () => <C {...sampleProps} /> };
`;
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    fs.writeFileSync(outFile, body);
    count++;
  }
}
console.log(`[storybook] generated ${count} per-component stories → src/generated`);
