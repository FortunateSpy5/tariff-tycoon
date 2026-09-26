/**
 * Core Incremental Game Mathematical Formulas
 * Directly derived from GAME_DESIGN_DOCUMENT.md with KaTeX annotations.
 */

import type { GamePhase } from '../../types/desk';
import type { OptionType } from '../../types/market';

/**
 * Computes manual click cash yield.
 * KaTeX: V_{\text{click}} = \max\left(V_{\text{floor}}, B \times M_{\text{frenzy}} \times M_{\text{dry}}\right)
 * 
 * INVARIANT: [Bankruptcy Floor]
 * Ensures the player can never be permanently soft-locked after 100% options loss.
 */
export function calculateClickValue(
  phase: GamePhase,
  baseValue: number,
  inkLevel: number,
  isCapsFrenzy: boolean,
  sisCount: number
): number {
  // Guaranteed bankruptcy floor: $1.00 or $1,000 per Sovereign Immunity Slip
  const cashFloor = Math.max(1.0, sisCount * 1000);

  if (isCapsFrenzy) {
    return Math.max(cashFloor, baseValue * 10.0);
  }

  // Desperation Dry Nib: 90% penalty when ink is depleted
  const inkMultiplier = inkLevel <= 0 ? 0.1 : 1.0;
  const calculatedYield = baseValue * (phase === 1 ? 1.0 : 10.0) * inkMultiplier;

  return Math.max(cashFloor, calculatedYield);
}

/**
 * Computes the cost to refill Golden Sharpie ink.
 * GDD Formula: C(n) = C_0 \times 1.15^n
 * KaTeX: C(n) = 100 \times 1.15^n
 */
export function calculateInkRefillCost(refillCount: number, baseCost: number = 100): number {
  return Math.floor(baseCost * Math.pow(1.15, refillCount));
}

/**
 * Computes the net profit or loss for an active leveraged option contract.
 * KaTeX: \text{Return} = \Delta_{\text{price}} \times \text{leverage}
 * KaTeX: \text{Profit} = \text{collateral} \times \max(-1.0, \text{Return})
 */
export function calculateOptionReturn(
  type: OptionType,
  entryPrice: number,
  currentPrice: number,
  leverage: number,
  collateral: number
): number {
  if (entryPrice <= 0) return 0;

  const rawDelta =
    type === 'PUT'
      ? (entryPrice - currentPrice) / entryPrice
      : (currentPrice - entryPrice) / entryPrice;

  const leveragedDelta = rawDelta * leverage;
  // Options cannot lose more than 100% of collateral locked
  const clampedReturn = Math.max(-1.0, leveragedDelta);

  return collateral * clampedReturn;
}

/**
 * Calculates Sovereign Immunity Slips earned upon Tier 1 Prestige (Flight to the Caymans).
 * KaTeX: SIS = \lfloor 10 \times \left(\frac{\text{NetWorth}}{10^6}\right)^{0.22} \rfloor
 */
export function calculatePrestigeSIS(netWorth: number): number {
  if (netWorth < 1_000_000) return 0;
  const ratio = netWorth / 1_000_000;
  return Math.floor(10 * Math.pow(ratio, 0.22));
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
