/**
 * token-integrity check
 *
 * WHY THIS EXISTS:
 * 29 references to colour tokens that DO NOT EXIST survived a green
 * `npm run build`. Every one of them compiles to nothing: Tailwind v4 emits no
 * rule at all for a `text-<family>-<step>` class whose token is undefined, so
 * the property silently inherits. Nothing errors, nothing warns, and the
 * elements render in whatever colour their ancestor happened to be — which is
 * the direct mechanical cause of "the UI theme feels disjointed and random."
 *
 * The three gates that existed could not see this. `theme:check` matches exactly
 * one regex, `bg-stone-(700|800|900|950)`, and never consults `@theme` at all.
 * `hover:check` and `size:check` are not colour gates. So the tree was green and
 * wrong at the same time, which is the specific failure this script exists to
 * make impossible.
 *
 * WHAT COUNTS AS A VIOLATION:
 * A `<prefix>-<family>-<step>` utility in a .ts/.tsx file under src/, where
 * `<family>` is a family this project actually defines in `@theme` but `<step>`
 * is not a step that family defines. A whole unknown family (`bg-stone-500`) is
 * NOT a violation — that is a stock Tailwind colour and is Rule B's business.
 * This rule is only about indexing a project scale at a step that is missing.
 *
 * WHY THE FAMILY ALTERNATION IS BUILT FROM THE TOKEN NAMES:
 * The obvious regex is `(text|bg|border|...)-([a-z]+)-(\d+)`, and it is wrong on
 * day one: it matches Tailwind's border-SIDE utilities, so `border-l-2` parses as
 * family `l` step `2`, and `border-x-4` likewise. Building the alternation from
 * the families actually present in `@theme` means `l` and `x` cannot match,
 * because they are not families. The rule is then a pure superset test and has
 * no false positives on the current tree beyond the known sites.
 *
 * WHY COMMENTS ARE BLANKED, AND WHY NEWLINES ARE PRESERVED:
 * This repo documents its dead tokens at length — `text-gold-700`,
 * `text-wax-400` and `phosphor-700` are each named in prose explaining WHY they
 * are broken. Counting prose would report every one of those as a fresh
 * violation. Comments are blanked to spaces rather than removed so that reported
 * line numbers still point at the real line; `check-theme-coverage.mjs` removes
 * them outright, which collapses multi-line comments and shifts every line
 * number below the first one.
 *
 * USAGE:  node scripts/check-token-integrity.mjs
 * Exits non-zero if the count exceeds --budget (default 0).
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname, relative } from 'node:path';

const ROOT = 'src';
const THEME_FILE = 'src/index.css';
const SOURCE_EXTS = new Set(['.ts', '.tsx']);

/**
 * Files exempt from Rule B (stock Tailwind colours) only. Rule A and the orphan
 * rule still apply to DebugPanel — it is full of `bg-stone-…` on purpose, and a
 * dead project token in there would be just as dead as anywhere else.
 */
const EXEMPT_FILES = new Set(['DebugPanel.tsx']);

/** Utility prefixes that take a `<family>-<step>` colour argument. */
const PREFIXES = [
  'text', 'bg', 'border', 'ring', 'fill', 'stroke', 'from', 'via', 'to',
  'divide', 'outline', 'decoration', 'caret', 'placeholder', 'shadow', 'accent',
].join('|');

/** Parse `--budget N` (default 0). */
const budgetArg = process.argv.indexOf('--budget');
const BUDGET = budgetArg > -1 ? Number(process.argv[budgetArg + 1]) : 0;

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (SOURCE_EXTS.has(extname(full))) out.push(full);
  }
  return out;
}

/**
 * Blank comments to spaces, preserving newlines so line numbers stay honest.
 *
 * The `//` heuristic ("not preceded by a colon") is the same one
 * `check-theme-coverage.mjs` uses, and it exists for `http://`. It can blank a
 * line it should not. That failure direction is deliberate and safe here: a
 * missed line means a violation is not reported, whereas over-eager matching
 * would fail the build on the project's own documentation.
 */
function blankComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:])\/\/[^\n]*/g, (m, lead) => lead + ' '.repeat(Math.max(0, m.length - lead.length)));
}

