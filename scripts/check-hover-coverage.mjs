/**
 * hover-coverage check
 *
 * WHY THIS EXISTS:
 * The UX audit counted 40 interactive elements and found 18 with no hover
 * context and no accessible name — every watchlist row, every leverage and
 * collateral chip, both trade buttons, the hero clicker, all three desk props,
 * every agency and upgrade button, the prestige button, and the certificate.
 * "Every element should get more context on hover" was an opinion in a plan
 * document; this makes it a number.
 *
 * MEASURED BASELINE: 43 uncovered operable elements at the commit before Phase
 * 0. (The audit's "18" counted only the elements with neither hover nor name;
 * 12 more carried a bare `title`, which this gate also rejects. 18 + 12 is not
 * 43 because the two surveys used different denominators — the audit counted
 * 40 interactive elements, the gate counts operable JSX tags including inputs
 * and handler-bearing non-buttons.)
 *
 * WHAT COUNTS AS UNCOVERED:
 *   A JSX element that is operable — a native control (button, a, input, select,
 *   textarea), OR any element carrying a React event prop (`on*`), a custom
 *   callback prop, `role` in the interactive set, `contentEditable`, or a
 *   `tabIndex` — with no `hint()` spread and no literal `data-hint`.
 *
 * INVARIANT: [A Hint Must Be A Non-Empty Literal]
 * A naive substring check passes `{...hint('')}` and `data-hint={maybe}` where
 * `maybe` is `undefined` — both of which render no tooltip at all while the
 * budget stays 0. The gate therefore requires the `hint()` builder with a
 * NON-EMPTY string literal as its first argument, which is the only shape a
 * hint can honestly take at a call site. A computed hint belongs in a headless
 * module (`stockHint.ts`, `objectiveHint.ts`) and is still accepted via
 * `...hint(` when it is a template literal or a call, because those always
 * produce text.
 *
 * `hint-allow` marks a deliberate exception. It is only honoured when it
 * appears inside a real comment and anywhere within the opening tag's line
 * range, mirroring the `theme-allow` convention — but a bare substring match
 * would be defeated by the eleven characters appearing inside any string.
 *
 * USAGE:  node scripts/check-hover-coverage.mjs [--budget 0]
 * Exits non-zero if the count exceeds --budget (default 0).
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname, relative } from 'node:path';

const ROOT = 'src/components';
/** Exemptions are relative paths, never basenames — a basename exemption would
 *  silently cover any future file that happened to share the name. */
const EXEMPT = new Set(['src/components/debug/DebugPanel.tsx']);

/** Elements that are operable by default, with or without a handler. */
const NATIVE_CONTROLS = new Set(['button', 'a', 'input', 'select', 'textarea']);

/** ARIA roles that imply operability. */
const INTERACTIVE_ROLES = new Set([
  'button',
  'checkbox',
  'link',
  'menuitem',
  'menuitemcheckbox',
  'menuitemradio',
  'option',
  'radio',
  'switch',
  'tab',
  'textbox',
]);

/** Props that make an arbitrary element operable even without an `on*` prop. */
const OPERABLE_PROPS = ['contentEditable', 'contenteditable', 'tabIndex', 'tabindex'];

/**
 * Handlers that fire from CSS, not from a user.
 *
 * INVARIANT: the gate measures whether a PLAYER can act on a thing. `onEnd`-
 * style lifecycle props are self-cleanup — the ink-splatter and floater
 * particles in `ClickerButton` remove themselves on `onAnimationEnd` — and
 * demanding a hover tooltip of them would be demanding copy for an effect.
 */
const NON_USER_HANDLERS = new Set(['onAnimationEnd', 'onAnimationStart', 'onAnimationIteration', 'onTransitionEnd', 'onTransitionStart', 'onLoad', 'onError']);

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

/**
 * Blank comments while PRESERVING line count, so reported line numbers are real.
 * The `//` form explicitly refuses a preceding `:` or quote so a URL inside a
 * string is not mistaken for a comment.
 */
function blankComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:"'`])(\/\/[^\n]*)/g, (m, p1, p2) => p1 + ' '.repeat(p2.length));
}

/**
 * Read a JSX opening tag from `<`, returning the full tag, the tag's OWN
 * attributes with every `{...}` expression value blanked out, and the tag's line
 * range.
 *
 * Braces, brackets and quotes are tracked because an arrow function inside an
 * attribute (`onClick={() => f()}`) contains a `>` that does not end the tag.
 * That is the whole reason a regex cannot do this job.
 */
function readOpeningTag(src, start) {
  let i = start;
  let depth = 0;
  let quote = null;
  while (i < src.length) {
    const c = src[i];
    if (quote) {
      if (c === '\\') i += 1;
      else if (c === quote) quote = null;
    } else if (c === '"' || c === "'" || c === '`') {
      quote = c;
    } else if (c === '{' || c === '(' || c === '[') {
      depth += 1;
    } else if (c === '}' || c === ')' || c === ']') {
      depth -= 1;
    } else if (c === '>' && depth === 0) {
      return { tag: src.slice(start, i + 1), own: blankExpressions(src.slice(start, i)) };
    }
    i += 1;
  }
  return null;
}

/**
 * Replace every balanced `{...}` group with spaces, keeping offsets stable, and
 * note which line each offset falls on. `own` is what the operability test reads
 * — a handler or a role belonging to a NESTED element must not make a parent
 * look operable.
 */
