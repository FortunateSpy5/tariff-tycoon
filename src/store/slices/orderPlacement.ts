/**
 * Order Placement — opening a 0DTE contract.
 *
 * WHY THIS IS ITS OWN MODULE
 * `tradingSlice` sits at the 400-line hard ceiling in AGENTS.md, and placing an
 * order grew past it when the QE As A Service affordability test arrived. The
 * body is ~45 lines of gate-then-commit with four invariants on it, so it is
 * also the part of that slice a reviewer most wants to read in isolation.
 *
 * INVARIANT: [Safe Practice Stakes]
 * While the onboarding allowance is live, contracts are PAPER TRADES. They
 * behave identically except that a losing settlement refunds the collateral
 * instead of banking a loss — and critically, a paper trade never consumes the
 * walk-back combo stamp, because the combo branch is what the 8-second squeeze
 * window is checked against. See `createOptionTrade`.
 */

import type { ActiveOptionTrade, OptionType, StockSymbol } from '../../types/market';
import type { GameStore } from '../useGameStore';
import {
  COLLATERAL_PER_CONTRACT,
  HEAT_LEVERAGE_HIGH,
  HEAT_LEVERAGE_LOW,
  TRADE_DURATION_MS,
} from '../../constants/balance';
import { createOptionTrade } from '../../engine/systems/settlementEngine';
import { canAfford } from '../../engine/systems/perkEngine';
import { sound } from '../../audio/soundEngine';

/** The slice's own `set`, so this module never has to know the slice's type. */
type Commit = (partial: Partial<GameStore>) => void;

/**
 * Place one order, or refuse it.
 *
 * INVARIANT: [One Affordability Test]
 * `canAfford` is the same predicate the order slip drew its `tooBroke` face
 * from, and the only one that knows about the QE As A Service negative buffer.
 * A hand-written `treasuryCash < collateral` here would silently exclude the
 * perk from the market — the failure mode being invisible, not loud.
 */
export function openTrade(
  state: GameStore,
  commit: Commit,
  symbol: StockSymbol,
  type: OptionType,
  leverage: number,
  collateral: number
): boolean {
  const stock = state.stocks[symbol];
  if (!state.hasMarketAccess || !stock || collateral <= 0) return false;
  if (!canAfford(state.treasuryCash, collateral, state.unlockedPerks)) return false;

  // INVARIANT: [Safe Practice Stakes] a CALL opened during a walk-back window
  // on the crashed symbol is stamped as a combo here, and only a stamped CALL
  // can be settled by `executeWalkBack`.
  const isWalkBackCombo =
    state.isWalkBackWindowActive && type === 'CALL' && symbol === state.lastTargetStockSymbol;
  const isPaperTrade = state.paperTradesRemaining > 0;

  const now = Date.now();
  const newTrade: ActiveOptionTrade = createOptionTrade({
    symbol,
    type,
    leverage,
    collateral,
    currentPrice: stock.currentPrice,
    isWalkBackCombo,
    isPaperTrade,
    openedAtTimestamp: now,
    durationMs: TRADE_DURATION_MS,
    collateralPerContract: COLLATERAL_PER_CONTRACT,
    idSuffix: Math.random().toString(36).substring(2, 6),
  });

  sound.playChaChing();

  commit({
    treasuryCash: state.treasuryCash - collateral,
    activeTrades: [...state.activeTrades, newTrade],
    slopSuspicion: Math.min(
      100,
      state.slopSuspicion + (leverage > 100 ? HEAT_LEVERAGE_HIGH : HEAT_LEVERAGE_LOW)
    ),
    paperTradesRemaining: isPaperTrade ? state.paperTradesRemaining - 1 : state.paperTradesRemaining,
    // Tutorial: opening the first contract completes "Open A Paper Put" and
    // points the player at the YAP button.
    tutorialStepIndex: state.tutorialStepIndex === 1 ? 2 : state.tutorialStepIndex,
  });
  return true;
}