/**
 * Extract the `@theme { ... }` block by brace matching, then read every
 * `--color-<family>-<step>` definition inside it.
 *
 * Brace matching rather than a regex, because the block is full of nested block
 * comments containing braces of their own.
 *
 * THE STEP IS NOT ALWAYS A NUMBER. The palette moved from numeric ramps
 * (`newsprint-500`) to Radix-style use-case steps (`surface-1`, `accent-hi`,
 * `live-dim`), so the step is `[a-z0-9]+` and the family is everything before
 * the FIRST hyphen. An earlier version of this script only understood
 * `\d{2,3}`, which made it match nothing against the new names — and it still
 * reported success, because a rule that matches nothing trivially passes a
 * budget. That is the "gate that cannot fail" failure mode, and it is why the
 * emptiness check below is a hard failure rather than a warning.
 */
function readThemeTokens(css) {
  const start = css.indexOf('@theme');
  if (start === -1) throw new Error(`No @theme block found in ${THEME_FILE}`);
  const open = css.indexOf('{', start);
  let depth = 0;
  let end = open;
  for (; end < css.length; end += 1) {
    if (css[end] === '{') depth += 1;
    else if (css[end] === '}') {
      depth -= 1;
      if (depth === 0) break;
    }
  }
  const body = css.slice(open, end);
  const tokens = new Set();
  for (const m of body.matchAll(/--color-([a-z][a-z0-9]*(?:-[a-z0-9]+)*)\s*:/g)) {
    tokens.add(m[1]);
  }
  return tokens;
}

const defined = readThemeTokens(readFileSync(THEME_FILE, 'utf8'));
const families = [...new Set([...defined].map((t) => t.split('-')[0]))].sort();

// INVARIANT: [A Gate That Matches Nothing Must Fail]
// If the family alternation is empty the regex degenerates to matching the
// empty string, every scan finds zero violations, and the budget passes. That
// is strictly worse than having no gate, because it reports a green build. The
// only safe behaviour on an empty token set is to stop.
if (families.length === 0) {
  console.error(
    'token integrity: FATAL — no colour tokens parsed out of the @theme block.\n' +
      `  Parsed ${defined.size} token(s) from ${THEME_FILE}. Either the block moved,\n` +
      '  or the token-name shape changed and this script needs updating.\n' +
      '  Refusing to pass a budget against an empty rule set.'
  );
  process.exit(2);
}

/**
 * Stock Tailwind colour families.
 *
 * These are the ONLY families allowed to appear without being defined in
 * `@theme`. They exist here so the second rule below can tell "someone used a
 * stock Tailwind colour" (allowed, though tracked) apart from "someone used a
 * project token that no longer exists" (a violation).
 *
 * INVARIANT: [A Deleted Family Is A Violation, Not A Non-Event]
 * This rule exists because of a real blind spot. The original version of this
 * script only flagged steps missing from a family that *still existed*, so when
 * a whole family was renamed — `newsprint-900` -> `ink-1`, say — the 30-odd
 * call sites still using `newsprint-*` matched nothing at all. The gate
 * reported a clean tree while every one of those elements rendered in its
 * inherited colour. Silent, total, and reported as green.
 *
 * A family that is neither defined here nor in the stock list is therefore
 * reported. That is deliberately noisy in one direction only: it cannot produce
 * a false negative, which is the direction that costs you a working UI.
 */
const STOCK = new Set([
  'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan',
  'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose', 'slate',
  'gray', 'grey', 'zinc', 'neutral', 'stone', 'black', 'white',
]);

/**
 * Structural Tailwind utilities whose "family" is a word but which are not
 * colours. Without this the orphan rule is pure noise:
 *   bg-gradient-to-r      -> bg + gradient + to
 *   border-l-2            -> border + l + 2
 *   ring-offset-2         -> ring + offset + 2
 * These are the false positives that would train people to ignore the rule.
 */
const STRUCTURAL = new Set([
  'gradient', 'offset', 'glow', // Tailwind's gradient/ring-offset, and our text-glow-*
  'l', 'r', 't', 'b', 'x', 'y', 's', 'e', 'all', // border/padding/inset sides
]);



// Built FROM the defined names, so `border-l-2` and `border-x-4` cannot match:
// `l` and `x` are not families.
//
// The trailing optional segment is for THREE-PART NAMES. A token like
// `term-ink-1` is family `term`, step `ink-1` — but the single-segment pattern
// stopped at `ink`, reported `term-ink` as undefined, and did so for all 184
// references in the terminal. It is the same bug as the numeric-ramp one
// above, one shape further along: the gate understood the token at DEFINITION
// time and not at USE time, so the half it did parse was enough to make every
// call site look broken. Kept greedy with an optional second segment so the
// longest defined name wins.
const REF = new RegExp(
  String.raw`\b(?:${PREFIXES})-((?:${families.join('|')})-[a-z0-9]+(?:-[a-z0-9]+)?)\b`,
  'g'
);

