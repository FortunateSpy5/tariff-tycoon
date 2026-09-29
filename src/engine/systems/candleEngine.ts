/**
 * Candle Engine — PURE OHLC time-bucketing for the desk chart.
 *
 * INVARIANT: [Headless Game Logic Belongs in src/engine/]
 * No React, no Zustand, no store reads, no audio, no DOM.
 *
 * WHY THIS EXISTS
 * `marketEngine` keeps `priceHistory`: twenty closing prices at the 10 Hz tick.
 * That is two seconds of data with no open, high or low in it, so a candlestick
 * drawn from it would have to invent its wicks — the chart would show a range
 * the simulation never produced, and the player would read it as volatility.
 * This module accumulates REAL open/high/low/close into time buckets so every
 * wick on screen is a price the market actually printed.
 *
 * INVARIANT: [The Chart Is A Record, Not A Reconstruction]
 * `accumulateCandle` is fed the same `nextPrice` the market just computed. It
 * never invents, interpolates or smooths a price. A gap in the data is a gap
 * on the chart.
 *
 * INVARIANT: [Player Moves Are Marked By The Engine That Caused Them]
 * `markPlayerMove` is called from the YAP and clarification paths, not inferred
 * by the chart looking for a suspiciously large red candle. A move the player
 * did not cause — a tariff drag, a random walk — must not wear the scar of one
 * they did, or the causality the game is built on stops being visible.
 *
 * KaTeX: C_{t} = (\text{open}_t,\ \max_{i \in t} p_i,\ \min_{i \in t} p_i,\ \text{close}_t)
 * KaTeX: w_t = \frac{\max(h_t,\ c_t) - \min(l_t,\ c_t)}{\max(h_t,\ c_t) + \min(l_t,\ c_t)}
 */

import type { PriceCandle } from '../../types/market';

/**
 * How long one candle spans.
 *
 * 2s against a 20-candle window gives ~40s of visible history. At the 10 Hz
 * tick that is 20 samples per bucket — enough for the high/low to mean
 * something, and short enough that a YAP's crash is still on screen while the
 * player is reading the fill on their PUT.
 */
export const CANDLE_INTERVAL_MS = 2000;

/**
 * Milliseconds per market tick, for converting candle ages into ticks.
 *
 * INVARIANT: stated here rather than read at runtime, because `marketEngine`
 * receives `now` from its caller instead of reading the clock — which is what
 * keeps it pure and testable. If `useGameLoop`'s interval changes, this must
 * change with it or the shock grade will be measured on the wrong scale and a
 * 0DTE will stop settling on the move it was opened against.
 */
const TICK_MS = 100;

/** How many buckets the chart keeps. Bounded so the save stays small. */
export const CANDLE_HISTORY_LENGTH = 20;

/** The candle a fresh stock starts with, so the chart is never empty on load. */
export function seedCandle(price: number, now: number): PriceCandle {
  return { o: price, h: price, l: price, c: price, t: now };
}

/**
 * Ticks over which a fresh price level is treated as a shock rather than a new
 * equilibrium. The default for `ticksSinceLastPlayerMove`.
 *
 * INVARIANT: [TEN TIMES THE OPTION WINDOW, AND THE RATIO IS THE DESIGN]
 * 6000 ticks = 10 minutes at the 10Hz tick, against `TRADE_DURATION_MS` of 60s
 * (600 ticks). Reversion is a ten-minute force applied to a one-minute
 * instrument, and that ratio is the entire reason a 0DTE can settle on the YAP
 * that opened it. A window equal to the trade length would put reversion at FULL
 * strength exactly when the option settles, which is precisely backwards.
 *
 * INVARIANT: [THIS MUST EXCEED THE CHART BUFFER, OR IT IS NOT A PROPERTY]
 * `CANDLE_HISTORY_LENGTH` x `CANDLE_INTERVAL_MS` is 40 seconds — shorter than
 * this window, and shorter than the 60-second option. When the age was read by
 * scanning the candle array for a scar, the scar was evicted at t+40s and the
 * grade took a 15x step to full strength, so the realised window was 40 seconds
 * and its LENGTH was set by a constant whose stated job is how much chart to
 * keep. Reading `lastPlayerMoveAt` instead decouples them, but the relationship
 * is worth stating: if `CANDLE_HISTORY_LENGTH` or `CANDLE_INTERVAL_MS` is retuned
 * past this window, the two stop being independent and that coupling is silent.
 *
 * These are not independent constants. A grid search over both found only a narrow
 * band where the game works at all — the crash still pays at 60s, AND the 1-hour
 * price band stays inside 0.2x..3x, AND a 10-hour soak does not run away:
 *
 *     linear   grade   crash@60s   1h band        10h max
 *     0.0001   600      -47%       0.03 .. 5.78   11.9x   unbounded
 *     0.001    600      -32%       0.26 .. 1.97    1.2x   OK
 *     0.001    6000     -47%       0.31 .. 2.64    2.2x   OK  <-- chosen
 *     0.004    600      -17%       0.51 .. 1.37    1.4x   crash barely pays
 *
 * Weaker reversion cannot bound the anchor; stronger reversion eats the crash.
 */
