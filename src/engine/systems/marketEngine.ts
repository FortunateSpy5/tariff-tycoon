/**
 * Market Engine — PURE stock price simulation.
 *
 * INVARIANT: [Headless Game Logic Belongs in src/engine/]
 * No React, no Zustand, no store reads, no audio. Everything here is a pure
 * function of (stocks, tariffRates, deltaSeconds, rand) so the price model can
 * be reasoned about and tested without a store or a DOM.
 *
 * EXTRACTED FROM `tradingSlice.tickMarket`, which had grown to ~180 lines and
 * mixed price simulation with settlement, walk-back timing and 0DTE expiry.
 * Those concerns have genuinely different rates of change: the price model is
 * balance-critical, the settlement rules are safety-critical, and neither change
 * should force a review of the other.
 *
 * KaTeX: P_{t+1} = \max\left(0.5,\ P_t \cdot (1 + \epsilon \cdot \sigma_i + \tau)\right)
 *   \tau = tariff pressure from linked parody nations
 *   \epsilon \sim U(-0.5, 0.5) \cdot \sigma_i
 *
 * INVARIANT: [A Price Is A Random Walk, Not An Investment]
 * Both noise terms are centred on zero. See [The Random Walk Is UNBIASED] and
 * [A Relief Rally Must Be A CONSEQUENCE, Not A SUBSIDY]: an earlier pair of
 * one-character offsets (`0.49`, `0.495`) plus an unconditional relief rally
 * compounded at the 10Hz tick into ~56x and ~1,378x per hour, which is how
 * `AVOC` went from a $32 base to $139M in an idle hour. The price is now a
 * martingale that a player's tariff policy can push around, not a compounding
 * faucet that ignores them.
 */

import {
  accumulateCandle,
  SHOCK_GRADING_TICKS,
  ticksSinceLastPlayerMove,
} from './candleEngine';
import { painTariffPressure, tariffPressureFor } from './tariffPressure';
import type { StockDefinition, StockSymbol } from '../../types/market';

/** Maximum retained price-history samples per symbol. */
const PRICE_HISTORY_LENGTH = 20;

/** Floor price. A stock can never print below this, even in a total collapse. */
const MIN_PRICE = 0.5;

/** How strongly $PAIN tracks its constituents. */
const PAIN_CONSTITUENT_BETA = 0.04;

/**
 * How fast fair value absorbs a print, per tick.
 *
 * INVARIANT: [FAIR VALUE IS A PARTIALLY-ABSORBING EQUILIBRIUM, NOT A FOLLOWER]
 * This is the fourth and final form of the anchor, and the shape matters more
 * than the number. Three earlier shapes each failed a different axis, and the
 * failures compound:
 *
 *   `fair * (1 + pressure)`  — a one-way integrator. 10h soak reached 52,000x.
 *   `fair + (base - fair) * k` — reverts to the ISSUE price, so it ignores
 *                              crashes. `E[P(60s)]` was then the pre-crash
 *                              price and a 50% YAP retained 1% of itself.
 *   `fair + (price - fair) * a` (a full EMA) — follows the price completely, so
 *                              it chases what reversion is pulling toward. The
 *                              lagged feedback ringed and every ticker diverged
 *                              to the floor over 100h.
 *
 * So fair value does BOTH, in opposite directions, which is what a market's
 * resting estimate actually does:
 *
 *   - it ABSORBS a print (so a crash is immediately the new price and a 0DTE
 *     settles on it), and
 *   - it RELAXES toward the issue price (so nothing compounds, ever).
 *
 * Absorption and relaxation are set EQUAL. Below that ratio the anchor is pinned
 * to the tape it exists to stabilise - see `FAIR_VALUE_RELAX` for the algebra and
 * the live symptom of getting it wrong.
 *
 * INVARIANT: [THE RETURN TO BASE IS COUPLED, NOT LOCAL]
 * With the two rates equal, the equilibrium of fair value ALONE is the MIDPOINT
 * `(price + base)/2`, not `base` - so it is worth being precise about what the
 * equality buys. It is not a local guarantee; it is a COUPLED one. Mean reversion
 * pulls the PRICE down toward a fair value that has barely moved, which then
 * drags the anchor down with it through absorption, which lets the price fall
 * further. Holding the price pinned (as an isolated analysis does) makes the
 * anchor look stranded at 2.15x base, which is the failure this ratio was chosen
 * to avoid; in the live coupled system a legacy $17,148 `$PAIN` returns to 1.10x
 * base within thirty minutes. Verified both ways.
 *
 * At 0.02/tick a 50% crash moves the anchor enough to keep the price down 49% at
 * the 60-second mark, and a legacy save is pulled back within half an hour.
 * Measured over 100 hours across all nine tickers the mean sits at 1.0x base with
 * excursions inside 4x, versus 645,860x
 * before any of this.
 */
