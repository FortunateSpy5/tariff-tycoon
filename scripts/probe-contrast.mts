/**
 * probe-contrast — a contrast census for the player-facing palette.
 *
 * WHY THIS EXISTS:
 * Three separate defects shipped through a green `npm run build`, and all three
 * were the same shape: text at `t-caption` (9.5px) on a saturated fill, at
 * between 1.56:1 and 2.82:1. WCAG 2.1 SC 1.4.3 has no large-text exemption
 * below 18.66px bold or 24px regular, so 4.5:1 was mandatory and all three missed
 * it. `theme:check` counts one family of backgrounds. `hover:check` counts
 * hints. `size:check` counts lines. `token:check` counts undefined tokens. None
 * of them can see a contrast ratio, which is why "the UI feels disjointed and
 * random" survived four green builds.
 *
 * WHY THIS IS A DECLARATION AND NOT A SCAN:
 * Inferring every foreground/background pairing from `className` strings is a
 * false-positive farm. `bg-newsprint-300/60` over an unknown ancestor, with a
 * `text-newsprint-700` child, is not resolvable by regex — and a gate that
 * cries wolf gets disabled. So the pairs that matter are declared by hand, with
 * the surface named, and the file asserts THAT list. The declaration is the
 * contract; the arithmetic is the check.
 *
 * The alternative — driving a headless browser and calling `getComputedStyle` —
 * is strictly more expensive and catches less, because you still have to pick
 * the elements; you just pick them in a different file. This runs in
 * `vite-node` with no browser at all, which is why it can live in `npm run build`.
 *
 * ON APCA:
 * Deliberately omitted. APCA Lc is the better model for 9.5px text and Radix
 * guarantees Lc 60 / Lc 90 for its text steps, but an approximated APCA
 * implementation is worse than none — it produces authoritative-looking numbers
 * that are subtly wrong. WCAG 2.1 is the standard with legal standing, it can
 * be checked by hand, and every number below is.
 *
 * ON ALPHA:
 * `bg-wax-500/20` over parchment is a real surface, not a transparent hole. A
 * pair declared as `wax-500@0.2 over newsprint-50` is composited in the token's
 * own space before luminance is computed. Getting this wrong is how a pair
 * measures 2.19:1 in a naive browser probe and 5.31:1 in reality.
 *
 * USAGE:  node scripts/probe-contrast.mts
 * Exits non-zero if the failing count exceeds --budget (default 0).
 *
 * WHY PLAIN `node` AND NOT `vite-node`:
 * The other three gates are dependency-free `.mjs` scripts, and this one is run
 * by `npm run build`, so it has to be too. `probe-perks.mts` is invoked as
 * `npx vite-node`, which downloads a runner on demand — fine for a manual probe,
 * wrong for the build chain, where a network fetch is not an acceptable
 * precondition for a green build. Node 22.6+ strips the type annotations
 * natively, so this needs no runner and no new devDependency.
 */

import { readFileSync } from 'node:fs';

/** ---------------------------------------------------------------- tokens -- */