export const SHOCK_GRADING_TICKS = 6000;

/**
 * Ticks since a ticker's newest PLAYER-CAUSED move, for grading mean reversion.
 *
 * INVARIANT: [The Age Comes From ENGINE STATE, Never From The Chart]
 * This originally scanned the candle array for a `playerMove` scar. That is wrong
 * twice over, and the second failure is the one that matters:
 *
 * 1. Scanning is O(n) per symbol per tick, and the array is a *chart* buffer.
 * 2. WORSE: `CANDLE_HISTORY_LENGTH` caps that buffer at 20 two-second buckets, so
 *    a scar survives at most 40 SECONDS. The 6000-tick grading window could then
 *    never be reached — `shockFade` ramped to 0.067 and then took a 15x STEP to
 *    1.0 the moment the scar was evicted, forty seconds into a sixty-second
 *    option. The documented "ten-minute force on a one-minute instrument" was
 *    really a 40-second force, and worse, its length was set by a constant whose
 *    stated job is "how many buckets the chart keeps": retuning the chart to 40
 *    buckets would have silently doubled the restore force on the game's core
 *    mechanic, and nothing in the chart code says so.
 *
 * So the age is read from `lastPlayerMoveAt` on the StockDefinition — engine state,
 * stamped by `stampPlayerMove`, persisted, and completely independent of anything
 * the renderer wants to draw. `gradeTicks` is then a real property of the price
 * model again.
 *
 * A level the market reached by walking there is an equilibrium and snaps back
 * immediately. A level a YAP printed is a shock, and is graded in over
 * `gradeTicks`. With no recorded move the ticker has never been shocked, so the age
 * is reported as fully graded.
 *
 * @param lastPlayerMoveAt `Date.now()` of the newest player-caused print, or 0.
 * @param gradeTicks The grading window. Defaults to `SHOCK_GRADING_TICKS`; the
 *                   parameter exists so the window can be varied in a test without
 *                   re-tuning the engine.
 */
export function ticksSinceLastPlayerMove(
  lastPlayerMoveAt: number | undefined,
  now: number,
  gradeTicks: number = SHOCK_GRADING_TICKS
): number {
  if (!lastPlayerMoveAt) return gradeTicks;
  return (now - lastPlayerMoveAt) / TICK_MS;
}

/**
 * Fold one printed price into the candle series.
 *
 * @param candles Existing series, oldest first. May be undefined for a legacy save.
 * @param price   The price the market JUST printed. Never a derived value.
 * @param now     `Date.now()` at the moment of the print.
 * @returns A NEW array. The input is never mutated — it lives in the store.
 */