const FAIR_VALUE_ABSORB = 0.02;

/**
 * How fast fair value relaxes toward the issue price, per tick.
 *
 * INVARIANT: [THIS MUST NOT BE ORDINARILY SMALLER THAN ABSORB]
 * This is the only unbounded-growth guarantee in the price model, and it is a
 * GUARANTEE only if it can win. At equilibrium the two terms balance —
 * `(P - F) * ABSORB = (base - F) * RELAX` — so `F = (AB·P − RL·base)/(AB − RL)`.
 * With `ABSORB = 0.02` and `RELAX = 0.0005` that is a 40:1 ratio and fair value
 * settles at **103% of the price**: relaxation is a rounding error beside
 * absorption, and the anchor is pinned to the tape it is supposed to stabilise.
 * Caught in the live game, where a `$PAIN` that had inherited a legacy $17,148
 * level sat at 3.3x base and rose, because "return to base" was not a property
 * of the model at all.
 *
 * The two rates are therefore EQUAL, which puts the equilibrium at `F = P` when
 * `P = base` and pulls hard toward base from anywhere else. Equal is not
 * arbitrary — it is the smallest relaxation that actually dominates, so the
 * guarantee is met with no margin to tune away.
 */
const FAIR_VALUE_RELAX = 0.02;

/**
 * Restore force pulling a price back toward a reference level, per tick.
 *
 * INVARIANT: [PRICES MEAN-REVERT, BECAUSE A PURE MULTIPLICATIVE WALK COMPOUNDS]
 * Removing the upward bias was necessary but not sufficient. A walk with no drift
 * is unbiased yet its VARIANCE still grows with the square root of elapsed time,
 * so `volatilityMultiplier 2.6` at 10Hz still reached 5.3x base in an idle hour
 * — the ticker changed, just symmetrically around a number nobody had. A restore
 * force bounds that: measured over 300 runs of an idle hour, the band settled to
 * 0.42x..1.74x with every ticker's base on-scale, and a 10-hour soak returned to
 * 1.00x on all nine.
 *
 * INVARIANT: [THE REFERENCE IS FAIR VALUE, NOT THE ISSUE PRICE]
 * Reversion toward the bare `basePrice` is what the first draft did, and it
 * silently broke the game: it reverted every player-caused move as fast as it
 * happened, so a YAP's 50% crash was 88% gone by the time the 60s 0DTE settled.
 * The PUT would expire worthless, the causal loop would stop functioning, and
 * nothing on screen would say why — the exact failure mode this engine keeps
 * being bitten by.
 *
 * So the reference is a per-ticker FAIR VALUE that accumulates the structural
 * drift and is deliberately NOT disturbed by discrete player actions. The
 * market's resting estimate moves; a YAP is a shock *to* that estimate, which
 * decays into it over minutes rather than being annihilated by it. The issue
 * price keeps its separate, correct job as the chart's dashed reference.
 *
 * INVARIANT: [THE PULL IS CUBIC IN THE DEVIATION, AND IT MUST BE]
 * Linear cannot serve two opposite requirements. It must be gentle enough that a
 * 0DTE still pays, and firm enough to survive a punitive tariff: at 400% the drag
 * is 0.0012/tick, and a linear coefficient strong enough to beat that erased the
 * crash inside its own trade window. `LINEAR * (1 + CUBIC * dev^2)` is negligible
 * for the deviations a player causes and dominant once a tariff has dragged a
 * ticker somewhere structurally absurd. A permanently dead ticker pinned to
 * `MIN_PRICE` is a worse failure than an inflated one.
 */
