/**
 * Core Incremental Game Mathematical Formulas
 * Directly derived from GAME_DESIGN_DOCUMENT.md with KaTeX annotations.
 */

import type { GamePhase } from '../../types/desk';
import type { OptionType } from '../../types/market';

/**
 * Computes manual click cash yield.
 * KaTeX: V_{\text{click}} = \max\left(V_{\text{floor}}, B \times M_{\text{phase}} \times M_{\text{frenzy}} \times M_{\text{dry}}\right)
 * 
 * INVARIANT: [Bankruptcy Floor]
 * Ensures the player can never be permanently soft-locked after 100% options loss.
 * Cash floor is guaranteed: max($1.00, SIS * $1,000).
 */
export function calculateClickValue(
  phase: GamePhase,
  baseValue: number,
  inkLevel: number,
  isCapsFrenzy: boolean,
  sisCount: number,
  dryClicksCount: number = 0
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
    // 10x frenzy multiplier on current phase yield
    return Math.max(cashFloor, baseValue * phaseMultiplier * 10.0 * sisMultiplier);
  }

  // Jammed Nib: if player scratches 25+ times without refilling, output drops to 1% salvage
  // INVARIANT: [Bankruptcy Floor] Jammed state degrades calculated yield, NEVER the guaranteed cash floor.
  const isJammed = inkLevel <= 0 && dryClicksCount >= 25;
  const inkMultiplier = isJammed ? 0.01 : inkLevel <= 0 ? 0.05 : 1.0;
  const calculatedYield = baseValue * phaseMultiplier * inkMultiplier * sisMultiplier;

  return Math.max(cashFloor, calculatedYield);
}

/**
 * Computes the cost to refill Golden Sharpie ink.
 * GDD Formula: C(n) = C_0 \times 1.15^n
 * KaTeX: C(n) = \min(100 \times 1.15^n, 25000)
 * 
 * Capped to avoid negative-ROI traps where refills exceed a full ink tank's output.
 */
export function calculateInkRefillCost(refillCount: number, baseCost: number = 100): number {
  const exponentialCost = Math.floor(baseCost * Math.pow(1.15, refillCount));
  return Math.min(exponentialCost, 25000);
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
 * Threshold: $1M Net Worth.
 * KaTeX: SIS = \left\lfloor \left(\frac{\text{NetWorth}}{10^6}\right)^{0.33} \right\rfloor
 */
export function calculatePrestigeSIS(netWorth: number): number {
  if (netWorth < 1_000_000) return 0;
  const ratio = netWorth / 1_000_000;
  return Math.max(1, Math.floor(Math.pow(ratio, 0.33)));
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
