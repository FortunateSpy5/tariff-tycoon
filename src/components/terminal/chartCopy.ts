/**
 * Chart Copy — every word the tape chart speaks, and nothing else.
 *
 * WHY A SEPARATE MODULE
 * `chartHaptics` decides where a wick ends. This decides what the chart is
 * CALLED. The split is not tidiness: the geometry is a record and the copy is a
 * promise, and AGENTS.md makes a false claim a defect while leaving records
 * alone. Keeping them apart means a wording change cannot quietly move a
 * coordinate, and a coordinate change cannot quietly reword a claim.
 *
 * INVARIANT: [Stated Numbers Are True]
 * Every figure is read from `candleEngine`, `constants/balance.ts` or the candles
 * themselves at call time. Nothing here holds a literal percentage or a literal
 * duration: the bucket width comes from `CANDLE_INTERVAL_MS` and the window
 * length from the series the engine actually printed, so retuning either retunes
 * the sentence with it.
 *
 * INVARIANT: [A Move Is Named For What It Did]
 * Two player actions mark a candle and they move the price in OPPOSITE
 * directions — a YAP crashes it, a walk-back clarification pumps it. Copy that
 * hardcoded one verb and one sign reported a successful clarification as a crash
 * that failed to crash, which is the single most confusing lie this chart could
 * tell: it would read as the game's own mechanics being broken.
 */

import { CANDLE_INTERVAL_MS } from '../../engine/systems/candleEngine';
import type { PriceCandle } from '../../types/market';
import { PLOT_H, PLOT_Y, finite, newestImpact, type ImpactMark, type PlotScale } from './chartHaptics';

/** Seconds of tape one candle spans. Mirrors the engine's own bucket width. */
const BUCKET_SECONDS = CANDLE_INTERVAL_MS / 1000;

/** Minimum vertical gap between two price-axis labels, in viewBox units. */
const AXIS_GAP = 9;

export interface AxisLabel {
  y: number;
  text: string;
  tone: 'edge' | 'base';
}

/**
 * Max, base and min, nudged apart.
 *
 * The nudge is not cosmetic: `scaleSeries` floors the span at 1e-9, so on a flat
 * tape the base and min labels land a couple of units apart and overprint each
 * other into a smudge — exactly when the player most needs to read the base rule.
 */
export function axisLabels(scale: PlotScale, basePrice: number): AxisLabel[] {
  const base = finite(basePrice, 0);
  // INVARIANT: [No Label For A Price The Plot Does Not Contain]
  // A base outside the domain has no y to sit at. Labelling it anyway made
  // `scale.y(base)` clamp it to the frame edge, printing a BASE price the
  // chart's own range excludes — the axis claiming a datum the plot does not
  // hold. The header still states the drift in dollars, so nothing is hidden.
  const labels: AxisLabel[] = [
    { y: scale.y(scale.max), text: axisPriceLabel(scale.max), tone: 'edge' as const },
    ...(scale.baseOnScale
      ? // INVARIANT: [The Base Label Is The Price ALONE, Marked By Colour]
        // This read `BASE $220.00` — 63px of text in a 46-unit gutter, so it
        // overflowed the card and was clipped by the cockpit's `overflow-hidden`.
        // The word "BASE" is redundant: the label is already gold against the two
        // phosphor edge labels, the dashed rule it annotates is gold too, and the
        // header says "VS BASE" on every frame. Four extra characters bought no
        // information and cost the number's legibility. The tone carries the
        // distinction, which is the whole reason `AxisLabel` has one.
        [{ y: scale.y(base), text: axisPriceLabel(base), tone: 'base' as const }]
      : []),
    { y: scale.y(scale.min), text: axisPriceLabel(scale.min), tone: 'edge' as const },
  ].sort((a, b) => a.y - b.y);
  for (let i = 1; i < labels.length; i += 1) {
    if (labels[i].y - labels[i - 1].y < AXIS_GAP) labels[i].y = labels[i - 1].y + AXIS_GAP;
  }
  // INVARIANT: [Separation Must Not Cost Legibility]
  // Separating the labels can demand more room than the frame has. On a
  // dead-flat tape all three start within 0.06u of the lower edge, so the nudge
  // overshoots and the LOW price — the number a player most wants off this chart
  // — gets printed over the time axis. Two earlier drafts tried to rescue the
  // nudge by translating the whole stack, and both failed: shifting up fixed the
  // bottom and pushed the MAX off the top, and shifting down did the reverse,
  // because the two corrections were measured after the other had been applied.
  // The stack here needs 99.9u of a 96u frame, so no translation exists.
  //
  // Resolution, in priority order: a label on screen beats an ideal gap. Clamp
  // the bottom label to the frame edge and give up the remainder of the gap; the
  // pair keeps whatever separation it naturally had, which is still readable.
  // Only the LAST label is adjusted, so no earlier pair is re-collided.
  const overflow = labels[labels.length - 1].y - (PLOT_Y + PLOT_H);
  if (overflow > 0) {
    labels[labels.length - 1].y -= overflow;
    // A clamp can re-collide the pair, so re-open the gap using whatever room the
    // frame still has above the label before it.
    const room = labels[labels.length - 1].y - labels[labels.length - 2].y;
    if (room < AXIS_GAP) labels[labels.length - 2].y = labels[labels.length - 1].y - AXIS_GAP;
  }
  return labels;
}

