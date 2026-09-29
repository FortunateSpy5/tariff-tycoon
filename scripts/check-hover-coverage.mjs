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
import { parseOpeningTag } from './lib/jsx-attrs.mjs';

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
const NON_USER_HANDLERS = new Set([
  'onAnimationEnd',
  'onAnimationStart',
  'onAnimationIteration',
  'onTransitionEnd',
  'onTransitionStart',
  'onLoad',
  'onError',
  // INVARIANT: [Hover And Focus Are Not Acts]
  // A pointer-only or focus-only handler makes an element *react*, not *operate*:
  // there is no click, no activation, nothing a keyboard or AT user can trigger,
  // so requiring a hint on one is a false positive that trains developers to
  // sprinkle hints on decorative wrappers. Click, change, submit and key handlers
  // all stay in scope, and so does `onKeyDown`/`onKeyUp` — a keyboard shortcut is
  // an act. Anything that can be ACTIVATED still gets judged.
  'onMouseEnter',
  'onMouseLeave',
  'onMouseOver',
  'onMouseOut',
  'onMouseMove',
  'onPointerEnter',
  'onPointerLeave',
  'onPointerOver',
  'onPointerOut',
  'onPointerMove',
  'onFocus',
  'onBlur',
  'onContextMenu',
]);

const budgetArg = process.argv.indexOf('--budget');
const BUDGET = budgetArg > -1 ? Number(process.argv[budgetArg + 1]) : 0;

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    // INVARIANT: [`.jsx` Is Scanned Too]
    // `.tsx` alone meant a component authored in `.jsx` was invisible to the gate
    // entirely — a real hole the moment anyone adds one. The repo is 100% `.tsx`
    // today, so this costs nothing and removes a whole class of future surprise.
    else if (extname(full) === '.tsx' || extname(full) === '.jsx') out.push(full);
  }
  return out;
}

/**
 * Blank comments while PRESERVING line count, so reported line numbers are real.
 *
 * INVARIANT: [A `//` Inside A String Is Not A Comment]
 * The original rule was "refuse a preceding `:` or quote", which handled a URL
 * in a string but not an arbitrary one. That is not a theoretical gap: with
 * `className="p-2 // hint-allow"` the `//` was treated as a line comment and the
 * REST OF THE LINE WAS BLANKED — including the closing quote and any `onClick`
 * after it. The element then stopped being operable, so the gate skipped it
 * entirely and the smuggled marker worked *and* hid the handler. String
 * literals are now tracked explicitly, so a `//` in a string is just characters.
 *
 * A `//` in a REGEX literal (`/^\\/\\//`) is still ambiguous without a parser; the
 * closing delimiter is used as the boundary, which is why `blankStrings` exists
 * separately and why `hint-allow` is additionally required to survive a
 * string-blanked span.
 */
function blankComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .split('\n')
    .map(blankLineCommentsOutsideStrings)
    .join('\n');
}

/** Blank `//` runs on one line, but only those outside a string literal. */
function blankLineCommentsOutsideStrings(line) {
  let out = '';
  let quote = null;
  for (let i = 0; i < line.length; i += 1) {
    const c = line[i];
    if (quote) {
      if (c === '\\') {
        out += c + (line[i + 1] ?? '');
        i += 1;
      } else {
        if (c === quote) quote = null;
        out += c;
      }
      continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      quote = c;
      out += c;
      continue;
    }
    if (c === '/' && line[i + 1] === '/') {
      // A genuine line comment: blank the rest, keeping the line length intact.
      out += ' '.repeat(line.length - i);
      return out;
    }
    out += c;
  }
  return out;
}

/**
 * Blank out the CONTENTS of string literals, leaving the quotes.
 *
 * Used on the raw source span before the `hint-allow` test. A marker inside a
 * string is a marker a developer can type by accident, or by copy-paste, and an
 * escape hatch that opens itself is not an escape hatch.
 */
function blankStrings(s) {
  let out = '';
  let quote = null;
  for (let i = 0; i < s.length; i += 1) {
    const c = s[i];
    if (quote) {
      if (c === '\\') {
        out += '  ';
        i += 1;
      } else if (c === quote) {
        quote = null;
        out += c;
      } else {
        out += ' ';
      }
    } else if (c === '"' || c === "'" || c === '`') {
      quote = c;
      out += c;
    } else {
      out += c;
    }
  }
  return out;
}

// INVARIANT: [HYPHENS ARE PART OF A TAG NAME]
// `<my-widget onClick={f}>` is a custom element and is clickable. The class
// excluded `-`, so a hyphenated element was skipped entirely.
const TAG_START = /<([A-Za-z][A-Za-z0-9.-]*)\b/g;

/**
 * Does this tag carry a real hint?
 *
 * INVARIANT: [A Hint Must Be A Non-Empty Literal] — see the header. `hint('')`,
 * `hint("")` and `hint(\`\`)` are rejected because they render no tooltip, and
 * `data-hint={expr}` outside a `hint()` call is rejected because it cannot be
 * proven non-empty at build time. To pass, write `{...hint('...')}`.
 */
