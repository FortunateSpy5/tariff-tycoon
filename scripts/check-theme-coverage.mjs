/**
 * theme-coverage check
 *
 * WHY THIS EXISTS:
 * Phase B was originally reported "complete" when only 6 of 26 player-facing
 * files used a themed material. The theme had been applied to CHROME (the top
 * bar, tab headers, the left pane) while the CONTENT — including the centre
 * desk, which is ~40% of the screen — was still default stone grey. A screenshot
 * looked coherent, so the gap was invisible without counting.
 *
 * This script makes that class of claim falsifiable. It counts unthemed
 * stone-family surface backgrounds in player-facing components and fails above a
 * budget, so "the theme is done" becomes a number instead of an opinion.
 *
 * WHAT COUNTS AS UNTHEMED:
 *   bg-stone-700 / 800 / 900 / 950 in a .tsx file under src/components,
 *   excluding DebugPanel (DEV-only, tree-shaken from production).
 *
 * These are legitimate in a few places and those are handled with inline
 * `theme-allow` markers rather than a blanket allowlist, so new violations in
 * already-touched files are still caught.
 *
 * USAGE:  node scripts/check-theme-coverage.mjs
 * Exits non-zero if the count exceeds --budget (default 0).
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname, relative } from 'node:path';

const ROOT = 'src/components';
const EXEMPT_FILES = new Set(['DebugPanel.tsx']);
const STONE = /bg-stone-(?:700|800|900|950)\b/;

/** Parse `--budget N` (default 0). */
const budgetArg = process.argv.indexOf('--budget');
const BUDGET = budgetArg > -1 ? Number(process.argv[budgetArg + 1]) : 0;

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (extname(full) === '.tsx') out.push(full);
  }
  return out;
}

/** Strip line and block comments so documentation prose is not counted. */
function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

const violations = [];
let total = 0;

for (const file of walk(ROOT)) {
  const name = file.split(/[\\/]/).pop();
  if (EXEMPT_FILES.has(name)) continue;

  const lines = stripComments(readFileSync(file, 'utf8')).split('\n');
  lines.forEach((line, i) => {
    if (!STONE.test(line)) return;
    // A `theme-allow` marker on the same line marks a deliberate exception
    // (e.g. an inset well that must stay dark for text contrast).
    if (line.includes('theme-allow')) return;
    total += 1;
    violations.push(`${relative(process.cwd(), file)}:${i + 1}`);
  });
}

console.log(`theme coverage: ${total} unthemed stone surface(s) (budget ${BUDGET})`);
if (total) {
  console.log('\nlocations:');
  for (const v of violations) console.log(`  ${v}`);
  console.log('\nEither migrate the surface to a themed material, or mark a');
  console.log('deliberate exception with an inline `theme-allow` comment.');
}

process.exit(total > BUDGET ? 1 : 0);
