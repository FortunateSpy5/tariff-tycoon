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

  // Phase 1 collects a token fraction so the customs desk reads as a stepping
  // stone; later phases pay the full rate.
  const phaseWeight = phase === 1 ? 0.3 : phase * 0.9;

  PARODY_NATIONS.forEach((nation) => {
    const rate = tariffRates[nation.id] ?? nation.defaultTariffRate;
    let rateMultiplier: number;

    if (rate <= TRADE_WAR_THRESHOLD) {
      // Linear extractive revenue up to the trade-war threshold.
      rateMultiplier = rate / 100;
    } else {
      // Diminishing returns and smuggling past the threshold.
      rateMultiplier = Math.max(0.3, 2.5 - ((rate - TRADE_WAR_THRESHOLD) / 100) * 0.4);
      retaliatoryHeat += RETALIATION_HEAT_PER_SECOND * deltaSeconds;
    }

    const baseDuty = nation.baseExportYield || 10.0;
    revenuePerSecond += baseDuty * rateMultiplier * phaseWeight;
  });

  return { revenuePerSecond, retaliatoryHeat };
}