/**
 * The suffixes, largest first, with the divisor each one implies.
 *
 * INVARIANT: [ABBREVIATE ON WIDTH, NOT ON A ROUND NUMBER]
 * The gutter is ~44px and the tier is a 10.5px monospace, so a label is about
 * 5.9px per character — roughly SEVEN characters including the `$`. Anything
 * longer clips, and the cockpit's `overflow-hidden` eats the overflow silently.
 *
 * The previous thresholds (`$1.10K` only above $1M) were chosen as round numbers
 * and were wrong: `$5,383.17` is nine characters and overflowed by 4.7px on
 * `$PAIN`, which is the single most-watched ticker in the game. The fix is to
 * abbreviate on the measurement rather than on the milestone.
 *
 * The M row starts at 999_000 rather than 1e6 so a price just below a million
 * cannot round UP into a longer K label (`$999999` → `$1000.0K`, eight
 * characters). The two branches agree to within 0.1% across the overlap, so
 * nothing changes meaning at the seam.
 */
const AXIS_SUFFIXES: ReadonlyArray<{ min: number; divisor: number; suffix: string }> = [
  // INVARIANT: the top row must cover the game's ceiling, or the fallback below
  // it fires. GDD §10 tops the arc out at $10^42, so the ladder has to reach past
  // that; `Oc` at 1e39 does, and every row is a multiple of 1e6 so the mantissa
  // never needs more than one digit before the suffix.
  { min: 1e39, divisor: 1e39, suffix: 'Oc' },
  { min: 1e36, divisor: 1e36, suffix: 'Sp' },
  { min: 1e30, divisor: 1e30, suffix: 'No' },
  { min: 1e24, divisor: 1e24, suffix: 'Dc' },
  { min: 1e18, divisor: 1e18, suffix: 'Qi' },
  { min: 1e12, divisor: 1e12, suffix: 'T' },
  { min: 1e9, divisor: 1e9, suffix: 'B' },
  { min: 999_000, divisor: 1e6, suffix: 'M' },
  { min: 1e4, divisor: 1e3, suffix: 'K' },
];