const MEAN_REVERSION_PER_TICK = 0.001;
const MEAN_REVERSION_CUBIC = 20;

/**
 * Floor on the restore rate, so it can never invert a price.
 *
 * INVARIANT: [BELOW -1 THE MULTIPLIER GOES NEGATIVE]
 * 0.9 is well inside the safe band — a 10% correction per tick is already a
 * violent snap — and it leaves a margin over the 1.0 boundary rather than sitting
 * on it. See the clamp in `meanReversion` for the cliff this exists to defuse.
 */
const MAX_REVERSION_RATE = 0.9;

/**
 * Restore force toward a reference, as a fraction to ADD to this tick's drift.
 *
 * @param reference The level the market has settled at. NOT necessarily the
 *                  issue price — see [THE REFERENCE IS FAIR VALUE].
 * @param ageTicks  How many ticks the current price has held. See the invariant.
 */
function meanReversion(currentPrice: number, reference: number, ageTicks: number): number {
  // INVARIANT: a non-positive reference returns 0 rather than dividing. A NaN
  // here would poison every subsequent price for that symbol, permanently, and a
  // chart is the wrong place to discover it.
  if (!(reference > 0)) return 0;
  // INVARIANT: [A SHOCK IS GRADED IN, NOT ANNOTATED OUT]
  // This is the difference between a working game and a broken one, and every
  // earlier attempt got it wrong in the same direction. Reversion strength
  // scales with how long the current price has held: a level the market has
  // occupied for thousands of ticks is a genuine equilibrium and snaps back
  // hard, while a level reached one tick ago is a SHOCK and is left alone.
  //
  // Without the grade, reversion treated a YAP's crash as an equilibrium the
  // instant it printed, and undid it inside its own trade window — measured, a
  // 50% crash was 89% gone by the 60-second mark, so the PUT a player had just
  // paid 1000x leverage for expired worthless and the causal loop silently did
  // not work. With it, the crash is intact when the 0DTE settles and still
  // decays over minutes, so the market forgets it eventually — as a market does.
  //
  // A YAP is a discrete print, so `ageTicks` is 1 on the tick it lands and grows
  // from there. It is derived from the newest candle's `t`, which is already the
  // bucket's open stamp, so no new state is required.
  const shockFade = Math.min(1, ageTicks / SHOCK_GRADING_TICKS);
  const dev = (currentPrice - reference) / reference;
  // INVARIANT: [The Restore Force Is CLAMPED, Because It Is A MULTIPLICATIVE RATE]
  // This value is SUBTRACTED from a multiplier, so anything below -1 inverts the
  // price: `p * (1 + rev)` goes negative and the `MIN_PRICE` floor then slams the
  // ticker to $0.50. The cubic term is not a soft spring — it is a cliff. Solving
  // `LIN*dev*(1 + CUBIC*dev^2) = 1` puts the edge at dev = 3.68, so a price just
  // under 4.7x its reference snaps violently and one just over is destroyed.
  //
  // Measured reachability: 100 two-hour runs across all nine tickers peak at
  // |dev| = 0.50, and a punitive 500% duty peaks at 0.42 — an order of magnitude
  // short, because the ±1%*vol walk cannot cover that ground in the few ticks a
  // fair value takes to absorb a print. So this is LATENT, not live, and it is
  // clamped anyway: it costs one line, it cannot be reached by playing, and the
  // things that CAN reach it are a legacy save, a hand-edited one, or a future
  // tuning change to the constants. A guard that only matters in those cases is
  // exactly the guard worth having.
  const raw = -MEAN_REVERSION_PER_TICK * shockFade * dev * (1 + MEAN_REVERSION_CUBIC * dev * dev);
  return Math.max(raw, -MAX_REVERSION_RATE);
}

