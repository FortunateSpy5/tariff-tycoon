/**
 * Prediction Slice: PolyGrift bets and the S.L.O.P. audit bribe.
 *
 * WHY THIS IS A SEPARATE SLICE:
 * PolyGrift and the audit bribe are the two "buy off the system" verbs. They
 * are not the 0DTE market — they are side bets and political payments, and they
 * were interleaved into `tradingSlice` alongside the options lifecycle, which
 * pushed that file past the 400-line hard ceiling in AGENTS.md.
 *
 * They live together because they share a design idea: both convert CASH or
 * FAVOR into a reduction in RISK. The bribe buys down S.L.O.P. heat; a losing
 * PolyGrift position is the heat you took on deliberately. Together they are
 * the game's answer to "the system is coming for me" — you can pay it off.
 *
 * INVARIANT: [Favor Is Discrete]
 * The bribe spends whole Crony Favor units and heat relief is proportional to
 * what was spent, so there is no way to fractionally bleed heat cheaper than the
 * stated rate.
 */

import type { StateCreator } from 'zustand';
import type { GameStore } from '../useGameStore';
import { INITIAL_POLYGRIFT_BETS } from '../../constants/unlocks';
import { sound } from '../../audio/soundEngine';

/** S.L.O.P. heat removed per unit of Crony Favor spent on a bribe. */
const HEAT_RELIEF_PER_FAVOR = 0.8;

/** Heat added by a winning PolyGrift position. */
const POLYGRIFT_HEAT_WIN = 3;

/** Heat added by a losing PolyGrift position. Cheap, or nobody would bet. */
const POLYGRIFT_HEAT_LOSS = 1;

export interface PredictionSlice {
  /** Pay Crony Favor to buy down S.L.O.P. heat. */
  bribeSlopAuditors: (bribeAmount: number) => boolean;
  /** Place a wager on a PolyGrift market. */
  wagerPolyGrift: (
    betId: string,
    choice: 'YES' | 'NO',
    amount: number
  ) => { success: boolean; won?: boolean; payout?: number };
}

export const createPredictionSlice: StateCreator<GameStore, [], [], PredictionSlice> = (set, get) => ({
  /**
   * BRIBE THE INQUEST LEAD.
   *
   * INVARIANT: requires the S.L.O.P. radar. Buying heat down before a raid is
   * always cheaper than being raided, which is what makes S.L.O.P. a resource
   * to manage rather than a random disaster.
   */
  bribeSlopAuditors: (bribeAmount) => {
    const state = get();
    if (!state.hasRadarAccess || state.cronyFavor < bribeAmount) return false;

    set({
      cronyFavor: state.cronyFavor - bribeAmount,
      slopSuspicion: Math.max(0, state.slopSuspicion - bribeAmount * HEAT_RELIEF_PER_FAVOR),
    });
    return true;
  },

  /**
   * POLYGRIFT: a parimutuel on whether the market's own predictions come true.
   *
   * INVARIANT: this is the only remaining raw `Math.random()` in the game loop
   * that affects money. It is deliberately NOT causal — PolyGrift is a casino
   * floor bolted onto a market game, and the contrast with the deterministic
   * YAP crash is the joke. Everything the player can actually SKILL (YAPs,
   * tariffs, walk-backs) is fully deterministic from their own decisions.
   */
  wagerPolyGrift: (betId, choice, amount) => {
    const state = get();
    if (!state.hasPolyGriftAccess || state.treasuryCash < amount || amount <= 0) {
      return { success: false };
    }

    const bet = INITIAL_POLYGRIFT_BETS.find((b) => b.id === betId);
    if (!bet) return { success: false };

    const odds = choice === 'YES' ? bet.oddsYes : bet.oddsNo;
    const winProb = choice === 'YES' ? bet.probYes / 100 : (100 - bet.probYes) / 100;
    const won = Math.random() < winProb;
    const payout = won ? Math.round(amount * odds) : 0;
    const netCash = won ? state.treasuryCash - amount + payout : state.treasuryCash - amount;

    if (won) {
      sound.playChaChing();
    } else {
      sound.playDryScratch();
    }

    set({
      treasuryCash: netCash,
      slopSuspicion: Math.min(100, state.slopSuspicion + (won ? POLYGRIFT_HEAT_WIN : POLYGRIFT_HEAT_LOSS)),
    });

    return { success: true, won, payout };
  },
});