/**
 * Characters the gutter can hold.
 *
 * INVARIANT: MEASURED IN THE BROWSER, NOT ASSUMED.
 * The gutter is 46 units of a 320-wide viewBox, which is ~44px at the chart's real
 * width, and the `t-caption font-mono` tier advances a uniform 5.225px per
 * character — measured in-page, including the `$`, the `.` and the `-`, which are
 * the same width as a digit in this face. So 8 characters is 41.8px and fits with
 * 2px to spare, while 9 is 47px and clips.
 *
 * The first attempt budgeted 7 against an ASSUMED 5.9px/char, which was wrong in
 * the safe direction: it threw away a character the gutter could hold and forced
 * `-$10.0Qi` down a precision it did not need. Measuring beat guessing, again.
 */
const AXIS_MAX_CHARS = 8;

/**
 * An axis price, formatted to fit the gutter and no further.
 *
 * INVARIANT: [CENTS ARE DROPPED FIRST, THE UNIT IS NEVER DROPPED]
 * At four figures the cents are noise — nobody acts on the difference between
 * $5,383.17 and $5,383.92 across a 40-second tape — so the label loses them
 * before it loses anything else. Below $1,000 they are kept, because there they
 * are still the difference between a fill and a misread. The exact high, low and
 * live mark are in the header and the hover copy, so the axis is never the only
 * source of a number.
 */

export function axisPriceLabel(price: number): string {
  const abs = Math.abs(price);
  const sign = price < 0 ? '-' : '';
  const row = AXIS_SUFFIXES.find((r) => abs >= r.min);

  // INVARIANT: [The No-Suffix Branch Obeys The Sign Budget TOO]
  // `-${abs.toFixed(2)}` is eight characters at -$100.00, which overflows — the
  // same mistake the suffix loop was written to avoid, repeated in the branch
  // below it. Three digits minus the sign is the whole budget, so a negative
  // sub-dollar price drops its cents to `$99.5` and a positive one keeps them.
  if (!row) {
    if (abs >= 1e3) return `${sign}$${abs.toFixed(0)}`;
    if (sign && abs >= 100) return `${sign}$${abs.toFixed(1)}`;
    return `${sign}$${abs.toFixed(2)}`;
  }

  // INVARIANT: [Drop Decimals Until The Label Fits, Never Drop The Unit]
  // A negative label is one character wider than its positive twin, so a fixed
  // precision cannot serve both: a swept range to $1e17 found `-$10000.0T` at ten
  // characters, well past the gutter. Rather than a table of per-sign special
  // cases — which is where the previous three attempts all went wrong — each
  // suffix is tried at decreasing precision and the first that fits wins.
  //
  // Precision is spent before the unit is, because `-$10K` still says "ten
  // thousand, below" and a tape resolving $0.01 inside a 40-second window is
  // pretending to more resolution than it has. A suffix is never dropped: `$10K`
  // and `$10000` are the same width, so dropping it would cost a character and
  // buy nothing.
  const headroom = AXIS_MAX_CHARS - sign.length - 2 - row.suffix.length;
  for (let decimals = Math.min(2, headroom); decimals >= 0; decimals -= 1) {
    const candidate = `${sign}$${(abs / row.divisor).toFixed(decimals)}${row.suffix}`;
    if (candidate.length <= AXIS_MAX_CHARS) return candidate;
  }
  // INVARIANT: [A Price Too Wide For Its Unit Gets A BIGGER Unit, Not A Cut]
  // The game reaches $10^42 of total wealth, so a ticker can legitimately exceed
  // what `T` can express: at zero decimals a $1e30 price is eleven characters. The
  // suffixes above therefore climb to `Sp` at $1e36, and this loop picks the
  // largest one that keeps the label inside the budget. The first draft of this
  // branch divided by 1e15 and then labelled the result `M` or `Qi` while printing
  // the UNSCALED magnitude — 26 characters of `-$199999999999999967232.0Qi`. A
  // number too wide to render must still render as a number, never clipped with
  // an ellipsis that would read like a real price.
  for (let decimals = 2; decimals >= 0; decimals -= 1) {
    const candidate = `${sign}$${(abs / row.divisor).toFixed(decimals)}${row.suffix}`;
    if (candidate.length <= AXIS_MAX_CHARS) return candidate;
  }
  // Only reachable when the sign itself is the overflow: a `-` costs the one
  // character the mantissa needed, so `-$100000E5` cannot be shortened by dropping
  // decimals. Re-scale into scientific notation with a single leading digit, which
  // is the only form guaranteed to fit at any magnitude.
  const mantissa = abs / row.divisor;
  const exponent = Math.floor(Math.log10(Math.max(mantissa, 1)));
  return `${sign}$${(mantissa / 10 ** exponent).toFixed(1)}E${exponent}`;
}