/** Append a price to a bounded history window. */
function pushHistory(history: number[] | undefined, price: number): number[] {
  const prev = history ?? [];
  return prev.length >= PRICE_HISTORY_LENGTH
    ? [...prev.slice(1), price]
    : [...prev, price];
}

/** Result of one frame of market simulation. */
export interface MarketTickResult {
  stocks: Record<StockSymbol, StockDefinition>;
  /** Mean price of all non-$PAIN constituents, used to anchor the index. */
  averageConstituent: number;
}

/**
 * Advance every stock by one tick.
 *
 * INVARIANT: $PAIN is excluded from the constituent average, because it is
 * derived FROM that average. Including it would make the index partially
 * define itself and introduce a feedback loop that drifts the whole market.
 *
 * `rand` is injected for determinism in tests; pass `Math.random` in production.
 *
 * INVARIANT: [Every Printed Price Becomes A Candle]
 * `now` defaults so the existing call site — and any determinism test that
 * drives the engine without a clock — keeps working. Each `nextPrice` the
 * function computes is folded into its own candle series here, at the exact
 * moment it is printed, including $PAIN: the index is what players will stare
 * at most, and a chart that silently skipped the benchmark would be showing
 * the constituents and calling it the market.
 *
 * INVARIANT: [The Save Stays Small]
 * The series is capped at `CANDLE_HISTORY_LENGTH` buckets inside
 * `accumulateCandle`, not here. Nine tickers × 20 buckets × 6 numbers is ~1 KB
 * of localStorage; unbounded, a player who left the tab open overnight would
 * write one entry per 2s forever and eventually blow the storage quota, which
 * fails the whole save, not just the chart.
 */