/**
 * ORPHAN rule: a `<prefix>-<family>-<step>` whose family is neither a defined
 * project family nor a stock Tailwind family. These are references to tokens
 * that have been RENAMED OR DELETED, and they compile to nothing at all.
 *
 * This is the rule that would have caught the `newsprint-*` -> `ink-*` rename
 * leaving 30 dead call sites behind. It is intentionally broad: the cost of a
 * false positive is one line of `token-allow`, and the cost of a false negative
 * is an element rendering in an undefined colour with a green build.
 */
const ORPHAN = new RegExp(
  String.raw`\b(?:${PREFIXES})-([a-z][a-z0-9]*)-([a-z0-9]+)\b`,
  'g'
);

/**
 * Rule B: STOCK TAILWIND COLOURS. Separately budgeted, and the reason this
 * script exists twice over.
 *
 * WHY A SECOND RULE
 * Rule A above cannot see a stock colour at all — it only knows about families
 * this project DEFINES. `bg-amber-950` compiles, renders, and looks like it was
 * on purpose, so it passes every other gate in the build: not an undefined
 * token, not an unthemed surface (the `theme:check` regex only matches
 * `bg-stone-*`), not an unhovered element, not a file over the size ceiling.
 *
 * That is how 19 player-facing call sites ended up on stock Tailwind ramps while
 * the tree was green, including a `bg-amber-950/60` chip carrying `text-accent-ink`
 * at roughly 1.6:1 — a real legibility failure that no existing gate could name,
 * because from the outside it is indistinguishable from a themed choice.
 *
 * The migration moved every one of them onto a documented token, so the budget
 * starts at ZERO rather than at the number that used to exist. A ratchet that
 * opens at the count it was written to fix is a ratchet that never closes.
 *
 * WHAT IS EXEMPT, AND WHY EACH ONE IS EXEMPT
 *   - DebugPanel: DEV-only, tree-shaken out of production, and its whole purpose
 *     is to be a raw inspector rather than a themed surface.
 *   - inline `token-allow`: a deliberate, reviewed escape hatch on one line.
 *   - Comments: blanked first, exactly as in Rule A. The comment above is the
 *     single largest block of stock colour names in the repo and it is prose.
 *
 * NOT EXEMPT: `black`, `white`, and `transparent`. Those three are permitted
 * Tailwind keywords whose meaning does not change if the palette is re-tuned, and
 * a rule that flagged `text-white` would be a rule people route around.
 */
const STOCK_BUDGET_ARG = process.argv.indexOf('--stock-budget');
const STOCK_BUDGET =
  STOCK_BUDGET_ARG > -1 ? Number(process.argv[STOCK_BUDGET_ARG + 1]) : 0;

/** `<prefix>-<family>[-<step>]`, restricted to the stock families Rule B owns. */
const STOCK_REF = new RegExp(
  String.raw`\b(?:${PREFIXES})-(${[...STOCK]
    .filter((f) => !['black', 'white'].includes(f))
    .join('|')})(?:-([a-z0-9]+))?\b`,
  'g'
);

const stockRefs = [];

for (const file of walk(ROOT)) {
  const name = file.split(/[\\/]/).pop();
  if (EXEMPT_FILES.has(name)) continue;
  const lines = blankComments(readFileSync(file, 'utf8')).split('\n');
  lines.forEach((line, i) => {
    if (line.includes('token-allow')) return;
    for (const m of line.matchAll(STOCK_REF)) {
      stockRefs.push({
        at: `${relative(process.cwd(), file)}:${i + 1}`,
        token: m[2] ? `${m[1]}-${m[2]}` : m[1],
        used: m[0],
      });
    }
  });
}

const stockSites = new Set(stockRefs.map((v) => v.at)).size;

