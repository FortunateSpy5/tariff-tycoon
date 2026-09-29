/**
 * Tariff Pressure — how the player's trade policy moves a stock's fair value.
 *
 * WHY A SEPARATE MODULE
 * `marketEngine` is at its size ceiling and this is a genuinely different concern:
 * it is the *policy* layer (what the player's dials mean for prices) rather than
 * the *simulation* layer (how a price random-walks). It is also the part with the
 * worst bug history, so it earns its own file where the invariants can be read
 * without scrolling past the tick loop.
 *
 * INVARIANT: [Headless Game Logic Belongs in src/engine/]
 * No React, no store, no clock, no audio. Pure functions of the dial readings.
 *
 * INVARIANT: [PRESSURE IS A DEVIATION FROM NEUTRAL, NOT A REWARD FOR INACTION]
 * This is the single most consequential line in the price model, and it has been
 * wrong three separate ways. Each version looked reasonable and each one made the
 * market a money printer that ignored the player entirely:
 *
 * 1. `rate > 100 ? drag : rate < 50 ? +0.0002 : 0` — a bare bonus for a low duty.
 *    At game start EVERY nation is below 50% (P0-2 set all six dials to zero), so
 *    it paid unconditionally: +0.2%/sec compounding to ~1,378x per hour for doing
 *    nothing at all.
 * 2. Scaling that bonus by distance below 50% — better, but a 0% tariff is the
 *    STARTING state, so "distance below 50%" is *maximal* precisely when the
 *    player has done nothing. The reward was still free.
 * 3. Rebuilding the ramp as a compounding `fairValue` integrator — the original
 *    bug rebuilt inside the fix. A 10-hour soak reached 52,000x on $PAIN.
 *
 * The fix is conceptual, not a smaller number: 50% is the NEUTRAL trade
 * relationship. Below it, a linked stock's fair value recovers toward its issue
 * price; above it, fair value is dragged down. Every term is a signed deviation
 * from that, so the resting level is always the issue price and NO dial setting
 * can manufacture permanent growth. Relief is the absence of punishment and is
 * deliberately the weaker force — otherwise the optimal play is to zero every
 * dial and walk away, which is exactly the degenerate strategy term 1 was.
 *
 * KaTeX: \tau_i = \sum_{n \in N(i)} m_n \cdot \begin{cases}
 *   -\frac{r_n - 50}{100} \cdot D, & r_n > 50 \\
 *   \phantom{-}\frac{50 - r_n}{100} \cdot R, & r_n < 50
 * \end{cases}
 */

import { PARODY_NATIONS } from '../../constants/nations';
import type { StockSymbol } from '../../types/market';

/**
 * The duty that counts as a neutral trade relationship.
 *
 * INVARIANT: [THIS IS THE NUMBER THAT MAKES PRESSURE BOUNDED]
 * Every tariff term is a signed deviation from here, and the result always pulls
 * fair value back toward the issue price. Change this and the equilibrium moves —
 * but no value of it can produce unbounded growth, which is the property the
 * old unconditional rally lacked.
 */
export const NEUTRAL_TARIFF = 50;

/**
 * Drift per percentage point of duty ABOVE neutral, per tick.
 *
 * Sized against the YAP: `yapShockEngine` crashes a ticker by up to
 * `MAX_CRASH_SEVERITY` (92%) in one player action, and `TRADE_DURATION_MS` is 60s.
 * A player at the 500% dial ceiling gets 4.5 × this per tick = 4.5%/sec, which is
 * decisive inside a 60-second position — the tariff loop has to be a real
 * alternative strategy, or turning the dials is a chore rather than a choice.
 */
export const TARIFF_DRAG_PER_POINT = 0.0001;

/**
 * Recovery per percentage point of duty BELOW neutral, per tick.
 *
 * INVARIANT: an order of magnitude below the drag above neutral, and it must stay
 * there. See [PRESSURE IS A DEVIATION FROM NEUTRAL] on why relief is the weaker
 * force by design.
 */
export const RELIEF_RALLY_PER_TICK = 0.00001;

/** $PAIN is the index: it tracks trade pressure harder in both directions. */
const PAIN_PRESSURE_MULTIPLIER = 1.5;

/**
 * Accumulate the signed pressure from every nation linked to a symbol.
 *
 * @param multiplier Scales the whole sum. Only $PAIN passes anything but 1 — an
 *                   index is a composite and should feel the trade war harder
 *                   than any single constituent.
 */
function pressureFromLinked(
  symbol: StockSymbol,
  tariffRates: Record<string, number>,
  multiplier: number
): number {
  let pressure = 0;
  PARODY_NATIONS.forEach((nation) => {
    if (!nation.linkedStocks.includes(symbol)) return;
    // INVARIANT: [No Free Lunch At Customs] — an absent key reads as 0, NEVER as
    // `nation.defaultTariffRate`. Both `deskSlice` and `BilateralTariffsTab`
    // already treat a missing key as "not tariffed"; this was the last read still
    // disagreeing, so a save migration or a newly-added nation without a desk
    // default would have applied a silent 175% punitive drag while every UI
    // surface displayed 0% and a relief rally. P0-2 ("all six dials start at
    // ZERO") is only coherent if the simulation's read agrees with the display.
    const rate = tariffRates[nation.id] ?? 0;
    if (rate > NEUTRAL_TARIFF) {
      pressure -= ((rate - NEUTRAL_TARIFF) / 100) * TARIFF_DRAG_PER_POINT;
    } else if (rate < NEUTRAL_TARIFF) {
      pressure += ((NEUTRAL_TARIFF - rate) / 100) * RELIEF_RALLY_PER_TICK;
    }
  });
  return pressure * multiplier;
}

/** The pressure a constituent ticker is under from the player's dials. */
export function tariffPressureFor(symbol: StockSymbol, tariffRates: Record<string, number>): number {
  return pressureFromLinked(symbol, tariffRates, 1);
}

/**
 * Trade pressure on the $PAIN composite.
 *
 * INVARIANT: tracked at 1.5x, not tracked twice. The composite is a function of
 * its constituents, which have already absorbed their own linked pressure — so
 * adding a second unscaled pass double-counted every dial. One multiplier on one
 * pass is the honest total.
 */
export function painTariffPressure(tariffRates: Record<string, number>): number {
  return pressureFromLinked('PAIN', tariffRates, PAIN_PRESSURE_MULTIPLIER);
}