export interface TimeAxis {
  /** Seconds of tape on screen. Zero only when there is no tape at all. */
  windowSeconds: number;
  left: string;
  /** Header chip: how many buckets, and how long each one holds. */
  tape: string;
}

/**
 * INVARIANT: [The Window Must Not Read As A Day]
 * A 40-second window drawn with date-like ticks is a chart lying about its own
 * scale, and a player who believes it will time a 0DTE decision off a timescale
 * forty thousand times too long. Seconds, always.
 */
export function timeAxis(candles: PriceCandle[]): TimeAxis {
  if (candles.length === 0) return { windowSeconds: 0, left: 'NO TAPE', tape: '0 PRINTS' };
  const windowSeconds =
    candles.length > 1 ? Math.max(1, Math.round((candles.at(-1)!.t - candles[0].t) / 1000)) : BUCKET_SECONDS;
  return {
    windowSeconds,
    left: candles.length > 1 ? `-${windowSeconds}s` : '1ST PRINT',
    tape: `${candles.length} × ${BUCKET_SECONDS}s`,
  };
}

/** The plotted high and low across the window, from the wicks themselves. */
function windowRange(candles: PriceCandle[]): { high: number; low: number } {
  return {
    high: Math.max(...candles.map((c) => c.h)),
    low: Math.min(...candles.map((c) => c.l)),
  };
}

/** The mark's drift from base, as text and as a direction. */
export function deltaLabel(
  currentPrice: number,
  basePrice: number
): { text: string; up: boolean; amount: number } {
  const amount = finite(currentPrice, 0) - finite(basePrice, 0);
  return {
    text: Math.abs(amount) < 0.005 ? 'FLAT' : `${amount > 0 ? '+' : '-'}${Math.abs(amount).toFixed(2)}`,
    up: amount >= 0,
    amount,
  };
}

const directionWord = (amount: number): string =>
  Math.abs(amount) < 0.005 ? 'flat on' : amount > 0 ? 'up' : 'down';

/**
 * The window chip: names which action landed, how far, and how long ago.
 *
 * INVARIANT: [The Chip Names The Action That Actually Fired]
 * Verb, sign and tone all follow the mark's direction. One hardcoded `YAP -N%`
 * would have relabelled every clarification as a dud crash, so the player would
 * read their successful pump as a broken mechanic.
 */
export function impactChip(marks: ImpactMark[]): { text: string; tone: 'crash' | 'rally' | 'calm' } {
  const last = newestImpact(marks);
  if (!last) return { text: 'NO IMPACT IN WINDOW', tone: 'calm' };
  const count = marks.length > 1 ? `x${marks.length} ` : '';
  const when = last.ageSeconds === 0 ? 'JUST PRINTED' : `${last.ageSeconds}s AGO`;
  const pct = Math.round(last.movePct * 100);
  return last.up
    ? { text: `CLARIFY ${count}+${pct}% · ${when}`, tone: 'rally' }
    : { text: `YAP ${count}-${pct}% · ${when}`, tone: 'crash' };
}

/**
 * The accessible name for the graphic, read off the real data.
 *
 * The impact clause is in it because the impact is the whole point of the chart,
 * and a screen-reader user must not be the one player who never finds out that
 * something landed.
 */
