/**
 * Perk Slice: the SIS perks that run on their own clock.
 *
 * WHY THIS IS A SEPARATE SLICE
 * Five of the six perks are a flag read at the moment some other system spends
 * money — a multiplier on a tap, a discount on a liquidation, a gate on a raid.
 * They cost nothing to hold. The sixth, the Insider Exemption 401(k), is the
 * opposite: a timed match that pays cash into the treasury every 60 seconds, and
 * which has to know the value of the open 0DTE book to price itself. That is a
 * faucet with a clock, and it does not belong on the clicker or the market tick
 * — both of which are already at the 400-line ceiling in AGENTS.md.
 *
 * INVARIANT: [The Match Never Runs On An Empty Book]
 * `resolveAutoMatch` peaks at zero when nothing is open, so an idle player
 * collects nothing. The perk is paid for by HOLDING leveraged risk, which is the
 * only thing this game is about — a blind pool that paid for existing would be
 * the same class of bug the relief rally and the $PAIN constituent link were.
 */

import type { StateCreator } from 'zustand';
import type { ActiveOptionTrade } from '../../types/market';
import type { GameStore } from '../useGameStore';
import { calculateOptionReturn } from '../../engine/math/formulas';
import { formatCurrency } from '../../engine/math/bigNumber';
import {
  flashDipValuationMultiplier,
  hasPerk,
  openBookValue,
  resolveAutoMatch,
} from '../../engine/systems/perkEngine';
import { sound } from '../../audio/soundEngine';

export interface PerkSlice {
  /** Resolve the 401(k) match. Called from the game loop after `tickMarket`. */
  tickPerks: () => void;
}

/**
 * What one open position is worth right now, in dollars.
 *
 * INVARIANT: [A Losing Position Is Worth Its Collateral, Not Less]
 * `settleExpiredTrades` floors the settlement at zero — a total loss returns the
 * collateral and nothing more — so a negative mark would be a number the
 * settlement path would refuse to pay. Valuing the book the way it actually
 * settles is what keeps the match honest.
 *
 * The live Flash Dip is priced in here for the same reason it is priced into
 * `calculateOptionReturn` everywhere else: a valuation the settlement path does
 * not share is a valuation the player will notice.
 */
function positionValue(trade: ActiveOptionTrade, state: GameStore): number {
  const stock = state.stocks[trade.symbol];
  const currentPrice = stock ? stock.currentPrice : trade.entryPrice;
  const pnl = calculateOptionReturn(
    trade.type,
    trade.entryPrice,
    currentPrice,
    trade.leverage,
    trade.collateralLocked,
    state.vexVolatility,
    state.activeUpgrades.includes('darkpool_fiber'),
    flashDipValuationMultiplier(state.flashDipSecondsRemaining)
  );
  return trade.collateralLocked + Math.max(0, pnl);
}

/** How long the match notice stays on the wing footer before it clears itself. */
const NOTICE_LIFETIME_MS = 6000;

export const createPerkSlice: StateCreator<GameStore, [], [], PerkSlice> = (set, get) => ({
  tickPerks: () => {
    const state = get();
    const now = Date.now();

    // INVARIANT: [The Notice Clears Itself]
    // The footer strip this feeds is permanent, so a notice left up would sit
    // there reading like a live readout rather than an event. Cleared here
    // rather than by a `setTimeout` in a component so the lifetime belongs to
    // the engine, and so it is not a timer that survives unmounting.
    if (state.lastAutoMatchNotice && now - state.lastAutoMatchTimestamp > NOTICE_LIFETIME_MS) {
      set({ lastAutoMatchNotice: undefined });
    }

    if (!hasPerk(state.unlockedPerks, 'insider_401k')) return;

    const bookValue = openBookValue(state.activeTrades.map((t) => positionValue(t, state)));

    const match = resolveAutoMatch({
      enabled: true,
      lastMatchTimestamp: state.lastAutoMatchTimestamp,
      peakBookValue: state.peakBookValue,
      currentBookValue: bookValue,
      now,
    });

    // The peak still climbs whether or not a match is due — otherwise a book
    // that peaked between windows would be silently forgotten.
    //
    // INVARIANT: [Write Back Everything The Engine Returned]
    // This only committed `peakBookValue`, so the `lastAutoMatchTimestamp` that
    // `resolveAutoMatch` returns on the zero-clock path was thrown away and the
    // window never armed. The store therefore kept a 0 clock, every reload
    // re-entered the "window opens now" branch, and the first match after a
    // reload was free — the exploit was only half fixed, because the fix lived in
    // the engine and the state that carried it lived here.
    if (!match.paid) {
      if (
        match.peakBookValue !== state.peakBookValue ||
        match.lastMatchTimestamp !== state.lastAutoMatchTimestamp
      ) {
        set({
          peakBookValue: match.peakBookValue,
          lastAutoMatchTimestamp: match.lastMatchTimestamp,
        });
      }
      return;
    }

    sound.playChaChing();
    set({
      treasuryCash: state.treasuryCash + match.payout,
      lifetimeCashEarned: state.lifetimeCashEarned + match.payout,
      peakBookValue: match.peakBookValue,
      lastAutoMatchTimestamp: match.lastMatchTimestamp,
      totalAutoMatchPaid: state.totalAutoMatchPaid + match.payout,
      lastAutoMatchNotice: `401(k) MATCH // +${formatCurrency(match.payout)} ON A ${formatCurrency(
        state.peakBookValue
      )} PEAK BOOK`,
    });
  },
});