export function accumulateCandle(
  candles: PriceCandle[] | undefined,
  price: number,
  now: number
): PriceCandle[] {
  const prev = candles && candles.length > 0 ? candles : [seedCandle(price, now)];
  const last = prev[prev.length - 1];

  // Open a new bucket when this print falls outside the current one's window.
  // The boundary is measured from the bucket's OPEN, not from the previous
  // print, so a long stall cannot slide every window forward and leave the
  // chart permanently one bucket behind.
  if (now - last.t >= CANDLE_INTERVAL_MS) {
    const next = [...prev, { o: last.c, h: Math.max(last.c, price), l: Math.min(last.c, price), c: price, t: now }];
    return next.length > CANDLE_HISTORY_LENGTH ? next.slice(next.length - CANDLE_HISTORY_LENGTH) : next;
  }

  // Still inside the bucket: extend its range and close.
  const merged: PriceCandle = {
    ...last,
    h: Math.max(last.h, price),
    l: Math.min(last.l, price),
    c: price,
  };
  return [...prev.slice(0, -1), merged];
}

/**
 * Stamp a player-caused move onto the most recent bucket.
 *
 * INVARIANT: [Neutral Name, Because Not Every Player Move Is A Crash]
 * This marks the YAP crash AND the walk-back clarification rally, and the second
 * one prints a HIGHER price. Calling the flag `crash` while the walk-back
 * stamped it put a red down-arrow on a green candle, and a chip reading
 * "YAP -0%" on the exact moment the player's clarification pumped the ticker —
 * a lie about the game's central mechanic, in the surface built to tell the
 * truth about it. The flag says what is actually true: the player moved it.
 *
 * INVARIANT: [The Direction Is Recorded, Never Re-derived By The Renderer]
 * The caller passes which way ITS OWN move went, because that is the only party
 * that knows. It cannot be recovered from the bucket afterwards: the window is 8s
 * and a bucket is 2s, so a YAP and its walk-back share a bucket, and the bucket
 * still closes below the pre-crash open no matter how far the rally pumped it.
 * A renderer inferring direction from `c`-vs-`o` therefore drew a red down-arrow
 * on the one move in the game that goes up.
 *
 * INVARIANT: the mark goes on the bucket the move landed in, which is the LAST
 * one — the move and the print that caused it are the same event. Marking an
 * earlier bucket would put the scar where the player was not looking.
 *
 * If a bucket is stamped twice (a YAP and its clarification inside the same 2s
 * window) the larger magnitude wins, so the marker never understates the damage.
 *
 * Callers must fold the printed price in FIRST. On an `undefined` legacy series
 * this seeds a bucket at price 0, which would stretch the chart's y-domain to
 * nothing and flatten every real candle into a line. `playerMoveCandles
 * .stampPlayerMove` owns that ordering and is the only sanctioned caller.
 */
export function markPlayerMove(
  candles: PriceCandle[] | undefined,
  magnitude: number,
  direction: 1 | -1,
  now: number
): PriceCandle[] {
  const series = candles && candles.length > 0 ? candles : [seedCandle(0, now)];
  const last = series[series.length - 1];
  const marked: PriceCandle = {
    ...last,
    playerMove: true,
    // INVARIANT: a repeat stamp OVERWRITES the direction but keeps the larger
    // magnitude. A second move in the same bucket is a LATER event, so it owns
    // the arrow — but taking the max magnitude means a small clarification on
    // top of a huge crash still renders at crash scale rather than shrinking the
    // scar the player actually dealt.
    playerMoveDirection: direction,
    playerMoveMagnitude: Math.max(last.playerMoveMagnitude ?? 0, magnitude),
  };
  return [...series.slice(0, -1), marked];
}

/**
 * Scale a series to a pixel box.
 *
 * PURE geometry, separated from the component so the maths is testable and so
 * the chart file holds no arithmetic.
 *
 * INVARIANT: [The Base Price Is A Data Point Only While It Is Cheap To Plot]
 * The base rule is how the player reads "am I up or down", so it belongs in the
 * domain — but only while including it does not wreck the candles. An earlier
 * version forced it in unconditionally: correct for a stock that drifted 5%,
 * catastrophic for one that drifted 100,000x, where the whole 40-second window
 * compressed into a 4-pixel sliver against the top of the frame with 90% dead
 * space beneath it. The candles stopped being readable at exactly the magnitude
 * this game's first phase reaches.
 *
 * So the test is not "is the base near the data" but "does the base cost the
 * plot too much": it is kept while the span it forces is within
 * `BASE_SPAN_BUDGET` of the data's own span, and dropped above that. An absolute
 * distance test was tried first and rejected — with a $180 base against a $19M
 * tape, "within 3x the range" is satisfied by a figure 100,000x smaller than the
 * data, so it read as on-scale and did nothing. The budget is measured in the
 * currency that actually matters: how much of the frame the candles get.
 *
 * A base that fails the budget is not a reference the player can use to read
 * THIS window, and nothing is hidden by dropping it — the header states the
 * drift in dollars and the watchlist row states it as a percentage.
 *
 * @param padding Fraction of the vertical range added above and below, so the
 *                extreme candle never touches the frame.
 */
