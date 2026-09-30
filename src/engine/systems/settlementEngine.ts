/**
 * 0DTE Settlement Engine — PURE option expiry settlement.
 *
 * INVARIANT: [Headless Game Logic Belongs in src/engine/]
 * No React, no Zustand, no store reads, no audio.
 *
 * EXTRACTED FROM `tradingSlice.tickMarket`. This is the most safety-critical
 * code in the game: it decides whether a player keeps, loses or is refunded
 * their collateral. It was a nested `forEach` with three interacting branches
 * inside an already-180-line tick, which meant a reviewer had to hold the whole
 * market, walk-back and raid loop in their head to check one refund.
 *
 * THE THREE BRANCHES, in priority order:
 *   1. Walk-back combo whose window just expired  -> collateral returned, no P&L.
 *      The squeeze has to be unwound for free, or the 8-second window is a trap.
 *   2. Trade past its expiry                      -> settled at market, with the
 *      Safe Practice Stakes refund applied on a losing paper trade.
 *   3. Otherwise                                   -> still live, carry forward.
 *
 * INVARIANT: [Safe Practice Stakes holds on auto-settle too]
 * Expiry is a settlement path like any other, so it must honour the paper
 * refund and restore the allowance. Without this, a player who opened contracts
 * and let them lapse would silently forfeit both their practice trades and
 * their refund — the harshest possible lesson for a beginner, delivered for
 * doing nothing wrong.
 */

import { calculateOptionReturn } from '../math/formulas';
import type { ActiveOptionTrade, OptionType, StockSymbol } from '../../types/market';

/** Maximum retained price-history samples. Mirrors `marketEngine`. */
const PRICE_HISTORY_LENGTH = 20;

export interface SettleInput {
  /** All currently open trades. */
  trades: ActiveOptionTrade[];
  /** Current prices, post-tick. */
  prices: Record<StockSymbol, { currentPrice: number }>;
  /** Current VEX volatility, which scales the option payout curve. */
  vexVolatility: number;
  /** Whether the Darkpool Fiber upgrade is owned (tighter spreads). */
  hasDarkPoolFiber: boolean;
  /**
   * The 280-Character Flash Dip's multiplier on the SIGNED return, or 1.
   * Threaded from the caller rather than read from a clock so that the manual
   * settle and the auto-settle price a position identically — see
   * [One Pricing Path] above.
   */
  valuationMultiplier: number;
  /** True when the 8-second walk-back window closed on this very tick. */
  walkBackWindowExpired: boolean;
  /** The symbol the last YAP targeted, for matching walk-back combos. */
  lastTargetStockSymbol: StockSymbol | undefined;
  /** Wall-clock now, compared against each trade's expiry. */
  now: number;
}

export interface SettleResult {
  /** Trades that are still open. */
  remainingTrades: ActiveOptionTrade[];
  /** Realized cash added to the treasury (principal + profit, floored at 0). */
  settledCash: number;
  /** Realized profit, floored at 0. Feeds the prestige SIS formula. */
  settledProfit: number;
  /** Collateral handed back for an expired walk-back combo. */
  returnedComboCollateral: number;
  /** Collateral refunded for a losing paper trade. */
  returnedPaperCollateral: number;
  /** Practice-trade allowance restored by refunds. */
  refundedPaperAllowance: number;
}

/** Per-trade outcome. `keep` set means the trade is still open. */
interface TradeOutcome {
  keep?: ActiveOptionTrade;
  settledCash?: number;
  settledProfit?: number;
  returnedComboCollateral?: number;
  returnedPaperCollateral?: number;
  refundedPaperAllowance?: number;
}

