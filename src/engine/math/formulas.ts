/**
 * Core Incremental Game Mathematical Formulas
 * Directly derived from GAME_DESIGN_DOCUMENT.md with KaTeX annotations.
 */

import type { GamePhase } from '../../types/desk';
import type { OptionType } from '../../types/market';
import {
  PRESTIGE_CASH_DIVISOR,
  PRESTIGE_CASH_EXPONENT,
  PRESTIGE_OPTIONS_DIVISOR,
  PRESTIGE_OPTIONS_EXPONENT,
  PRESTIGE_OPTIONS_WEIGHT,
  INK_REFILL_COST_CAP,
  INK_REFILL_COST_GROWTH,
  INK_REFILL_TREASURY_RATIO,
  DRY_CLICK_JAM_YIELD_MULTIPLIER,
  DRY_CLICK_YIELD_MULTIPLIER,
  FRENZY_CLICK_MULTIPLIER,
} from '../../constants/balance';

/**
 * Computes manual click cash yield.
 * KaTeX: V_{\text{click}} = \max\left(V_{\text{floor}}, B \times M_{\text{phase}} \times M_{\text{frenzy}} \times M_{\text{dry}}\right)
 * 
 * INVARIANT: [Bankruptcy Floor]
 * Ensures the player can never be permanently soft-locked after 100% options loss.
 * Cash floor is guaranteed: max($1.00, SIS * $1,000).
 *
 * @param isJammed When the nib has jammed after DRY_CLICK_JAM_THRESHOLD consecutive dry
 *   clicks, dry yield collapses further (but never below the bankruptcy floor).
 */
export function calculateClickValue(
  phase: GamePhase,
  baseValue: number,
  inkLevel: number,
  isCapsFrenzy: boolean,
  sisCount: number,
  isJammed: boolean = false
): number {
  const cashFloor = Math.max(1.0, sisCount * 1000);

  // Phase progression scaling: Phase 1: 1x, Phase 2: 10x, Phase 3: 100x, Phase 4: 1000x
  const phaseMultipliers: Record<GamePhase, number> = {
    1: 1.0,
    2: 10.0,
    3: 100.0,
    4: 1000.0,
  };
  const phaseMultiplier = phaseMultipliers[phase] || 1.0;

  // Sovereign Immunity Slips grant +10% click yield boost per slip
  const sisMultiplier = 1.0 + sisCount * 0.1;

  if (isCapsFrenzy) {
    // Frenzy multiplier on current phase yield.
    // Uses FRENZY_CLICK_MULTIPLIER rather than a literal: the constant was
    // declared in balance.ts but this site had it hardcoded, so the GDD's
    // stated 10x existed in two places and changing one silently desynced it.
    return Math.max(cashFloor, baseValue * phaseMultiplier * FRENZY_CLICK_MULTIPLIER * sisMultiplier);
  }

  // Dry clicks retain a token yield (2% when jammed) so the player is never
  // soft-locked, but they build no tantrum — see DRY_TANTRUM_PER_CLICK = 0.
  // INVARIANT: [Ink Fuels Frenzy] a dry nib is a safety net, never the optimum.
  const inkMultiplier =
    inkLevel <= 0 ? (isJammed ? DRY_CLICK_JAM_YIELD_MULTIPLIER : DRY_CLICK_YIELD_MULTIPLIER) : 1.0;
  const calculatedYield = baseValue * phaseMultiplier * inkMultiplier * sisMultiplier;

  return Math.max(cashFloor, calculatedYield);
}

/**
 * Computes the cost to refill Golden Sharpie ink.
 * KaTeX: C(n) = \min(25 \times 1.35^n, 25000)
 *
 * INVARIANT: the exponent is 1.35, NOT the GDD's original 1.15. `balance.ts`
 * steepened it deliberately ("GDD Formula: 1.15^n -> steeper") and the constant
 * is the definition — but the KaTeX citation here kept saying 1.15, and the
 * figure then leaked into player-facing hover copy that quoted the stale
 * formula. A balance constant is not where a designer looks for a formula, so
 * the citation is the thing that has to be kept true.
 *
 * Capped to avoid negative-ROI traps where refills exceed a full ink tank's output.
 */
export function calculateInkRefillCost(refillCount: number, baseCost: number = 25): number {
  const exponentialCost = Math.floor(baseCost * Math.pow(INK_REFILL_COST_GROWTH, refillCount));
  return Math.min(exponentialCost, INK_REFILL_COST_CAP);
}

/** The 4× ceiling on a refill, as a multiple of the base curve. */
export const INK_REFILL_HARD_CAP_MULTIPLE = 4;