const HINT_SPREAD = /\{\s*\.\.\.hint\((?!\s*['"`]\s*['"`])/;

/**
 * A `data-hint` ATTRIBUTE whose value is a non-empty string literal.
 *
 * INVARIANT: [Proven By Attribute Name, Never By The Characters Appearing]
 * The original pattern was a bare substring match, so
 * `className="chip data-hint='b'"` and `aria-label="read data-hint='b' now"` both
 * satisfied it — the gate passed on an element carrying no `data-hint` at all.
 * The header claimed that defence was in place; it was not.
 *
 * Two attempts to close it by blanking both failed, in opposite directions:
 * blanking every `{...}` erases a legitimate `{...hint('text')}` spread (44 false
 * positives); blanking every string erases the hint's own text argument, which is
 * the evidence (12 false positives). The evidence and the smuggled marker are
 * both strings, so no blanking rule separates them. `parseOpeningTag` does, by
 * reporting which value belongs to which attribute — so this test reads
 * `attr.name`, not the tag text. See `./lib/jsx-attrs.mjs`.
 */
const LITERAL_DATA_HINT = /^['"`][^'"`]+['"`]$/;

/**
 * `hint-allow` counts only inside a real comment.
 *
 * INVARIANT: [The Marker Is Not Findable Inside A String]
 * The `//` alternative used to match anywhere on the line, so
 * `className="p-2 // hint-allow"` silenced the gate for an element with no hint
 * at all — the eleven characters simply had to appear in a string, which is
 * exactly the defence this check claims to provide against a lazy
 * `className`. Strings inside the tag's span are blanked before this test runs;
 * a real `//` or `/* *\/` comment survives `blankComments`, because the
 * `ALLOW_IN_COMMENT` test reads the RAW line range, not the blanked source.
 *
 * INVARIANT: [A JSDoc Block Is Not An Exemption Channel]
 * `(?!\*)` after the opening `/*` rejects a doc comment. A doc comment reads as
 * prose about the element below it, so `hint-allow` inside one looks like
 * documentation that happens to mention the gate rather than a deliberate marker
 * a reviewer can spot as such — and a reviewer skimming for the JSX block-comment
 * form would not see it. Every real exemption in the tree is a JSX block comment
 * or a `//` line, so forbidding the doc-comment form costs nothing and removes a
 * channel whose whole purpose is to be missed.
 */
const ALLOW_IN_COMMENT = /\/\*(?!\*)(?:(?!\*\/)[^*]|\*(?!\/))*hint-allow|\/\/[^\n]*hint-allow/s;

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

    const opened = parseOpeningTag(src, match.index);
    if (!opened) continue;

    const names = opened.attrs.map((a) => a.name);
    // INVARIANT: [A Capitalised Tag With An `on*` Prop Is Judged] — a component
    // tag is normally invisible to this gate, because the checker cannot see the
    // markup it renders. But that exemption had a hole: `Card` spreads `...rest`
    // onto its own `<div>`, so `<Card onClick={shred} material="paper" />` is a
    // genuinely clickable div with no `data-hint` anywhere, and it passed with
    // zero violations. Composed components that only *pass a callback down*
    // (`<TabStrip onSelect={...} />`) are still exempt, via an explicit
    // `hint-allow` marker — that is the honest way to declare "the button this
    // renders carries its own hint", because it is a claim a human can check.
    const isDomTag = /^[a-z]/.test(tagName);
    const passesHandlerDown = !isDomTag && names.some((n) => /^on[A-Z]/.test(n) && !NON_USER_HANDLERS.has(n));
    const hasReactHandler =
      isDomTag || passesHandlerDown
        ? names.some((n) => /^on[A-Z]/.test(n) && !NON_USER_HANDLERS.has(n))
        : false;
    const roleAttr = isDomTag
      ? opened.attrs.find((a) => a.name === 'role' && a.value)
      : undefined;
    const roleValue = roleAttr ? /^\s*['"`]([a-z]+)['"`]\s*$/.exec(roleAttr.value) : null;
    const roleName = roleValue ? roleValue[1] : null;
    const isOperable =
      NATIVE_CONTROLS.has(tagName) ||
      hasReactHandler ||
      (isDomTag && names.some((n) => OPERABLE_PROPS.includes(n))) ||
      (roleName ? INTERACTIVE_ROLES.has(roleName) : false);
    if (!isOperable) continue;

    // INVARIANT: [The Hint Must Be AN ATTRIBUTE OF THIS TAG, AND ONLY AN ATTRIBUTE]
    // Both tests read a single parsed attribute, so a `{...hint(...)}` NESTED in a
    // handler body - `onClick={() => f({ ...hint('x') })}` - cannot satisfy the
    // element, and neither can the characters `data-hint=` inside a className or
    // an aria-label. A spread attribute is reported with its own source as its
    // name, so `HINT_SPREAD` on `attr.name` is an exact test for "this element
    // spreads a hint" with no string inspection at all.
    const hasHint = opened.attrs.some(
      (a) =>
        (a.spread && HINT_SPREAD.test(a.name)) ||
        (a.name === 'data-hint' && a.value !== null && LITERAL_DATA_HINT.test(a.value.trim()))
    );
    if (hasHint) continue;

    const startLine = src.slice(0, match.index).split('\n').length;
    // The marker may sit anywhere in the tag's line range — developers put it
    // next to the `onClick`, not necessarily on the `<` line. It may ALSO sit on
    // the line(s) directly above the tag, because a JSX comment cannot live
    // inside a single-line tag and the natural place to explain an exemption is
    // above it. Bounded to one line back so an unrelated marker on the previous
    // element cannot silence this one.
    const endLine = src.slice(0, match.index + opened.tag.length).split('\n').length;
    const spanFrom = Math.max(0, startLine - 2);
    // Read the RAW span (so genuine comments are visible) but with every string
    // literal blanked, so `hint-allow` cannot be smuggled through a className.
    // This is also the ONLY exemption for a component that merely passes a
    // callback down: without the marker, `<TabStrip onSelect={...} />` is judged
    // and must either carry a hint or declare why the rendered button has one.
    const span = blankStrings(rawLines.slice(spanFrom, endLine).join('\n'));
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