export interface ChartBox {
  width: number;
  height: number;
  padding: number;
}

export interface ScaledSeries {
  /** y pixel for a given price, inverted (higher price = smaller y). */
  y: (price: number) => number;
  /** x pixel centre for candle `i` of `n`. */
  x: (i: number) => number;
  /** Candle body width in px, with the gap already subtracted. */
  bodyWidth: number;
  /** Price at the top and bottom of the plot area. */
  max: number;
  min: number;
  /**
   * Whether `basePrice` is inside the plotted domain. False means the base is
   * too far from this window to be a usable reference — see the invariant above.
   */
  baseOnScale: boolean;
}

/**
 * How much of the frame the base price may cost the candles.
 *
 * 2.5x. The data's own span plus whatever the base adds may not exceed this, so
 * the candles keep at least ~40% of the plot. A base inside the data's range
 * costs nothing and is always drawn; one that would triple the span is dropped.
 */
export const BASE_SPAN_BUDGET = 2.5;

export function scaleSeries(candles: PriceCandle[], basePrice: number, box: ChartBox): ScaledSeries {
  const highs = candles.map((c) => c.h);
  const lows = candles.map((c) => c.l);
  const dataMax = highs.length ? Math.max(...highs) : basePrice;
  const dataMin = lows.length ? Math.min(...lows) : basePrice;
  // Same relative floor as below: on a dead-flat tape an absolute 1e-9 made the
  // data's own span 1e-9, so ANY base — including one 1,000x away — fit inside
  // 2.5x of it and the base was always considered plottable.
  const dataFloor = Math.max(Math.abs(dataMax), 1) * 1e-4;
  const dataRange = Math.max(dataMax - dataMin, dataFloor);

  // The span the base would force, versus the span the tape already needs.
  const withBase = Math.max(Math.max(basePrice, dataMax) - Math.min(basePrice, dataMin), dataFloor);
  const baseOnScale = withBase <= dataRange * BASE_SPAN_BUDGET;

  const rawMax = baseOnScale ? Math.max(basePrice, dataMax) : dataMax;
  const rawMin = baseOnScale ? Math.min(basePrice, dataMin) : dataMin;
  // INVARIANT: [The Floor Is Relative To The Price, Not Absolute]
  // A flat `1e-9` floor only protects division by zero, and it is an order of
  // magnitude larger than the padding computed from it: on a dead-flat tape
  // `pad` came out ~6e-11, so the domain collapsed to a point and every candle
  // rendered pinned to the BOTTOM edge of the frame instead of centred, with the
  // price axis labels stacked on top of each other. Flooring the span at a
  // fraction of the price itself gives a flat tape a real, visible band — and
  // it scales, so it is equally invisible on a $2 stock and a $2B one.
  const floor = Math.max(Math.abs(rawMax), 1) * 1e-4;
  const range = Math.max(rawMax - rawMin, floor);
  const pad = range * box.padding;
  const max = rawMax + pad;
  const min = rawMin - pad;
  const span = Math.max(max - min, 1e-9);

  const n = Math.max(candles.length, 1);
  const slot = box.width / n;
  // Leave a 22% gap between bodies: candlesticks that touch read as a solid
  // block and the individual prints stop being countable.
  const bodyWidth = Math.max(1, slot * 0.78);

  return {
    y: (price) => box.height - ((price - min) / span) * box.height,
    x: (i) => slot * i + slot / 2,
    bodyWidth,
    max,
    min,
    baseOnScale,
  };
}
