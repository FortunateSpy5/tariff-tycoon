/**
 * Player Move Candles — the ONE place a causal marker may be stamped.
 *
 * INVARIANT: [Only Player-Caused Moves Mark Candles]
 * AGENTS.md requires that "stock crashes must be causally triggered by player
 * YAPs and tariffs, never purely passive background RNG." The chart turns that
 * promise into something the player can SEE, which means the marker has to be
 * as trustworthy as the rule behind it: a scar on a candle the player did not
 * cause is a lie about causality, and it is worse than no chart at all.
 * So the marker is deliberately NOT reachable from the price model. Tariff
 * drag, a random walk and a passive drift all print prices, and none of them
 * may come through here — only the two player-driven events, the YAP crash and
 * the walk-back recovery rally.
 *
 * INVARIANT: [Accumulate Before Marking]
 * The printed price is folded into the series FIRST, then the last bucket is
 * marked. Reversing that would put the scar on the quiet bucket the player was
 * reading a moment ago, while the damage sat in an unmarked candle beside it —
 * the one arrangement in which a correctly-computed marker actively misleads.
 * Accumulating first also makes the legacy-save path safe: `markPlayerMove` on
 * an `undefined` series seeds a candle at price 0, which would stretch the
 * chart's y-domain down to nothing and flatten every real candle into a line.
 *
 * INVARIANT: [Severity Is Read Back, Never Typed]
 * Callers pass a magnitude derived from the prices their engine just returned.
 * A hardcoded literal at the call site would silently desync from
 * `WALK_BACK_PUMP_MULTIPLIER` the first time somebody tuned that constant,
 * which is precisely the "tooltip quotes a number the simulation does not
 * use" failure AGENTS.md calls out at the exact moment the player risks money.
 *
 * PURE: no React, no store, no audio. Numbers in, one series out.
 */

import { accumulateCandle, markPlayerMove } from './candleEngine';
import type { PriceCandle } from '../../types/market';

/**
 * The fraction a price actually moved, `0..1`.
 *
 * INVARIANT: a zero or negative `priorPrice` returns `0` rather than dividing.
 * Every print in the game is floored above 0 (`MIN_PRICE`), so this is
 * unreachable in practice — but a `NaN` severity would propagate into the
 * marker and render a candle no scale can place, and a chart is the wrong place
 * to discover a divide-by-zero.
 */
export function moveMagnitude(priorPrice: number, newPrice: number): number {
  return priorPrice > 0 ? Math.abs(newPrice - priorPrice) / priorPrice : 0;
}

/**
 * Record a player-caused price move and mark the bucket it landed in.
 *
 * @param candles    Existing series, oldest first. `undefined` on a pre-candle save.
 * @param newPrice   The price the engine JUST printed for this event.
 * @param magnitude  Size of the marker, `0..1`, from `moveMagnitude` or from the
 *                   crash engine's own `crashSeverity`.
 * @param direction  Which way THIS move went, from `directionOf`.
 * @param now        `Date.now()` at the moment of the move.
 */
export function stampPlayerMove(
  candles: PriceCandle[] | undefined,
  newPrice: number,
  magnitude: number,
  direction: 1 | -1,
  now: number
): PriceCandle[] {
  return markPlayerMove(accumulateCandle(candles, newPrice, now), magnitude, direction, now);
}

/**
 * Which side of its own print a move landed on.
 *
 * INVARIANT: [Computed From The Move's OWN Two Prices]
 * Not from the bucket's open, and not from the live price. A clarification
 * window is 8s against a 2s bucket, so the crash and its rally usually share a
 * bucket whose open is the pre-crash price — reading direction off the bucket
 * reported the rally as a further 65% crash. `priorPrice` is whatever the price
 * was immediately before this specific event printed.
 */
export function directionOf(priorPrice: number, newPrice: number): 1 | -1 {
  return newPrice >= priorPrice ? 1 : -1;
}
