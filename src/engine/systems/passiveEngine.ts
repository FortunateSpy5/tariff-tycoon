/**
 * Passive Economy Engine — PURE per-tick income accrual.
 *
 * INVARIANT: [Headless Game Logic Belongs in src/engine/]
 * No React, no Zustand, no store reads, no audio.
 *
 * EXTRACTED FROM `deskSlice.tickDesk`, which had grown to ~130 lines
 * interleaving passive income, tariff revenue, frenzy timing, ink regeneration
 * and the Crisis Call into a single action. Passive accrual is a distinct
 * concern — it is the game's revenue floor, and it must be predictable
 * regardless of what the player is doing.
 *
 * INVARIANT: [Integer Crony Favor]
 * The passive faucet grants a fractional trickle (0.05/s). Carrying the
 * fractional part in `cronyFavorRemainder` and only ever promoting whole units
 * keeps the displayed counter a clean integer while preserving the exact rate —
 * no favour is lost to rounding, and the player never sees
 * "82.34520000000012" on a currency spent in discrete bribes.
 *
 * INVARIANT: [Autopen Interns Scale With Phase]
 * The AI autopen upgrade pays a Phase-1 rate in Phase 1 and a Phase-2+ rate
 * after, so an upgrade bought in the Oval Office is not strictly worse than the
 * one it replaced.
 */

import { CRONY_FAVOR_MAX } from '../../constants/balance';
import type { GamePhase } from '../../types/desk';

/** Clicks per second contributed by the AI Autopen Interns upgrade. */
const AUTOPEN_CLICKS_PER_SECOND = 5;

/** Base value of one autopen click in Phase 1. */
const AUTOPEN_BASE_PHASE_1 = 5.0;

/** Base value of one autopen click in Phase 2 and beyond. */
const AUTOPEN_BASE_PHASE_2_PLUS = 50.0;

export interface PassiveInput {
  phase: GamePhase;
  /** Agency cash per second, already computed by the desk. */
  passiveCashPerSecond: number;
  /** Tariff revenue per second, from `tariffEngine`. */
  tariffRevenuePerSecond: number;
  /** Whether the AI Autopen Interns upgrade is owned. */
  hasAutopenArmy: boolean;
  /** Current ink and its cap, for passive regeneration. */
  inkLevel: number;
  maxInk: number;
  inkRegenPerSecond: number;
  /** Whether a frenzy is active — ink is frozen while it runs. */
  isCapsFrenzy: boolean;
  /** Current Crony Favor and the carried fractional part. */
  cronyFavor: number;
  cronyFavorRemainder: number;
  cronyFavorPerSecond: number;
  deltaSeconds: number;
}

export interface PassiveResult {
  /** Cash to add this tick (agencies + tariffs + autopen). */
  cashGain: number;
  /** Tariff revenue per second, for the HUD readout. */
  tariffRevenuePerSecond: number;
  /** Ink after passive regeneration. Frozen during a frenzy. */
  inkLevel: number;
  /** Whole Crony Favor units to promote this tick. */
  favorWholeUnits: number;
  /** New fractional Crony Favor remainder. */
  favorRemainder: number;
}

/** Accrue passive income, ink regen and Crony Favor for one tick. */
export function tickPassiveEconomy(input: PassiveInput): PassiveResult {
  // 1. Agency cash
  let cashGain = input.passiveCashPerSecond * input.deltaSeconds;

  // 2. AI Autopen Interns
  if (input.hasAutopenArmy) {
    const base = input.phase === 1 ? AUTOPEN_BASE_PHASE_1 : AUTOPEN_BASE_PHASE_2_PLUS;
    cashGain += base * AUTOPEN_CLICKS_PER_SECOND * input.deltaSeconds;
  }

  // 3. Bilateral tariff duties
  const tariffIncome = input.tariffRevenuePerSecond * input.deltaSeconds;
  cashGain += tariffIncome;

  // 4. Natural ink regeneration. INVARIANT: frozen during a frenzy, so the
  // frenzy's free-ink window cannot be extended by idling.
  const inkLevel = input.isCapsFrenzy
    ? input.inkLevel
    : Math.min(input.maxInk, input.inkLevel + input.inkRegenPerSecond * input.deltaSeconds);

  // 5. Crony Favor, as whole units only (see [Integer Crony Favor]).
  const favorPool = input.cronyFavorPerSecond * input.deltaSeconds + input.cronyFavorRemainder;
  const favorWholeUnits = Math.floor(favorPool);
  const favorRemainder = favorPool - favorWholeUnits;

  return {
    cashGain,
    tariffRevenuePerSecond: input.tariffRevenuePerSecond,
    inkLevel,
    // Deliberately NOT clampCronyFavor: this is a *headroom* calculation. The
    // passive drip must stop promoting units at the ceiling but must NOT discard
    // the sub-unit remainder, or favour would be lost every tick at the cap.
    favorWholeUnits: Math.min(CRONY_FAVOR_MAX - input.cronyFavor, favorWholeUnits),
    favorRemainder,
  };
}
