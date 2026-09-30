/**
 * Settlement Slice: manual (early) close of a 0DTE position.
 *
 * WHY THIS IS A SEPARATE SLICE:
 * 0DTE contracts can be closed two ways — automatically on the 60-second
 * expiry, or manually by the player clicking SETTLE. Those two paths MUST agree
 * to the cent; if they did not, a player could close early for a better price
 * and the auto-settle would become a trap rather than a convenience.
 *
 * They were implemented separately, in the same file, with duplicated pricing
 * logic — which is precisely the arrangement that lets two code paths drift
 * apart silently. They are now split by ROLE, and share one implementation of
 * the rules (`settlementEngine`), so agreement is structural rather than
 * something a reviewer has to verify by eye.
 *
 * INVARIANT: [One Pricing Path]
 * Both the manual and the automatic path call `settleExpiredTrades`. There is no
 * second place where collateral is decided.
 */

import type { StateCreator } from 'zustand';
import type { GameStore } from '../useGameStore';
import { isYapFrontRun, settleExpiredTrades } from '../../engine/systems/settlementEngine';
import { flashDipValuationMultiplier } from '../../engine/systems/perkEngine';
import { PAPER_TRADE_WIN_TANTRUM } from '../../constants/onboarding';
import { sound } from '../../audio/soundEngine';

export interface SettlementSlice {
  /**
   * Close a position early at the current market price.
   * @returns The payout credited, or 0 if the trade was not found or is already
   *   settled.
   */
  settleOptionTrade: (tradeId: string) => number;
}

export const createSettlementSlice: StateCreator<GameStore, [], [], SettlementSlice> = (set, get) => ({
  settleOptionTrade: (tradeId) => {
    const state = get();
    const trade = state.activeTrades.find((t) => t.id === tradeId);
    if (!trade || trade.isSettled) return 0;

    const settlement = settleExpiredTrades({
      trades: [trade],
      prices: state.stocks,
      vexVolatility: state.vexVolatility,
      hasDarkPoolFiber: state.activeUpgrades.includes('darkpool_fiber'),
      // The same live valuation the auto-settle uses, so a manual close during a
      // Flash Dip prices identically. See [One Pricing Path] above.
      valuationMultiplier: flashDipValuationMultiplier(state.flashDipSecondsRemaining),
      // A manual settle is not an expiry, so the walk-back unwinding branch must
      // not fire here — a combo CALL is closed by `executeWalkBack`, not by hand.
      walkBackWindowExpired: false,
      lastTargetStockSymbol: state.lastTargetStockSymbol,
      // Passing the expiry timestamp forces the settlement branch rather than
      // the "still live" carry-forward branch, without pretending it expired.
      now: trade.expiresAtTimestamp,
    });

    // Defensive: if the engine carried the trade forward as still live there is
    // nothing to settle, and the position must be left untouched.
    if (settlement.remainingTrades.length > 0) return 0;

    const creditedPayout = settlement.settledCash + settlement.returnedPaperCollateral;

    // INVARIANT: [Safe Practice Stakes] a paper loss refunds the collateral but
    // still burns the allowance, so a wrong first guess teaches the loop
    // without ever zeroing a new treasury. See `settleExpiredTrades`.
    const refundedPaperLoss = trade.isPaperTrade && settlement.refundedPaperAllowance > 0;
    const netProfit = refundedPaperLoss
      ? -trade.collateralLocked
      : creditedPayout - trade.collateralLocked;

    // INVARIANT: [The Causal Loop Must Be Provable] — a PUT only counts as
    // front-running if it was opened AFTER the YAP crashed its symbol.
    const settledYapPut = isYapFrontRun(trade, state.lastTargetStockSymbol, state.lastYapTimestamp);

    set({
      treasuryCash: state.treasuryCash + creditedPayout,
      lifetimeOptionsProfit: state.lifetimeOptionsProfit + Math.max(0, netProfit),
      activeTrades: state.activeTrades.filter((t) => t.id !== tradeId),
      hasSettledYapTrade: state.hasSettledYapTrade || settledYapPut,
      hasPolyGriftAccess: state.hasPolyGriftAccess || settledYapPut,
      // Tutorial: settling the first YAP-targeted PUT completes the chain.
      tutorialStepIndex:
        settledYapPut && state.tutorialStepIndex === 3 ? 4 : state.tutorialStepIndex,
      // A profitable paper trade feeds the tantrum, nudging the player toward
      // their first CAPS LOCK FRENZY using the skill they just proved they have.
      tantrumMeter:
        trade.isPaperTrade && netProfit > 0
          ? Math.min(100, state.tantrumMeter + PAPER_TRADE_WIN_TANTRUM)
          : state.tantrumMeter,
      paperTradesWon: state.paperTradesWon + (netProfit > 0 ? 1 : 0),
    });

    if (netProfit > 0) {
      sound.playChaChing();
    } else if (refundedPaperLoss) {
      sound.playDeskThud();
    }
    return creditedPayout;
  },
});