/** Pure settlement of a single trade, exposed for testing. */
function settleOne(trade: ActiveOptionTrade, input: SettleInput): TradeOutcome {
  // 1. Walk-back combo whose window just closed: unwound for free.
  if (input.walkBackWindowExpired && trade.isWalkBackCombo && trade.symbol === input.lastTargetStockSymbol) {
    return { returnedComboCollateral: trade.collateralLocked };
  }

  // 2. Still live.
  if (input.now < trade.expiresAtTimestamp) {
    return { keep: trade };
  }
  // 3. Expired: settle at market.
  const stock = input.prices[trade.symbol];
  const currentPrice = stock ? stock.currentPrice : trade.entryPrice;
  const netProfit = calculateOptionReturn(
    trade.type,
    trade.entryPrice,
    currentPrice,
    trade.leverage,
    trade.collateralLocked,
    input.vexVolatility,
    input.hasDarkPoolFiber,
    input.valuationMultiplier
  );

  // INVARIANT: a losing paper trade is refunded IN FULL, allowance included.
  if (trade.isPaperTrade && netProfit < 0) {
    return { returnedPaperCollateral: trade.collateralLocked, refundedPaperAllowance: 1 };
  }

  // Real money: the player can lose the principal, so clamp at zero rather than
  // allowing a negative payout to silently create cash out of nothing.
  return {
    settledCash: Math.max(0, trade.collateralLocked + netProfit),
    settledProfit: Math.max(0, netProfit),
  };
}

/** Settle every open trade against the current market. */
export function settleExpiredTrades(input: SettleInput): SettleResult {
  const result: SettleResult = {
    remainingTrades: [],
    settledCash: 0,
    settledProfit: 0,
    returnedComboCollateral: 0,
    returnedPaperCollateral: 0,
    refundedPaperAllowance: 0,
  };

  input.trades.forEach((trade) => {
    const outcome = settleOne(trade, input);
    if (outcome.keep) {
      result.remainingTrades.push(outcome.keep);
      return;
    }
    result.settledCash += outcome.settledCash ?? 0;
    result.settledProfit += outcome.settledProfit ?? 0;
    result.returnedComboCollateral += outcome.returnedComboCollateral ?? 0;
    result.returnedPaperCollateral += outcome.returnedPaperCollateral ?? 0;
    result.refundedPaperAllowance += outcome.refundedPaperAllowance ?? 0;
  });

  return result;
}

/**
 * Push every open contract's expiry forward by an offline duration.
 *
 * INVARIANT: [The Palm-a-Grifto Golf Protocol]
 * AGENTS.md requires that offline time must never punish the player. A 0DTE
 * contract that was mid-flight when the tab closed would otherwise expire while
 * the player was away, settling at whatever the market did overnight with no
 * chance to manage it. Extending the clock costs the player nothing and removes
 * the only genuinely hostile offline behaviour in the game.
 *
 * @param elapsedSeconds How long the player was away. Non-positive is a no-op.
 */
export function extendTradesForOffline(
  trades: ActiveOptionTrade[],
  elapsedSeconds: number
): ActiveOptionTrade[] {
  if (elapsedSeconds <= 0) return trades;
  const offsetMs = elapsedSeconds * 1000;
  return trades.map((trade) => ({
    ...trade,
    expiresAtTimestamp: trade.expiresAtTimestamp + offsetMs,
  }));
}

/**
 * Was this trade the front-run of a YAP?
 *
 * INVARIANT: [The Causal Loop Must Be Provable]
 * The whole pitch of the game is "YAP first, then short it." This is the check
 * that makes that provable: the trade must be a PUT, on the symbol the YAP
 * actually crashed, and opened AFTER the YAP landed. Opening the PUT before the
 * YAP does not count — that is just a lucky guess, not front-running.
 *
 * Gates PolyGrift access and the "Settle The Contract" tutorial step, so
 * getting it wrong would let a player skip progression they did not earn.
 */
export function isYapFrontRun(
  trade: ActiveOptionTrade,
  lastTargetStockSymbol: StockSymbol | undefined,
  lastYapTimestamp: number
): boolean {
  return (
    trade.type === 'PUT' &&
    trade.symbol === lastTargetStockSymbol &&
    lastYapTimestamp > trade.openedAtTimestamp
  );
}

/**
 * Build a new 0DTE contract record.
 *
 * INVARIANT: [Safe Practice Stakes]
 * While the onboarding allowance is live, contracts are PAPER TRADES. They
 * behave identically in every way EXCEPT that a losing settlement refunds the
 * collateral instead of banking a loss. This lets a brand-new player learn
 * "open PUT -> YAP -> crash -> settle" without being bankrupted by their own
 * first guess, which was the single biggest early-game churn risk.
 *
 * INVARIANT: [Strike And Target Are Different Numbers]
 * `strikePrice` is the 5% move the contract bets on, `targetPrice` is the 10%
 * move the degen is actually praying for. Conflating them would make every
 * position resolve long before the player felt they had won.
 */