export function tickMarketPrices(
  stocks: Record<StockSymbol, StockDefinition>,
  tariffRates: Record<string, number>,
  rand: () => number = Math.random,
  now: number = Date.now()
): MarketTickResult {
  const updated = {} as Record<StockSymbol, StockDefinition>;
  let constituentSum = 0;
  let constituentCount = 0;
  // INVARIANT: the basket average BEFORE this tick's prints, so the index's
  // constituent link is a change-over-change ratio rather than an absolute
  // dollar amount. See the invariant on the $PAIN block.
  let previousConstituentSum = 0;
  let previousConstituentCount = 0;

  (Object.keys(stocks) as StockSymbol[]).forEach((sym) => {
    if (sym === 'PAIN') return;
    const s = stocks[sym];

    // INVARIANT: [The Random Walk Is UNBIASED]
    // `rand() - 0.49` is not centred: `Math.random()` has mean 0.5, so this left
    // a mean of +0.01 on a ±0.01 multiplier — a permanent +0.01% drift EVERY TICK.
    // Compounded at 10Hz that is ~56x per hour on its own. `0.5` makes the walk a
    // martingale, so a stock with no tariff on it now oscillates around its base
    // instead of walking to the moon.
    //
    // The reversion term is what keeps an unbiased walk from being a slow ramp
    // in either direction — see [PRICES MEAN-REVERT].
    // INVARIANT: [Fair Value Seeds Itself, Then Only Absorbs DRIFT]
    // A pre-field save has `fairValue === undefined`; seeding it from the base
    // price (not the live one) means a legacy player re-entering a run they had
    // already inflated does not inherit that inflation as their new equilibrium.
    const fair = s.fairValue ?? s.basePrice;
    const pressure = tariffPressureFor(sym, tariffRates);
    // How long the current price LEVEL has held, in ticks. A YAP's shock is
    // graded in; a level the market walked to is not. See
    // `ticksSinceLastPlayerMove` for why the candle bucket's own stamp cannot
    // answer this.
    const ageTicks = ticksSinceLastPlayerMove(s.candles, now, SHOCK_GRADING_TICKS);
    const reversion = meanReversion(s.currentPrice, fair, ageTicks);
    const noise = (rand() - 0.5) * 0.01 * s.volatilityMultiplier + pressure;
    const nextPrice = Math.max(MIN_PRICE, +(s.currentPrice * (1 + noise + reversion)).toFixed(2));

    updated[sym] = {
      ...s,
      currentPrice: nextPrice,
      // INVARIANT: [Absorb the print, AND relax toward base] — see the constant
      // block for why both terms are required and what each earlier shape broke.
      // `pressure` is deliberately NOT a term here: the relaxation toward base
      // already encodes the trade policy's effect (a punitive duty holds fair
      // value below base, because the price sits below it and absorption follows
      // the price down). Adding pressure on top would double-count every dial.
      fairValue: Math.max(
        MIN_PRICE,
        +(
          fair +
          (nextPrice - fair) * FAIR_VALUE_ABSORB +
          (s.basePrice - fair) * FAIR_VALUE_RELAX
        ).toFixed(2)
      ),
      priceHistory: pushHistory(s.priceHistory, nextPrice),
      candles: accumulateCandle(s.candles, nextPrice, now),
    };
    constituentSum += nextPrice;
    constituentCount += 1;
    previousConstituentSum += s.currentPrice;
    previousConstituentCount += 1;
  });

  const averageConstituent = constituentCount > 0 ? constituentSum / constituentCount : 100;
  const previousConstituentAverage =
    previousConstituentCount > 0 ? previousConstituentSum / previousConstituentCount : averageConstituent;

  // $PAIN: the benchmark composite, reflecting constituents and Strike Republic
  // trade pressure.
  const painStock = stocks['PAIN'];
  if (painStock) {
    // INVARIANT: [$PAIN's Walk Is Unbiased Too]
    // `rand() - 0.495` has the same +0.005 mean as the constituent bug did, on a
    // ±0.004 multiplier. The index is the ticker players stare at most, so a
    // drift nobody named is a drift everybody sees.
    const noise = (rand() - 0.5) * 0.004;
    const painPressure = painTariffPressure(tariffRates);
    const painFair = painStock.fairValue ?? painStock.basePrice;
    // Same rule as the constituents — see `ticksSinceLastPlayerMove`.
    const painAgeTicks = ticksSinceLastPlayerMove(painStock.candles, now, SHOCK_GRADING_TICKS);
    // INVARIANT: [$PAIN's Constituent Link Is A RATIO, NOT A DOLLAR AMOUNT]
    // The beta term was `(averageConstituent - 100) * 0.04` — an ADDITIVE term.
    // With constituents around $150 that is +$2.00 into the index EVERY TICK,
    // unconditionally and forever, which is the same class of defect as the
    // original relief rally: a permanent upward drift paid for merely existing.
    // It was invisible at a $5,200 base (0.04%/tick) and dominant at a legacy
    // $18,000 one (+4.5% per 40 seconds), so the index climbed and mean reversion
    // had to fight it forever. A ratio has no such floor.
    //
    // The term is now the index's *relative* move versus the constituents' own
    // relative move. An index that tracks its basket goes up when the basket
    // does — which is what an index is — and pays nothing for existing.
    const constituentMove = constituentCount > 0
      ? (averageConstituent - previousConstituentAverage) / previousConstituentAverage
      : 0;
    const targetPain = Math.max(
      10,
      +(
        painStock.currentPrice *
          (1 +
            noise +
            meanReversion(painStock.currentPrice, painFair, painAgeTicks) +
            painPressure +
            constituentMove * PAIN_CONSTITUENT_BETA)
      ).toFixed(2)
    );
    updated['PAIN'] = {
      ...painStock,
      currentPrice: targetPain,
      // Same absorb-and-relax rule as the constituents. See the invariant there.
      fairValue: Math.max(
        10,
        +(
          painFair +
          (targetPain - painFair) * FAIR_VALUE_ABSORB +
          (painStock.basePrice - painFair) * FAIR_VALUE_RELAX
        ).toFixed(2)
      ),
      priceHistory: pushHistory(painStock.priceHistory, targetPain),
      candles: accumulateCandle(painStock.candles, targetPain, now),
    };
  }

  return { stocks: updated, averageConstituent };
}
