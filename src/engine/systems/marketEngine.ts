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
 *   \epsilon \sim U(-0.49, 0.51) \cdot \sigma_i
 */

import { PARODY_NATIONS } from '../../constants/nations';
import type { StockDefinition, StockSymbol } from '../../types/market';

/** Maximum retained price-history samples per symbol. */
const PRICE_HISTORY_LENGTH = 20;

/** Floor price. A stock can never print below this, even in a total collapse. */
const MIN_PRICE = 0.5;

/** How strongly $PAIN tracks its constituents. */
const PAIN_CONSTITUENT_BETA = 0.04;

/**
 * Tariff pressure applied to a stock's price drift.
 *
 * A punitive tariff (>100%) depresses drift; generous relief (<50%) produces a
 * small rally. This is what makes the YAP → tariff → short loop *causal*: the
 * player's own trade policy moves the market they are betting on.
 */
function tariffPressureFor(symbol: StockSymbol, tariffRates: Record<string, number>): number {
  let pressure = 0;
  PARODY_NATIONS.forEach((nation) => {
    if (!nation.linkedStocks.includes(symbol)) return;
    // INVARIANT: [No Free Lunch At Customs] — an absent key reads as 0, NEVER as
    // `nation.defaultTariffRate`. Both `deskSlice` and `BilateralTariffsTab`
    // already treat a missing key as "not tariffed"; this was the last read
    // still disagreeing, so a save migration or a newly-added nation without a
    // desk default would have applied a silent 175% punitive drag while every
    // UI surface displayed 0% and a relief rally. P0-2 ("all six dials start at
    // ZERO") is only coherent if the simulation's read agrees with the display.
    const rate = tariffRates[nation.id] ?? 0;
    if (rate > 100) {
      pressure -= ((rate - 100) / 100) * 0.0004;
    } else if (rate < 50) {
      pressure += 0.0002;
    }
  });
  return pressure;
}

/** $PAIN is a composite index and tracks trade pressure twice as hard. */
function painTariffPressure(tariffRates: Record<string, number>): number {
  let pressure = 0;
  PARODY_NATIONS.forEach((nation) => {
    if (!nation.linkedStocks.includes('PAIN')) return;
    // Same [No Free Lunch At Customs] fallback — see `tariffPressureFor`.
    const rate = tariffRates[nation.id] ?? 0;
    if (rate > 100) {
      pressure -= ((rate - 100) / 100) * 0.0006;
    } else if (rate < 50) {
      pressure += 0.0003;
    }
  });
  return pressure;
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
 */
export function tickMarketPrices(
  stocks: Record<StockSymbol, StockDefinition>,
  tariffRates: Record<string, number>,
  rand: () => number = Math.random
): MarketTickResult {
  const updated = {} as Record<StockSymbol, StockDefinition>;
  let constituentSum = 0;
  let constituentCount = 0;

  (Object.keys(stocks) as StockSymbol[]).forEach((sym) => {
    if (sym === 'PAIN') return;
    const s = stocks[sym];

    const noise = (rand() - 0.49) * 0.01 * s.volatilityMultiplier + tariffPressureFor(sym, tariffRates);
    const nextPrice = Math.max(MIN_PRICE, +(s.currentPrice * (1 + noise)).toFixed(2));

    updated[sym] = { ...s, currentPrice: nextPrice, priceHistory: pushHistory(s.priceHistory, nextPrice) };
    constituentSum += nextPrice;
    constituentCount += 1;
  });

  const averageConstituent = constituentCount > 0 ? constituentSum / constituentCount : 100;

  // $PAIN: the benchmark composite, reflecting constituents and Strike Republic
  // trade pressure.
  const painStock = stocks['PAIN'];
  if (painStock) {
    const noise = (rand() - 0.495) * 0.004;
    const targetPain = Math.max(
      10,
      +(painStock.currentPrice * (1 + noise + painTariffPressure(tariffRates)) +
        (averageConstituent - 100) * PAIN_CONSTITUENT_BETA).toFixed(2)
    );
    updated['PAIN'] = {
      ...painStock,
      currentPrice: targetPain,
      priceHistory: pushHistory(painStock.priceHistory, targetPain),
    };
  }

  return { stocks: updated, averageConstituent };
}
