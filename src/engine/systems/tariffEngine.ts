/**
 * Tariff Engine — PURE bilateral tariff revenue and trade-war heat.
 *
 * INVARIANT: [Headless Game Logic Belongs in src/engine/]
 * No React, no Zustand, no store reads, no audio.
 *
 * EXTRACTED FROM `deskSlice.tickDesk`, which had grown to ~134 lines mixing
 * passive income, tariff revenue, frenzy timing, ink regeneration and the
 * Crisis Call. This is the balance-critical piece: the Laffer curve is what
 * makes a punitive tariff a real trade-off rather than a strict upgrade, and
 * it deserves to be read in isolation.
 *
 * The curve is deliberately INVERTED past 250%. Tariffs below 250% scale
 * linearly, because a mild tariff is pure extractive revenue. Past that point
 * revenue decays and the nation retaliates, because a maximal tariff is a
 * trade war that costs more than it collects. Without the decay, the optimal
 * strategy would be "set every dial to maximum forever" and the whole
 * bilateral-tariff minigame would collapse into one button.
 *
 * KaTeX: R(r) = B \cdot \begin{cases} r/100, & r \le 250 \\
 *                       \max\left(0.3,\ 2.5 - \frac{r-250}{100}\cdot 0.4\right), & r > 250
 *                 \end{cases} \cdot \phi
 *   \phi = 0.3 at Phase 1, else \phi = 0.9 \cdot phase
 */

import { PARODY_NATIONS } from '../../constants/nations';
import type { GamePhase } from '../../types/desk';

/** Tariff rate above which revenue decays and retaliation heat accrues. */
export const TRADE_WAR_THRESHOLD = 250;

/** Heat accrued per second per nation sitting in a punitive trade war. */
const RETALIATION_HEAT_PER_SECOND = 0.08;

export interface TariffRevenueResult {
  /** Gross export duty per second, before the tick is applied. */
  revenuePerSecond: number;
  /** Inflation heat accrued over this tick. */
  retaliatoryHeat: number;
}

/**
 * The Laffer multiplier for a tariff rate: linear up to the trade-war
 * threshold, then diminishing returns and smuggling, floored at 0.3.
 * KaTeX: \lambda(r) = r/100 \quad \text{for}\ r \le 250
 * KaTeX: \lambda(r) = \max\left(0.3,\ 2.5 - 0.004(r - 250)\right) \quad \text{for}\ r > 250
 *
 * INVARIANT: [One Definition Of The Laffer Curve]
 * `BilateralTariffsTab` re-implemented these constants verbatim so its
 * per-nation `Duty: +$X/s` readout and its hover copy could show the same
 * number. `phaseEngine` exists precisely because duplicating a threshold across
 * two files once let manual clicking and passive income disagree — and a tuning
 * change here would have left every dial hover quoting a curve the engine no
 * longer used while the readout silently updated. The UI imports this.
 */
export function lafferRateMultiplier(rate: number): number {
  if (rate <= TRADE_WAR_THRESHOLD) return rate / 100;
  return Math.max(0.3, 2.5 - ((rate - TRADE_WAR_THRESHOLD) / 100) * 0.4);
}

/** What a nation's base export yield is worth per second at a given phase. */
export function tariffPhaseWeight(phase: GamePhase): number {
  return phase === 1 ? 0.3 : phase * 0.9;
}

/**
 * Duty income per second for one nation at one rate — the number the Tariffs
 * tab prints and the number `tickTariffRevenue` actually pays. One function, so
 * the two cannot drift.
 */
export function nationDutyPerSecond(
  baseExportYield: number | undefined,
  rate: number,
  phase: GamePhase
): number {
  return (baseExportYield || 10.0) * lafferRateMultiplier(rate) * tariffPhaseWeight(phase);
}

/**
 * Compute tariff revenue and retaliatory heat for one tick.
 *
 * INVARIANT: revenue is reported per-second so the caller can apply its own
 * `deltaSeconds`. Keeping the unit here means the store never has to remember
 * whether a value is a rate or a total, which is a classic source of
 * frame-rate-dependent economy bugs.
 */
export function tickTariffRevenue(
  tariffRates: Record<string, number>,
  phase: GamePhase,
  deltaSeconds: number
): TariffRevenueResult {
  let revenuePerSecond = 0;
  let retaliatoryHeat = 0;

  PARODY_NATIONS.forEach((nation) => {
    // INVARIANT: [No Free Lunch At Customs] — an absent key is 0, never
    // `defaultTariffRate`. Matches `deskSlice`, `BilateralTariffsTab` and
    // `marketEngine`; a divergence here would pay duty the UI says is zero.
    const rate = tariffRates[nation.id] ?? 0;

    if (rate > TRADE_WAR_THRESHOLD) retaliatoryHeat += RETALIATION_HEAT_PER_SECOND * deltaSeconds;

    revenuePerSecond += nationDutyPerSecond(nation.baseExportYield, rate, phase);
  });

  return { revenuePerSecond, retaliatoryHeat };
}