function blankExpressions(s) {
  let out = '';
  let depth = 0;
  let quote = null;
  for (let i = 0; i < s.length; i += 1) {
    const c = s[i];
    if (quote) {
      if (c === '\\') i += 1;
      else if (c === quote) quote = null;
    } else if (c === '"' || c === "'" || c === '`') {
      quote = c;
    } else if (c === '{') {
      depth += 1;
    } else if (c === '}') {
      depth -= 1;
    }
    out += depth > 0 && c !== '{' ? ' ' : c;
  }
  return out;
}

/**
 * Attribute NAMES in a blanked tag, so `data-x="onClick=1"` cannot match.
 *
 * Bare (valueless) attributes count too: JSX allows `<div contentEditable />`
 * and React reads it as `true`, so matching only `name =` would miss it.
 */
function attributeNames(own) {
  const named = [...own.matchAll(/([A-Za-z_][\w:.-]*)\s*=/g)].map((m) => m[1]);
  const bare = [...own.matchAll(/(?:^|\s)([A-Za-z_][\w:.-]*)(?=[\s/>])/g)].map((m) => m[1]);
  return [...new Set([...named, ...bare])];
}

const TAG_START = /<([A-Za-z][A-Za-z0-9.]*)\b/g;

/**
 * Does this tag carry a real hint?
 *
 * INVARIANT: [A Hint Must Be A Non-Empty Literal] — see the header. `hint('')`,
 * `hint("")` and `hint(\`\`)` are rejected because they render no tooltip, and
 * `data-hint={expr}` outside a `hint()` call is rejected because it cannot be
 * proven non-empty at build time. To pass, write `{...hint('...')}`.
 */
const HINT_SPREAD = /\{\s*\.\.\.hint\((?!\s*['"`]\s*['"`])/;
const LITERAL_DATA_HINT = /data-hint\s*=\s*['"`][^'"`]+['"`]/;

/** `hint-allow` counts only inside a real comment. */
const ALLOW_IN_COMMENT = /\/\*(?:(?!\*\/)[^*]|\*(?!\/))*hint-allow|\/\/[^\n]*hint-allow/s;

const violations = [];
let total = 0;

for (const file of walk(ROOT)) {
  const rel = relative(process.cwd(), file).replace(/\\/g, '/');
  if (EXEMPT.has(rel)) continue;

  const raw = readFileSync(file, 'utf8');
  const src = blankComments(raw);
  const rawLines = raw.split('\n');

  TAG_START.lastIndex = 0;
  let match;
  while ((match = TAG_START.exec(src)) !== null) {
    const tagName = match[1];
    // A tag ends at `<Name` followed by whitespace, `>` or `/`. Anything else is
    // text containing an angle bracket (`{'a<b'}`), not a JSX element.
    const afterName = src[match.index + match[0].length];
    if (afterName && !/[\s/>]/.test(afterName)) continue;

    const opened = readOpeningTag(src, match.index);
    if (!opened) continue;

    const names = attributeNames(opened.own);
    // INVARIANT: [Only DOM Elements Can Be Judged Here] — a capitalised tag is a
    // React component, and the gate cannot see the markup it renders. `<TabStrip
    // onSelect={...} />` is not itself operable: it passes a callback down, and
    // the button it renders carries its own hint. Judging the invocation would
    // flag every composed component in the tree. So the handler/role/tabIndex
    // tests apply to lowercase DOM tags only; a native control is judged either
    // way.
    const isDomTag = /^[a-z]/.test(tagName);
    const hasReactHandler = isDomTag && names.some((n) => /^on[A-Z]/.test(n) && !NON_USER_HANDLERS.has(n));
    const roleMatch = isDomTag ? opened.own.match(/role\s*=\s*['"`]([a-z]+)['"`]/) : null;
    const isOperable =
      NATIVE_CONTROLS.has(tagName) ||
      hasReactHandler ||
      (isDomTag && names.some((n) => OPERABLE_PROPS.includes(n))) ||
      (roleMatch ? INTERACTIVE_ROLES.has(roleMatch[1]) : false);
    if (!isOperable) continue;

    if (HINT_SPREAD.test(opened.tag) || LITERAL_DATA_HINT.test(opened.tag)) continue;

    const startLine = src.slice(0, match.index).split('\n').length;
    // The marker may sit anywhere in the tag's line range — developers put it
    // next to the `onClick`, not necessarily on the `<` line.
    const endLine = src.slice(0, match.index + opened.tag.length).split('\n').length;
    const span = rawLines.slice(startLine - 1, endLine).join('\n');
    if (ALLOW_IN_COMMENT.test(span)) continue;

    total += 1;
    violations.push(`${rel}:${startLine}  <${tagName}>`);
  }
}

console.log(`hover coverage: ${total} operable element(s) without a hint (budget ${BUDGET})`);
if (total) {
  console.log('\nlocations:');
  for (const v of violations) console.log(`  ${v}`);
  console.log("\nEvery operable element must spread `{...hint('what it costs and what it')}`");
  console.log("from components/ui/hint, or carry a `hint-allow` marker inside a comment.");
  console.log("A hint must be a non-empty literal: `hint('')` renders nothing and does not pass.");
}

process.exit(total > BUDGET ? 1 : 0);
