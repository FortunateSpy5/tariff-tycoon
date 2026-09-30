/**
 * Prestige Progress Projection — the readout for the long climb to $10^10.
 *
 * WHY THIS IS A HEADLESS MODULE
 * The numbers here are quoted by the Caymans tab, by its hover copy, and by the
 * perk cards. They are also the numbers a player will plan a whole run around.
 * Computing them in a component would mean the same arithmetic exists twice with
 * a copy-paste between, which is the drift this repo treats as a defect.
 *
 * INVARIANT: [Lead With The Shortfall]
 * The projection answers the only question a sub-$10B player opened this channel
 * to ask — how far away is the gate — and only then explains the shape of the
 * curve. A player who wanted a lecture on the 0.32 exponent did not come here.
 */

import { calculatePrestigeSIS } from '../../engine/math/formulas';
import { PRESTIGE_CASH_DIVISOR, PRESTIGE_CASH_EXPONENT } from '../../constants/balance';

export interface PrestigeProjection {
  /** Lifetime cash counted toward the gate, including locked collateral. */
  readonly countedLifetimeCash: number;
  /** Dollars still owed before the button opens. Zero once it has. */
  readonly shortfall: number;
  /** 0..1 progress toward the filing threshold. Clamped. */
  readonly progress: number;
  /** Whole Slips this run would file for right now. */
  readonly sisNow: number;
  /**
   * Lifetime cash at which the filing figure reaches one whole Slip higher, or
   * null when the run is already at the top of the ladder the options term can
   * reach on its own.
   */
  readonly nextSlipCash: number | null;
  /** Dollars of additional lifetime cash that milestone costs. */
  readonly nextSlipShortfall: number;
  /**
   * How much MORE Slips the same options profit is worth at `nextSlipCash`.
   * Negative when the options term already carried the figure past the rung.
   */
  readonly nextSlipGain: number;
  /**
   * The multiplier applied to the cash term when lifetime earnings double.
   * `2^0.32` — the honest answer to "is it worth grinding for twice as much?".
   */
  readonly cashDoublingGain: number;
}

/**
 * Build the projection.
 *
 * @param countedLifetimeCash Lifetime cash PLUS locked collateral, which is what
 *   `executeFlightToCaymans` actually counts. Passing raw lifetime cash here
 *   would quote a shortfall the engine does not charge — the exact lie the
 *   Caymans button label was previously corrected for.
 */
export function readPrestigeProjection(
  countedLifetimeCash: number,
  lifetimeOptionsProfit: number
): PrestigeProjection {
  const counted = Math.max(0, countedLifetimeCash);
  const progress = Math.min(1, counted / PRESTIGE_CASH_DIVISOR);
  const sisNow = calculatePrestigeSIS(counted, lifetimeOptionsProfit);

  // The options term is independent of cash, so the cash-only ladder the player
  // is climbing is `floor((cash / DIVISOR) ^ EXPONENT)`.
  const cashRung = Math.floor(Math.pow(counted / PRESTIGE_CASH_DIVISOR, PRESTIGE_CASH_EXPONENT));
  const nextCashRung = cashRung + 1;
  const nextSlipCash = nextCashRung ** (1 / PRESTIGE_CASH_EXPONENT) * PRESTIGE_CASH_DIVISOR;

  // INVARIANT: [The Stated Gain Is The ACTUAL Gain]
  // The first version computed `nextCashRung - totalOptionsTerm` — a difference of
  // whole RUNGS, as though the formula added integers. It does not:
  // `calculatePrestigeSIS` floors the SUM of two fractional terms, so the gain is
  // the difference of two FLOORS. At $1e10 with no options profit the card read
  // "worth 2 more Slips" when filing there pays exactly 1 more. The two
  // disagreed at 6 of 10 sampled points, and always in the player's disfavour —
  // a prestige screen overstating the reward for grinding one more time.
  //
  // Both sides now come from `calculatePrestigeSIS` itself, so the number on the
  // card is the number the engine will pay.
  const sisAtNextSlip = calculatePrestigeSIS(nextSlipCash, lifetimeOptionsProfit);
  const nextSlipGain = Math.max(0, sisAtNextSlip - sisNow);

  return {
    countedLifetimeCash: counted,
    shortfall: Math.max(0, PRESTIGE_CASH_DIVISOR - counted),
    progress,
    sisNow,
    nextSlipCash: nextCashRung <= cashRung ? null : nextSlipCash,
    nextSlipShortfall: Math.max(0, nextSlipCash - counted),
    nextSlipGain,
    cashDoublingGain: Math.pow(2, PRESTIGE_CASH_EXPONENT),
  };
}

/**
 * The lifetime cash at which the filing figure reaches `slips` WHOLE Slips on
 * the cash term alone.
 *
 * INVARIANT: [Never Type A Milestone]
 * The perk tree's closing line wants to say how deep the whole constellation
 * goes. Writing that as `10^10 * 32^(1/0.32)` inside a component puts a second
 * copy of the prestige formula in the repo, and the copy that rots is always the
 * one nobody is looking at. Inverted from the same two constants, here.
 *
 * @param slips A whole-Slip target, at least 1 — the cash term is 0 at zero
 *   lifetime cash and the 1/0.32 inversion is not defined there.
 */
export function lifetimeCashForSlips(slips: number): number {
  return Math.max(1, slips) ** (1 / PRESTIGE_CASH_EXPONENT) * PRESTIGE_CASH_DIVISOR;
}