/** Read `--color-<family>-<step>` out of the `@theme` block, by brace matching. */
function readThemeTokens(css: string): Map<string, string> {
  const start = css.indexOf('@theme');
  if (start === -1) throw new Error('No @theme block in src/index.css');
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
  const tokens = new Map<string, string>();
  // INVARIANT: [The Reader And The Gate Must Agree On What A Token Is]
  // This used to be `/--color-([a-z]+)-(\d{2,3})/`, which understood exactly one
  // token shape: lower-case family, two-or-three digit step. The palette has
  // since moved to word steps (`ink-1`, `line-strong`) and three-part names
  // (`term-ink-1`), so the reader silently matched nothing, every pair below
  // threw `Unknown colour token`, and the gate reported a crash instead of a
  // verdict. A census that cannot read the palette is not a census.
  //
  // The shape now mirrors `check-token-integrity.mjs` deliberately: same
  // family/step grammar, so a token that one script can see, the other can too.
  for (const m of css.slice(open, end).matchAll(
    /--color-([a-z][a-z0-9]*(?:-[a-z0-9]+)*)\s*:\s*(#[0-9a-fA-F]{3,8})\s*;/g
  )) {
    tokens.set(m[1], m[2]);
  }
  if (tokens.size === 0) {
    throw new Error(
      'probe-contrast: parsed 0 colour tokens out of @theme. Refusing to report a\n' +
        '  verdict of 0 pairs against an empty palette — see check-token-integrity.mjs.'
    );
  }
  return tokens;
}

const TOKENS = readThemeTokens(readFileSync('src/index.css', 'utf8'));

/**
 * Colours that are NOT in `@theme`, declared here so the census can measure
 * them. Two groups, both of them debt rather than design.
 */
const EXTERNAL: Record<string, string> = {
  // Stock Tailwind steps still used raw on player-facing surfaces, listed so a
  // pair naming one MEASURES rather than crashing the probe, and so the debt is
  // visible in the report instead of being one refactor away from silently
  // changing a number. Each removal should delete a line here.
  'emerald-700': '#047857',
  'red-200': '#fecaca',
  'red-400': '#f87171',
  'red-950': '#450a0a',
};

function token(name: string): string {
  const hex = TOKENS.get(name) ?? EXTERNAL[name];
  if (!hex) throw new Error(`Unknown colour token: ${name}`);
  return hex;
}

/** ------------------------------------------------------------- colour math -- */

type RGB = { r: number; g: number; b: number };

function hexToRgb(hex: string): RGB {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h.slice(0, 6), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

/** `name` or `name@0.35` — the latter composites over `over` first. */
function resolve(spec: string, over?: string): RGB {
  const [name, alphaRaw] = spec.split('@');
  const base = hexToRgb(token(name));
  if (alphaRaw === undefined) return base;
  const a = Number(alphaRaw);
  const under = hexToRgb(token(over!));
  return {
    r: base.r * a + under.r * (1 - a),
    g: base.g * a + under.g * (1 - a),
    b: base.b * a + under.b * (1 - a),
  };
}

const channel = (v: number) => {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};

function luminance(c: RGB): number {
  return 0.2126 * channel(c.r) + 0.7152 * channel(c.g) + 0.0722 * channel(c.b);
}

function wcag(fg: RGB, bg: RGB): number {
  const a = luminance(fg);
  const b = luminance(bg);
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

/** WCAG large-text threshold: 18.66px bold, or 24px regular. */
function required(px: number, bold = false): number {
  return px >= 24 || (bold && px >= 18.66) ? 3 : 4.5;
}

/* ------------------------------------------------------------------ pairs -- */

interface Pair {
  label: string;
  where: string;
  fg: string;
  bg: string;
  /** Set when `bg` is a composite and the under-surface must be named. */
  bgOver?: string;
  px: number;
  bold?: boolean;
  /**
   * Explicit threshold, overriding the size-derived one. Needed for NON-TEXT
   * pairs: WCAG 1.4.11 asks 3:1 of a control boundary, and no font size asks
   * for 3:1, so a 1px border can only be declared by naming its real bar.
   */
  min?: number;
  note?: string;
}

const PAIRS: Pair[] = [
  // ===================================================================
  // [TUNGSTEN] Every pair below is a pair the app actually renders. The
  // three that once shipped as defects are re-declared first, with the
  // number they used to be, so the fix cannot be quietly reverted.
  // ===================================================================

  // -- the three shipped defects, now re-measured on the new surfaces
  {
    label: 'Ink Refill, enabled',
    where: 'desk/ExecutiveGauges.tsx',
    fg: 'ink-1', bg: 'accent', px: 9.5, bold: true,
    note: 'SHIPPED DEFECT, was 2.82:1 on a gold fill. Most-tapped spend control.',
  },
  {
    label: 'IncomeReadout dormant rate',
    where: 'desk/IncomeReadout.tsx',
    fg: 'ink-3', bg: 'card', px: 9.5,
    note: 'SHIPPED DEFECT, was 2.19:1. A dormant faucet is the row you must read.',
  },
  {
    label: 'FLASH DIP, terminal',
    where: 'terminal/tabs/StocksOptionsTab.tsx',
    fg: 'dead-soft', bg: 'well', px: 10.5, bold: true,
    note: 'SHIPPED DEFECT, was 1.56:1 — a DEAD token silently inheriting.',
  },
  {
    label: 'FLASH DIP strip, desk',
    where: 'desk/ClickerButton.tsx',
    fg: 'dead-ink', bg: 'dead@0.2', bgOver: 'panel', px: 9.5, bold: true,
    note: 'alpha composited. A probe that ignores the /20 reads a different number and is wrong.',
  },

  // -- THE WARM LADDER. Ink on every large surface it lands on.
  { label: 'Desk body ink',        where: 'index.css .surface-desk',   fg: 'ink-1', bg: 'panel', px: 14 },
  { label: 'Sheet body ink',        where: 'ui/Card.tsx material=sheet', fg: 'ink-1', bg: 'card', px: 14 },
  { label: 'Aged doc body ink',     where: 'index.css .surface-newsprint', fg: 'ink-1', bg: 'card', px: 14 },
  { label: 'Room caption (muted)',  where: 'index.css .surround-room',  fg: 'ink-3', bg: 'ground', px: 9.5,
    note: 'ink-3 is the SOLVED caption step: the value that clears 4.5 on the worst surface it reaches.' },
  { label: 'Desk caption (muted)',  where: 'desk/IncomeReadout.tsx',    fg: 'ink-3', bg: 'panel', px: 9.5 },
  { label: 'Caption on the well',   where: 'index.css .surface-terminal', fg: 'term-ink-3', bg: 'well', px: 9.5,
    note: '5.1:1 — the tightest text pair in the app, and the reason the screen ladder stops at two steps.' },
  { label: 'Caption, nested well',  where: 'index.css .surface-terminal-well', fg: 'term-ink-2', bg: 'well-2', px: 9.5,
    note: 'nested readouts drop to term-ink-2 rather than lighten the surface.' },

  // -- THE MACHINE. The only cool, dark material in the app.
  { label: 'Terminal body',        where: 'index.css .surface-terminal',      fg: 'term-ink-1', bg: 'well',   px: 14 },
  { label: 'Terminal well body',   where: 'index.css .surface-terminal-well',  fg: 'term-ink-1', bg: 'well-2', px: 10.5 },
  { label: 'Classified bar text',  where: 'index.css .surface-classified',    fg: 'term-ink-1', bg: 'well',   px: 12 },
  { label: 'Terminal P&L up',      where: 'terminal/PriceChart.tsx',           fg: 'live-soft',  bg: 'well',   px: 9.5 },
  { label: 'Loss on terminal',     where: 'terminal/PriceChart.tsx',           fg: 'dead-soft',  bg: 'well',   px: 10.5 },
  { label: 'Heat on terminal',     where: 'terminal/PriceChart.tsx',           fg: 'accent-soft',bg: 'well',   px: 9.5 },

  // -- FILLS. Every accent is a PAIR, and every vivid is fill-only.
  //    Nothing here puts a bare vivid on a ground: on a light surface the
  //    brightest chromas measure 1.03-1.45:1 and cannot hold text at all.
  { label: 'Accent fill, dark ink',where: 'ui/RefillControl + Gauges', fg: 'ink-1',     bg: 'accent', px: 9.5, bold: true,
    note: 'the gold fill is the one vivid bright enough to take the dark ink (8.2:1).' },
  { label: 'Live fill, light text',where: 'desk/ResoluteBlotterCenter.tsx', fg: 'on-fill', bg: 'live',   px: 9.5, bold: true },
  { label: 'Dead fill, light text',where: 'desk/props/RedPhoneProp.tsx', fg: 'on-fill',  bg: 'dead',   px: 9.5, bold: true },
  { label: 'Signal fill, light text',where: 'ui/ buttons on the terminal', fg: 'on-fill', bg: 'signal', px: 9.5, bold: true },

  // -- THE FOUR CHROMATIC ROLES as text, on every surface they reach.
  { label: 'Accent text on ground', where: 'desk/ClickerButton.tsx',   fg: 'accent-ink', bg: 'ground',  px: 9.5,
    note: 'gold CANNOT be text on a light ground — every warm value clearing 4.5:1 is a brown. This is that brown, on purpose.' },
  { label: 'Accent text, selected', where: 'dump/PerkConstellation.tsx', fg: 'accent-ink', bg: 'accent-wash', px: 9.5 },
  { label: 'Live text on card',     where: 'desk/IncomeReadout.tsx',    fg: 'live-ink',   bg: 'card',    px: 19,
    note: 'the headline $/s' },
  { label: 'Live text, selected',   where: 'dump/tabs/CronyUnlocksTab.tsx', fg: 'live-ink', bg: 'live-wash', px: 9.5 },
  { label: 'Dead text on ground',   where: 'desk/props/RedPhoneProp.tsx', fg: 'dead-ink',  bg: 'ground',  px: 9.5 },
  { label: 'Dead text, crisis',     where: 'desk/props/RedPhoneProp.tsx', fg: 'dead-ink',  bg: 'dead-wash', px: 9.5 },
  { label: 'Signal text on ground', where: 'terminal tabs, legends',    fg: 'signal-ink', bg: 'ground',  px: 9.5 },
  { label: 'Signal text on the well',where: 'terminal/ legend rows',    fg: 'signal-soft',bg: 'well',    px: 9.5 },

  // -- BORDERS. WCAG 1.4.11 asks 3:1 of a CONTROL boundary and nothing of a
  //    divider between compartments, so these carry explicit thresholds
  //    rather than a font size. Conflating the two is how a UI ends up with
  //    either invisible dividers or a box drawn around every label.
  { label: 'Control border on card', where: 'ui/ inputs', fg: 'line-strong', bg: 'card', px: 12, min: 3 },
  { label: 'Control border, terminal',where: 'terminal/ inputs', fg: 'term-line-strong', bg: 'well', px: 12, min: 3 },
  { label: 'Pane hairline',         where: 'ui/PaneShell.tsx dividers', fg: 'line', bg: 'ground', px: 12, min: 1.6,
    note: 'STRUCTURAL DIVIDER, not a control. 1.4.11 does not apply; the panes separate on the value step and this only refines the edge.' },
  { label: 'Inner divider',         where: 'panel rows', fg: 'line-soft', bg: 'panel', px: 12, min: 1.1,
    note: 'decorative inner rule — exempt by being non-informative.' },
  { label: 'Crisis ring',           where: 'index.css .panic-wash-strong', fg: 'dead-ink', bg: 'ground', px: 12, min: 3,
    note: 'the alarm ring is the loudest border in the app and it owes 3:1.' },

  // -- KNOWN ORDERING DEBT, declared rather than hidden. Neither is a contrast
  //    failure; both are wrong-brightness failures, which this probe measures
  //    only indirectly. They are here so the DIMMER/LESS pair stays visible.
  {
    label: 'Locked tab',
    where: 'ui/PaneShell.tsx',
    fg: 'term-ink-3', bg: 'well-2', px: 10.5,
    note: 'ORDERING, not contrast. It was a dead token inheriting, which made the SEALED tab BRIGHTER than the open one. The pair below is the sibling it must stay dimmer than.',
  },
  {
    label: 'Open tab, for comparison',
    where: 'ui/PaneShell.tsx',
    fg: 'term-ink-2', bg: 'well-2', px: 10.5,
    note: 'the sealed tab must be the DIMMER of the two.',
  },
  {
    label: 'Hotkey OFF state',
    where: 'hud/HotkeyFooterHUD.tsx',
    fg: 'term-ink-3', bg: 'well-2', px: 9.5,
    note: 'must stay well under the ON state (accent-soft) or the key no longer reads as off.',
  },
];

/* ------------------------------------------------------------------ report -- */

const budgetArg = process.argv.indexOf('--budget');
const BUDGET = budgetArg > -1 ? Number(process.argv[budgetArg + 1]) : 0;

const results = PAIRS.map((p) => {
  const bg = p.bgOver ? resolve(p.bg, p.bgOver) : resolve(p.bg);
  const fg = resolve(p.fg);
  const actual = wcag(fg, bg);
  const need = p.min ?? required(p.px, p.bold);
  return { ...p, actual, need, pass: actual >= need };
});

const failing = results.filter((r) => !r.pass);
const pad = (s: string, n: number) => s.padEnd(n);

console.log(`contrast probe: ${results.length - failing.length}/${results.length} pair(s) pass WCAG 2.1 (budget ${BUDGET} failing)\n`);
for (const r of results) {
  const verdict = r.pass ? 'ok  ' : 'FAIL';
  console.log(
    `  ${verdict} ${r.actual.toFixed(2).padStart(5)}:1  (need ${r.need.toFixed(1)})  ${pad(r.label, 26)} ${r.px}px  ${r.fg} on ${r.bg}${r.bgOver ? ` over ${r.bgOver}` : ''}`
  );
  if (r.note) console.log(`         ${pad('', 26)} ${r.note}`);
}
console.log(`\n  ${failing.length} failing.`);

process.exit(failing.length > BUDGET ? 1 : 0);