export function describeChart(
  symbol: string,
  candles: PriceCandle[],
  currentPrice: number,
  basePrice: number,
  marks: ImpactMark[]
): string {
  const base = finite(basePrice, 0);
  const amount = finite(currentPrice, base) - base;
  const last = newestImpact(marks);
  const parts = [
    `$${symbol} candlestick chart`,
    `${candles.length} two-second buckets, a ${timeAxis(candles).windowSeconds} second window`,
    `live mark $${(base + amount).toFixed(2)}, ${directionWord(amount)} ${Math.abs(amount).toFixed(2)} from the $${base.toFixed(2)} base`,
  ];
  if (candles.length) {
    const { high, low } = windowRange(candles);
    parts.push(`plotted range ${axisPriceLabel(high)} to ${axisPriceLabel(low)}`);
  }
  parts.push(
    last
      ? `${marks.length} impact${marks.length === 1 ? '' : 's'} in this window, most recent ${
          last.up ? 'a walk-back clarification' : 'a YAP'
        } ${Math.round(last.movePct * 100)}% ${last.up ? 'up' : 'down'}`
      : 'no impact in this window'
  );
  return `${parts.join('. ')}.`;
}

/**
 * Hover copy: the number, the scale, the one claim that can be misread, and the
 * one caveat that can be acted on.
 *
 * INVARIANT: [Lead With The Number The Player Acts On]
 * The previous draft ran to ~600 characters and opened on "tape, last N
 * seconds — not a session", burying the live mark under two sentences of
 * mechanism. In a 260px bubble that is a dozen lines the player has to scroll
 * past to reach the price they came for. This one opens on the mark and its
 * drift, then states the four things that are genuinely not visible anywhere
 * else: the window is seconds, the base rule may be absent, only the player's
 * own actions spike the tape, and the last candle can trail the header.
 *
 * What was cut is what the chart already shows: candle anatomy (the wick/body
 * glossary is drawn), the severity bound, the measured-excursion arithmetic, and
 * the window high/low. None of it is a lie removed — it is a duplication
 * removed, because `describeChart` and the axis labels carry all of it.
 *
 * The caveat is the load-bearing sentence. The header mark is the live tape
 * while the right-most candle closes on the last print inside a two-second
 * bucket, so the two can disagree, and a player who assumes otherwise reads a
 * fill off the wrong number.
 */
export function chartHint(
  symbol: string,
  candles: PriceCandle[],
  currentPrice: number,
  basePrice: number,
  marks: ImpactMark[],
  baseOnScale: boolean
): string {
  const base = finite(basePrice, 0);
  const amount = finite(currentPrice, base) - base;
  const drift = `${directionWord(amount)} ${Math.abs(amount).toFixed(2)}`;
  const { windowSeconds } = timeAxis(candles);
  // INVARIANT: [Never Point At A Line That Is Not Drawn]
  // The copy must not tell the player to read a dashed rule that the renderer
  // omitted because the base sits outside this window.
  const baseText = baseOnScale
    ? `Dashed rule is the $${base.toFixed(2)} base.`
    : `Base $${base.toFixed(2)} is off-window, so no rule is drawn.`;
  // INVARIANT: [No Tape Is Named, Not Given A Window Of Zero Seconds]
  // `timeAxis` reports `windowSeconds: 0` for an empty series — a legacy save, or
  // a ticker the player has not printed on yet. "0s window, not a session" would
  // be a claim about a scale that does not exist, so the copy says what is
  // actually true instead of interpolating the zero.
  const scaleText = windowSeconds === 0 ? 'No prints yet.' : `${windowSeconds}s window, not a session.`;
  return `$${symbol} $${(base + amount).toFixed(2)}, ${drift} on base. ${scaleText} ${baseText} Only your own actions spike it (${marks.length} in window). The header mark is live; the last candle can trail it by up to ${BUCKET_SECONDS}s.`;
}