/**
 * Rule C: BESPOKE UTILITY CLASSES THAT NAME A TOKEN.
 *
 * WHY A THIRD RULE
 * Two dead classes survived Rule A, Rule B, the orphan rule and a green build:
 * `ring-offset-newsprint-950` and `text-glow-phosphor`. Neither is a colour
 * utility — they are hand-authored classes in `index.css` that take a token name
 * as an argument — so every rule above looked straight past them.
 *
 * The failure mode is worse than an undefined `text-*` token, because a colour
 * utility at least renders nothing and gets noticed. `text-glow-phosphor` renders
 * as perfectly good plain caption text: the export confirmation was still
 * readable, so nobody had any reason to look. And `ring-offset-newsprint-950`
 * parses as family `offset`, which is in STRUCTURAL and therefore skipped by the
 * orphan rule for a reason that is right for `ring-offset-2` and wrong here.
 *
 * So this rule is deliberately narrow: a bespoke utility whose argument is a
 * non-numeric name must resolve either to a token in `@theme` or to a selector
 * literally declared in the stylesheet. It is the same "make it falsifiable"
 * argument as the other two, applied to the last place a dead colour can hide.
 *
 * NUMBERS ARE SKIPPED: `ring-offset-2` is a length, not a colour, and a rule that
 * flagged it would be a rule that gets switched off.
 */
const BESPOKE_UTILS = ['text-glow', 'ring-offset', 'surface'];
const BESPOKE_REF = new RegExp(
  String.raw`\b(?:${BESPOKE_UTILS.join('|')})-([a-z][a-z0-9]*(?:-[a-z0-9]+)*)\b`,
  'g'
);

/** Every class selector literally declared in the stylesheet. */
function readDeclaredClasses(css) {
  const declared = new Set();
  for (const m of css.matchAll(/(?:^|[\s,{}])\.(-?[_a-zA-Z][\w-]*)/g)) declared.add(m[1]);
  return declared;
}

const css = readFileSync(THEME_FILE, 'utf8');
const declaredClasses = readDeclaredClasses(css);
const bespokeDead = [];

for (const file of walk(ROOT)) {
  const name = file.split(/[\\/]/).pop();
  if (EXEMPT_FILES.has(name)) continue;
  const lines = blankComments(readFileSync(file, 'utf8')).split('\n');
  lines.forEach((line, i) => {
    if (line.includes('token-allow')) return;
    for (const m of line.matchAll(BESPOKE_REF)) {
      const arg = m[1];
      // `surface-desk`, `surface-sheet` … resolve to `.surface-*` rules in the CSS.
      if (declaredClasses.has(`${m[0]}`)) continue;
      if (declaredClasses.has(`surface-${arg}`)) continue;
      if ([...defined].some((t) => t === arg || t.startsWith(`${arg}-`))) continue;
      bespokeDead.push({
        at: `${relative(process.cwd(), file)}:${i + 1}`,
        token: m[0],
      });
    }
  });
}

const bespokeSites = new Set(bespokeDead.map((v) => v.at)).size;

const violations = [];
const orphans = [];

for (const file of walk(ROOT)) {
  const lines = blankComments(readFileSync(file, 'utf8')).split('\n');
  lines.forEach((line, i) => {
    for (const m of line.matchAll(REF)) {
      const name = m[1];
      if (defined.has(name)) continue;
      violations.push({
        at: `${relative(process.cwd(), file)}:${i + 1}`,
        token: name,
        used: m[0],
      });
    }
    for (const m of line.matchAll(ORPHAN)) {
      const fam = m[1];
      if (families.includes(fam)) continue; // a real family; REF already judged it
      if (STOCK.has(fam)) continue; // stock Tailwind, not this script's business
      if (STRUCTURAL.has(fam)) continue; // bg-gradient-to-r, border-l-2, ring-offset-2
      orphans.push({
        at: `${relative(process.cwd(), file)}:${i + 1}`,
        token: `${fam}-${m[2]}`,
        used: m[0],
      });
    }
  });
}

const total = violations.length;
// The BUDGET is denominated in SITES, not references, because a site is the unit
// you actually edit: one line carrying `hover:bg-newsprint-700` and
// `border-newsprint-700` is two dead references but a single fix, and budgeting
// it as two would make the ratchet lie about the work remaining.
const sites = new Set(violations.map((v) => v.at)).size;
const orphanSites = new Set(orphans.map((v) => v.at)).size;

const byToken = new Map();
for (const v of violations) {
  if (!byToken.has(v.token)) byToken.set(v.token, []);
  byToken.get(v.token).push(v.at);
}

console.log(
  `token integrity: ${sites} site(s) / ${total} reference(s) to undefined colour token(s) (budget ${BUDGET})`
);
console.log(
  `token integrity: ${orphanSites} site(s) referencing a token family that no longer exists`
);
console.log(
  `token integrity: ${stockSites} site(s) / ${stockRefs.length} reference(s) on a stock Tailwind ramp (budget ${STOCK_BUDGET})`
);
console.log(
  `token integrity: ${bespokeSites} site(s) naming a bespoke utility whose argument does not exist`
);
console.log(`  ${defined.size} token(s) defined across ${families.length} famil(ies): ${families.join(', ')}`);