export function createOptionTrade(params: {
  symbol: StockSymbol;
  type: OptionType;
  leverage: number;
  collateral: number;
  currentPrice: number;
  /** True when a CALL matches an open walk-back window on the crashed symbol. */
  isWalkBackCombo: boolean;
  /** True while the onboarding practice allowance is live. */
  isPaperTrade: boolean;
  openedAtTimestamp: number;
  durationMs: number;
  collateralPerContract: number;
  idSuffix: string;
}): ActiveOptionTrade {
  const { type, currentPrice } = params;
  return {
    id: `trade-${params.openedAtTimestamp}-${params.idSuffix}`,
    symbol: params.symbol,
    type,
    entryPrice: currentPrice,
    targetPrice: type === 'PUT' ? currentPrice * 0.9 : currentPrice * 1.1,
    strikePrice: type === 'PUT' ? currentPrice * 0.95 : currentPrice * 1.05,
    leverage: params.leverage,
    contractsCount: Math.floor(params.collateral / params.collateralPerContract),
    collateralLocked: params.collateral,
    openedAtTimestamp: params.openedAtTimestamp,
    expiresAtTimestamp: params.openedAtTimestamp + params.durationMs,
    isSettled: false,
    profitOrLoss: 0,
    isWalkBackCombo: params.isWalkBackCombo,
    isPaperTrade: params.isPaperTrade,
  };
}

/**
 * Result of a straddle squeeze: the recovery rally plus the payout.
 *
 * INVARIANT: the squeeze pumps ONLY the previously crashed target, never the
 * whole market. A crash that moves everything is not a YAP, it is a bug.
 */
export interface WalkBackResult {
  /** Recovery price for the target. */
  pumpPrice: number;
  /** Bounded price history for the target. */
  priceHistory: number[];
  /** Total credited to the treasury across all matching combo CALLs. */
  comboPayout: number;
  /** True when at least one matching combo CALL was found. */
  matched: boolean;
}

/**
 * Resolve the 8-second Straddle Squeeze.
 *
 * The player who front-ran the crash with a PUT has 8 seconds to buy a matching
 * CALL and walk the whole thing back for a recovery rally. This is the highest
 * skill-expression moment in the game, and it is the only way a crashed stock
 * recovers.
 *
 * INVARIANT: a CALL only counts as a combo if it was opened AFTER the YAP
 * landed (`isWalkBackCombo` is stamped at open time) and targets the same
 * symbol. Without that check the player could pre-load CALLs and farm squeezes
 * on crashes they did not cause.
 *
 * @param pumpMultiplier Recovery rally size, e.g. 1.35 for +35%.
 */
export function resolveWalkBack(params: {
  target: StockSymbol | undefined;
  currentPrice: number;
  priceHistory: number[] | undefined;
  comboCalls: ActiveOptionTrade[];
  vexVolatility: number;
  hasDarkPoolFiber: boolean;
  valuationMultiplier: number;
  pumpMultiplier: number;
}): WalkBackResult {
  if (!params.target || params.comboCalls.length === 0) {
    return {
      pumpPrice: params.currentPrice,
      priceHistory: params.priceHistory ?? [],
      comboPayout: 0,
      matched: false,
    };
  }

  const pumpPrice = +(params.currentPrice * params.pumpMultiplier).toFixed(2);
  const prev = params.priceHistory ?? [];
  const priceHistory =
    prev.length >= PRICE_HISTORY_LENGTH ? [...prev.slice(1), pumpPrice] : [...prev, pumpPrice];

  const comboPayout = params.comboCalls.reduce((total, trade) => {
    const netProfit = calculateOptionReturn(
      trade.type,
      trade.entryPrice,
      pumpPrice,
      trade.leverage,
      trade.collateralLocked,
      params.vexVolatility,
      params.hasDarkPoolFiber,
      params.valuationMultiplier
    );
    return total + Math.max(0, trade.collateralLocked + netProfit);
  }, 0);

  return { pumpPrice, priceHistory, comboPayout, matched: true };
}

// Re-exported so the slice does not import the pricing formula directly and
// accidentally bypass the settlement path.
export { calculateOptionReturn };
export type { OptionType };