/**
 * The price the player ACTUALLY pays to refill: the base curve PLUS a
 * percentage tax on the treasury, hard-capped at 4× the base.
 * KaTeX: C_{total}(n) = \min\left(B(n) + 0.02 \cdot \text{treasury},\ 4 \cdot B(n)\right)
 *
 * INVARIANT: [The Quoted Price Must Be The Charged Price]
 * `refillInk` inlined this expression while the UI showed
 * `calculateInkRefillCost` — the base term ONLY. So a player holding $10M was
 * quoted "$25.00" and charged $100, and the hint's "adds 2% of your treasury on
 * top" described a term the cap deletes outright whenever 2%·treasury exceeds
 * 3× the base. That is a `SIGN TARIFF`-class lie, told at the moment of payment.
 *
 * The cap is exactly why this needed saying out loud: the 2% is not always
 * "on top", and copy implying it always is, is wrong.
 */
export function calculateInkRefillTotal(
  refillCount: number,
  treasuryCash: number,
  baseCost: number = 25
): number {
  const base = calculateInkRefillCost(refillCount, baseCost);
  return Math.min(base + treasuryCash * INK_REFILL_TREASURY_RATIO, base * INK_REFILL_HARD_CAP_MULTIPLE);
}

/**
 * Computes the net profit or loss for an active leveraged option contract.
 * KaTeX: \text{Return} = \Delta_{\text{price}} \times \text{leverage} \times \left(1 + \frac{\Delta VEX}{100}\right)
 * KaTeX: \text{Profit} = \text{collateral} \times \max(-1.0, \text{Return})
 */
export function calculateOptionReturn(
  type: OptionType,
  entryPrice: number,
  currentPrice: number,
  leverage: number,
  collateral: number,
  vexVolatility: number = 15.0,
  hasDarkPoolFiber: boolean = false
): number {
  if (entryPrice <= 0) return 0;

  const rawDelta =
    type === 'PUT'
      ? (entryPrice - currentPrice) / entryPrice
      : (currentPrice - entryPrice) / entryPrice;

  // Vega blowout expansion factor based on VEX index volatility
  const vegaMultiplier = 1.0 + Math.max(0, (vexVolatility - 15.0) / 100);
  const leveragedDelta = rawDelta * leverage * vegaMultiplier;

  // Options cannot lose more than 100% of collateral locked
  const clampedReturn = Math.max(-1.0, leveragedDelta);

  // Dark Pool Fiber: +50% payout multiplier on profitable trades
  const profitMultiplier = hasDarkPoolFiber && clampedReturn > 0 ? 1.5 : 1.0;

  return collateral * clampedReturn * profitMultiplier;
}

/**
 * Calculates Sovereign Immunity Slips earned upon Tier 1 Prestige (Flight to the Caymans).
 * GDD §5 two-term formula. Threshold: $10^10 Lifetime Treasury Cash.
 * KaTeX: SIS = \left\lfloor \left(\frac{\text{LifetimeCash}}{10^{10}}\right)^{0.32} + 3 \times \left(\frac{\text{OptionsProfit}}{10^9}\right)^{0.38} \right\rfloor
 *
 * @param lifetimeCash Total treasury cash accumulated this run (including locked collateral).
 * @param optionsProfit Cumulative realized profit from settled option trades this run.
 */
export function calculatePrestigeSIS(lifetimeCash: number, optionsProfit: number = 0): number {
  const cashTerm = Math.pow(Math.max(0, lifetimeCash) / PRESTIGE_CASH_DIVISOR, PRESTIGE_CASH_EXPONENT);
  const optionsTerm =
    PRESTIGE_OPTIONS_WEIGHT *
    Math.pow(Math.max(0, optionsProfit) / PRESTIGE_OPTIONS_DIVISOR, PRESTIGE_OPTIONS_EXPONENT);
  const total = cashTerm + optionsTerm;
  if (total < 1) return 0;
  return Math.floor(total);
}

/**
 * Calculates offline treasury earnings while player was away.
 * 
 * INVARIANT: [The Palm-a-Grifto Golf Protocol]
 * Offline time must never punish the player. Volatility and margin calls are frozen.
 * Earnings collect at 100% efficiency up to a 48-hour safety cap.
 */
export function calculateOfflineEarnings(
  passivePerSecond: number,
  offlineSeconds: number
): { cashEarned: number; secondsCredited: number } {
  const MAX_OFFLINE_SECONDS = 48 * 3600; // 48 hours maximum
  const secondsCredited = Math.min(Math.max(0, offlineSeconds), MAX_OFFLINE_SECONDS);
  const cashEarned = passivePerSecond * secondsCredited;

  return {
    cashEarned,
    secondsCredited,
  };
}
