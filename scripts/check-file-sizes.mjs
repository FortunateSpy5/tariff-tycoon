/**
 * file-size check
 *
 * WHY THIS EXISTS:
 * AGENTS.md sets a 250-line target with a 400-line hard ceiling and forbids
 * "zero monolithic god-files". That invariant was stated but never measured, so
 * `deskSlice.ts` reached 623 lines and `tradingSlice.ts` reached 504 while the
 * docs still claimed compliance. This makes the claim falsifiable the same way
 * `check-theme-coverage.mjs` does for the theme.
 *
 * WHAT IS EXEMPT:
 *   - `src/components/debug/**` — DEV-only, tree-shaken from production
 *   - `src/types/**` and `src/constants/**` — pure declarations; splitting a
 *     single interface or a single balance table for line count would make the
 *     code worse, not better
 *   - test/tooling roots if present
 *
 * USAGE:  node scripts/check-file-sizes.mjs [--target 250] [--ceiling 400]
 * Exits non-zero if any non-exempt file exceeds the ceiling, and warns (but
 * does not fail) on files above the target.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname, relative } from 'node:path';

const ROOT = 'src';
const EXTS = new Set(['.ts', '.tsx']);

const EXEMPT_DIRS = ['src/components/debug', 'src/types', 'src/constants'];

function argValue(flag, fallback) {
  const i = process.argv.indexOf(flag);
  return i > -1 ? Number(process.argv[i + 1]) : fallback;
}

const TARGET = argValue('--target', 250);
const CEILING = argValue('--ceiling', 400);

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (EXTENSIONS.has(extname(full))) out.push(full);
  }
  return out;
}

const EXTENSIONS = EXTS;

function isExempt(rel) {
  return EXEMPT_DIRS.some((d) => rel === d || rel.startsWith(`${d}/`));
}

function countLines(file) {
  // Count logical lines the same way a reviewer would: strip nothing, but
  // ignore a trailing empty line so a file ending in a newline is not counted
  // as one line longer than it reads.
  const raw = readFileSync(file, 'utf8');
  const lines = raw.split('\n');
  if (lines[lines.length - 1] === '') lines.pop();
  return lines.length;
}

const violations = [];
const warnings = [];

for (const file of walk(ROOT)) {
  const rel = relative('.', file).replace(/\\/g, '/');
  if (isExempt(rel)) continue;
  const lines = countLines(file);
  if (lines > CEILING) violations.push({ rel, lines });
  else if (lines > TARGET) warnings.push({ rel, lines });
}

warnings.sort((a, b) => b.lines - a.lines);
violations.sort((a, b) => b.lines - a.lines);

if (warnings.length) {
  console.log(`files above the ${TARGET}-line target (not failing):`);
  for (const w of warnings) console.log(`  ${String(w.lines).padStart(5)}  ${w.rel}`);
  console.log('');
}

if (violations.length) {
  console.error(`file size: ${violations.length} file(s) over the ${CEILING}-line hard ceiling`);
  for (const v of violations) console.error(`  ${String(v.lines).padStart(5)}  ${v.rel}`);
  console.error('\nAGENTS.md forbids god-files. Extract the domain logic into');
  console.error('src/engine/ (pure) or a sibling slice, then re-run.');
  process.exit(1);
}

console.log(`file size: all files within the ${CEILING}-line ceiling`);
