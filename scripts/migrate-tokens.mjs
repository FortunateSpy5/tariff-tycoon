// One-off migration: old TUNGSTEN token families -> the DEGEN surface system.
//
// PREFIX-AWARE BY DESIGN. A bare family->family rename is wrong here, because
// the old ramps were each doing three jobs at once. `newsprint-400` was light
// text ON A DARK PANEL in one file and a mid surface fill in another; the only
// way to map it honestly is to look at which utility prefix it sits behind.
//
//   bg-*     -> a surface or a fill
//   text-*   -> ink for the ground that text actually lands on
//   border-* -> a rule
//
// Run once, then delete. The token gate is what keeps it honest afterwards.
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const PREFIXES = 'bg|text|border|from|to|via|fill|stroke|ring|shadow|outline|divide|decoration|caret|accent|placeholder';

const NEWSPRINT = {
  50: { bg: 'card', text: 'term-ink-1', border: 'line-soft', grad: 'card' },
  100: { bg: 'card', text: 'term-ink-1', border: 'line-soft', grad: 'card' },
  200: { bg: 'card', text: 'term-ink-1', border: 'line', grad: 'card' },
  300: { bg: 'panel', text: 'term-ink-2', border: 'line', grad: 'panel' },
  400: { bg: 'panel', text: 'term-ink-3', border: 'line', grad: 'panel' },
  500: { bg: 'panel', text: 'term-ink-3', border: 'line', grad: 'panel' },
  600: { bg: 'ground', text: 'term-ink-3', border: 'line-strong', grad: 'ground' },
  700: { bg: 'ground', text: 'term-ink-3', border: 'line-strong', grad: 'ground' },
  800: { bg: 'ground', text: 'term-ink-3', border: 'line-strong', grad: 'ground' },
  900: { bg: 'well', text: 'ink-2', border: 'line-strong', grad: 'well' },
  950: { bg: 'ink-1', text: 'ink-1', border: 'line-strong', grad: 'ink-1' },
};

