#!/usr/bin/env node
/**
 * Generates THIRD-PARTY-LICENSES.md from the installed production dependency tree.
 *
 * It asks pnpm for the resolved production dependencies and their licenses, reads
 * each package's verbatim license text from disk, and writes a single attribution
 * file listing every redistributed package (name, version, author, homepage, SPDX
 * id) with its full license text embedded.
 *
 * Run: `pnpm licenses:generate` (or `node scripts/generate-third-party-licenses.mjs`).
 */
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = fileURLToPath(new URL('..', import.meta.url));
const OUT_FILE = join(REPO_ROOT, 'THIRD-PARTY-LICENSES.md');

// Common on-disk names for a package's license/notice text.
const LICENSE_FILE_RE = /^(licen[sc]e|copying|notice)([.-].*)?$/i;

/** Read the resolved production dependency set from pnpm. */
function readProdLicenses() {
  const raw = execFileSync(
    'pnpm',
    ['licenses', 'list', '--prod', '--json'],
    { cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
  );
  return JSON.parse(raw);
}

/** Find and read the verbatim license text shipped inside a package directory. */
function readLicenseText(pkgPath) {
  let entries;
  try {
    entries = readdirSync(pkgPath, { withFileTypes: true });
  } catch {
    return null;
  }
  const match = entries.find((e) => e.isFile() && LICENSE_FILE_RE.test(e.name));
  if (!match) return null;
  try {
    return readFileSync(join(pkgPath, match.name), 'utf8').trim();
  } catch {
    return null;
  }
}

function main() {
  const byLicense = readProdLicenses();

  // Flatten to one row per package, deduped by name, carrying every version.
  const packages = new Map();
  for (const [spdx, pkgs] of Object.entries(byLicense)) {
    for (const pkg of pkgs) {
      const existing = packages.get(pkg.name);
      if (existing) {
        existing.versions = [...new Set([...existing.versions, ...pkg.versions])];
        continue;
      }
      packages.set(pkg.name, {
        name: pkg.name,
        spdx,
        versions: pkg.versions ?? [],
        author: typeof pkg.author === 'string' ? pkg.author : (pkg.author?.name ?? ''),
        homepage: pkg.homepage ?? '',
        licenseText: readLicenseText(pkg.paths?.[0] ?? ''),
      });
    }
  }

  const sorted = [...packages.values()].sort((a, b) =>
    a.name.localeCompare(b.name, 'en'),
  );

  // License-type summary.
  const counts = new Map();
  for (const p of sorted) counts.set(p.spdx, (counts.get(p.spdx) ?? 0) + 1);
  const summary = [...counts.entries()].sort((a, b) => b[1] - a[1]);

  const missing = sorted.filter((p) => !p.licenseText);

  const lines = [];
  lines.push('# Third-Party Licenses');
  lines.push('');
  lines.push(
    'The Music Repository is distributed with the open-source software listed below. ' +
      'Each package is used under the terms of its license, reproduced verbatim in this file. ' +
      'This file covers production dependencies (code present in the deployed application, ' +
      'including the client-side bundles served to browsers).',
  );
  lines.push('');
  lines.push('Regenerate with `pnpm licenses:generate`.');
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push('| License | Packages |');
  lines.push('| --- | --- |');
  for (const [spdx, n] of summary) lines.push(`| ${spdx} | ${n} |`);
  lines.push(`| **Total** | **${sorted.length}** |`);
  lines.push('');
  if (missing.length) {
    lines.push(
      `> ${missing.length} package(s) ship no license file on disk; their SPDX id is ` +
        'recorded below and the canonical license text applies. See the homepage for each.',
    );
    lines.push('');
  }
  lines.push('## Packages');
  lines.push('');

  for (const p of sorted) {
    const versions = p.versions.join(', ');
    lines.push(`### ${p.name}${versions ? ` @ ${versions}` : ''}`);
    lines.push('');
    lines.push(`- **License:** ${p.spdx}`);
    if (p.author) lines.push(`- **Author:** ${p.author}`);
    if (p.homepage) lines.push(`- **Homepage:** ${p.homepage}`);
    lines.push('');
    if (p.licenseText) {
      lines.push('```');
      lines.push(p.licenseText);
      lines.push('```');
    } else {
      lines.push(
        `_No license file bundled; used under the ${p.spdx} license._`,
      );
    }
    lines.push('');
  }

  writeFileSync(OUT_FILE, lines.join('\n'));
  process.stdout.write(
    `Wrote ${OUT_FILE} — ${sorted.length} packages, ${missing.length} without bundled text.\n`,
  );
}

main();