if (bespokeDead.length) {
  console.log('\ndead bespoke utility argument(s):');
  for (const v of bespokeDead) console.log(`  ${v.token}\n      ${v.at}`);
  console.log(
    '\nThese name a hand-authored utility in `index.css` whose argument resolves to\n' +
      'nothing — no token of that name and no `.class` of that name. They compile\n' +
      'and render, which is the trap: `text-glow-phosphor` falls back to plain text\n' +
      'instead of failing loudly, so the feature reads as "working but unstyled".\n' +
      'Either point them at a token in `@theme`, or declare the utility in the\n' +
      'stylesheet. `ring-offset-2` and friends are lengths, not colours, and are\n' +
      'excluded by construction.'
  );
}

if (orphans.length) {
  const byFam = new Map();
  for (const o of orphans) {
    const fam = o.token.split('-')[0];
    if (!byFam.has(fam)) byFam.set(fam, []);
    byFam.get(fam).push(o.at);
  }
  console.log('\nby missing family:');
  for (const [fam, at] of [...byFam].sort((a, b) => b[1].length - a[1].length)) {
    console.log(`  ${fam}-*  (${at.length})`);
    for (const s of at.slice(0, 12)) console.log(`      ${s}`);
    if (at.length > 12) console.log(`      ...and ${at.length - 12} more`);
  }
  console.log('\nThese families are not in @theme and are not stock Tailwind, so they');
  console.log('compile to NOTHING. This is what a family rename leaves behind when the');
  console.log('call sites are not moved with it — every element silently falls back to');
  console.log('its inherited colour, and the build stays green.');
}

if (stockRefs.length) {
  const byToken = new Map();
  for (const v of stockRefs) {
    if (!byToken.has(v.token)) byToken.set(v.token, []);
    byToken.get(v.token).push(v.at);
  }
  console.log('\nby stock ramp:');
  for (const [tok, at] of [...byToken].sort((a, b) => b[1].length - a[1].length)) {
    console.log(`  ${tok}  (${at.length})`);
    for (const s of at.slice(0, 12)) console.log(`      ${s}`);
    if (at.length > 12) console.log(`      ...and ${at.length - 12} more`);
  }
  console.log(
    '\nThese are stock Tailwind colours, not this project\'s tokens. They compile, so\n' +
      'nothing warns — but they cannot be moved by a palette change, they are invisible\n' +
      'to the contrast probe, and a warm-paper ink borrowed from a stock ramp is how the\n' +
      'crisis severity ladder ended up half-unreadable on a dark card. Point each site at\n' +
      'a step that ALREADY EXISTS in `@theme`, and check the surface it lands on — several\n' +
      'of these were contrast failures as well as theme debt. `black` and `white` are\n' +
      'exempt by design. For a reviewed one-off, mark the line `token-allow`.'
  );
}

if (total) {
  console.log('\nby missing token:');
  for (const [token, sites] of [...byToken].sort((a, b) => b[1].length - a[1].length)) {
    console.log(`  ${token}  (${sites.length})`);
    for (const s of sites) console.log(`      ${s}`);
  }
  console.log('\nThese compile to NOTHING. Tailwind emits no rule for a class whose');
  console.log('colour token is undefined, so the property silently inherits and the');
  console.log('element renders in whatever colour its ancestor had.');
  console.log('\nDo NOT add the missing step to `@theme` to silence this. Several of');
  console.log('these sites currently inherit at 8:1 or better, and adding the step');
  console.log('they name drops them to 3.96-4.36:1 — trading a legibility bug for a');
  console.log('different legibility bug while the count goes to zero. Point each');
  console.log('site at a step that ALREADY EXISTS and is contrast-correct for the');
  console.log('surface it sits on. See scripts/probe-contrast.mts.');
}

// A deleted family is NOT ratcheted. It is always a failure: unlike a missing
// step, which has a known end point, an orphan family means the palette was
// renamed underneath its own call sites, and there is no budget at which that
// is an acceptable steady state.
//
// Stock ramps are ratcheted to a separate budget, which starts at zero. Rule A's
// budget is left where it is because a missing step is a known, finite cleanup;
// Rule B's is zero because the migration is DONE, and a budget that opens at the
// count it was written to fix is a budget that never closes.
process.exit(
  sites > BUDGET || stockSites > STOCK_BUDGET || bespokeSites > 0 || orphans.length > 0 ? 1 : 0
);