const MAP = {
  newsprint: NEWSPRINT,
  gold: {
    300: { bg: 'accent', text: 'accent-ink', border: 'accent-ink', grad: 'accent' },
    400: { bg: 'accent', text: 'accent-ink', border: 'accent-ink', grad: 'accent' },
    500: { bg: 'accent', text: 'accent-ink', border: 'accent-ink', grad: 'accent' },
    600: { bg: 'accent', text: 'accent-ink', border: 'accent-ink', grad: 'accent' },
    700: { bg: 'accent', text: 'accent-ink', border: 'accent-ink', grad: 'accent' },
    800: { bg: 'accent', text: 'accent-ink', border: 'accent-ink', grad: 'accent' },
    900: { bg: 'accent', text: 'accent-ink', border: 'accent-ink', grad: 'accent' },
  },
  money: {
    300: { bg: 'live-wash', text: 'live-soft', border: 'live-ink', grad: 'live' },
    400: { bg: 'live-wash', text: 'live-soft', border: 'live-ink', grad: 'live' },
    500: { bg: 'live-wash', text: 'live-ink', border: 'live-ink', grad: 'live' },
    600: { bg: 'live-wash', text: 'live-ink', border: 'live-ink', grad: 'live' },
    700: { bg: 'live-wash', text: 'live-ink', border: 'live-ink', grad: 'live' },
    800: { bg: 'live-wash', text: 'live-ink', border: 'live-ink', grad: 'live' },
    950: { bg: 'well', text: 'live-soft', border: 'live-ink', grad: 'well' },
  },
  phosphor: {
    300: { bg: 'well-2', text: 'term-ink-1', border: 'term-line-strong', grad: 'term-ink-1' },
    400: { bg: 'well-2', text: 'term-ink-2', border: 'term-line-strong', grad: 'term-ink-2' },
    500: { bg: 'well-2', text: 'term-ink-3', border: 'term-line-strong', grad: 'term-ink-3' },
    600: { bg: 'well', text: 'term-ink-3', border: 'term-line-strong', grad: 'term-ink-3' },
    700: { bg: 'well-2', text: 'term-ink-2', border: 'term-line-strong', grad: 'term-ink-2' },
    800: { bg: 'well-2', text: 'term-ink-2', border: 'term-line', grad: 'term-ink-2' },
    900: { bg: 'well', text: 'term-ink-2', border: 'term-line', grad: 'term-ink-2' },
    950: { bg: 'well', text: 'term-ink-2', border: 'term-line', grad: 'term-ink-2' },
  },
  wax: {
    300: { bg: 'dead-wash', text: 'dead-soft', border: 'dead-ink', grad: 'dead' },
    400: { bg: 'dead-wash', text: 'dead-soft', border: 'dead-ink', grad: 'dead' },
    500: { bg: 'dead', text: 'dead-soft', border: 'dead-ink', grad: 'dead' },
    600: { bg: 'dead', text: 'dead-soft', border: 'dead-ink', grad: 'dead' },
    700: { bg: 'dead', text: 'dead-soft', border: 'dead-ink', grad: 'dead' },
  },
  panic: {
    300: { bg: 'dead-wash', text: 'dead-soft', border: 'dead-ink', grad: 'dead' },
    400: { bg: 'dead-wash', text: 'dead-soft', border: 'dead-ink', grad: 'dead' },
    500: { bg: 'dead', text: 'dead-ink', border: 'dead-ink', grad: 'dead' },
    600: { bg: 'dead', text: 'dead-ink', border: 'dead-ink', grad: 'dead' },
    700: { bg: 'dead', text: 'dead-ink', border: 'dead-ink', grad: 'dead' },
    950: { bg: 'ink-1', text: 'dead-ink', border: 'dead-ink', grad: 'ink-1' },
  },
  redaction: {
    500: { bg: 'well', text: 'term-ink-1', border: 'term-line-strong', grad: 'well' },
    700: { bg: 'well-2', text: 'term-ink-1', border: 'term-line', grad: 'well-2' },
  },
  stampblue: {
    400: { bg: 'signal-wash', text: 'signal-ink', border: 'signal-ink', grad: 'signal' },
    500: { bg: 'signal-wash', text: 'signal-ink', border: 'signal-ink', grad: 'signal' },
    700: { bg: 'signal-wash', text: 'signal-ink', border: 'signal-ink', grad: 'signal' },
  },
};

const GRAD_PREFIX = new Set(['from', 'to', 'via']);
const FILL_PREFIX = new Set(['fill', 'stroke']);

const RE = new RegExp(String.raw`\b(${PREFIXES})-(newsprint|gold|money|phosphor|wax|panic|redaction|stampblue)-(\d+)\b`, 'g');

function resolve(prefix, family, step) {
  const row = MAP[family]?.[step];
  if (!row) return null;
  if (GRAD_PREFIX.has(prefix) || prefix === 'shadow') return row.grad;
  if (FILL_PREFIX.has(prefix)) return row.bg;
  if (prefix === 'bg') return row.bg;
  if (prefix === 'text') return row.text;
  return row.border;
}

const files = [];
(function walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', 'dist', '.git'].includes(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(ts|tsx)$/.test(e.name)) files.push(p);
  }
})('src');

let changedFiles = 0;
const unresolved = new Map();

for (const f of files) {
  const before = readFileSync(f, 'utf8');
  const after = before.replace(RE, (m, prefix, family, step) => {
    const to = resolve(prefix, family, step);
    if (!to) {
      const k = `${family}-${step}`;
      if (!unresolved.has(k)) unresolved.set(k, []);
      unresolved.get(k).push(f);
      return m;
    }
    return `${prefix}-${to}`;
  });
  if (after !== before) {
    writeFileSync(f, after);
    changedFiles++;
  }
}

console.log(`migrate-tokens: rewrote ${changedFiles} file(s)`);
if (unresolved.size) {
  console.log('UNRESOLVED (no mapping — these are still dead):');
  for (const [k, at] of unresolved) console.log(`  ${k}  x${at.length}`);
  process.exitCode = 1;
}
