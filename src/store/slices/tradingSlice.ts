/**
 * Trading Slice: 0DTE options, the YAP crash, the walk-back squeeze, and the
 * per-frame market tick.
 *
 * INVARIANT: [The Slice Is An Orchestrator] — every rule lives in a PURE engine
 * under `src/engine/systems/` (market, settlement, slop, yapShock). The actions
 * below only gather state, call engines, and commit one `set()`, so a rule
 * change touches exactly one file.
 */
import type { StateCreator } from 'zustand';
import type { TradingSliceContract } from '../../types/store';
import type { StockSymbol } from '../../types/market';
import type { GameStore } from '../useGameStore';
import { INITIAL_STOCKS } from '../../constants/stocks';
import {
  VEX_BASELINE,
  VEX_CAP,
  VEX_DECAY_PER_SECOND,
  VEX_GAIN_SELECTED,
  VEX_GAIN_SHOTGUN,
  CRONY_FAVOR_PER_YAP,
  INK_COST_PER_YAP,
  YAP_HEAT,
  YAP_HEAT_SHOTGUN,
  WALK_BACK_WINDOW_SECONDS,
  WALK_BACK_PUMP_MULTIPLIER,
} from '../../constants/balance';
import { tickMarketPrices } from '../../engine/systems/marketEngine';
import { directionOf, moveMagnitude, stampPlayerMove } from '../../engine/systems/playerMoveCandles';
import {
  extendTradesForOffline,
  resolveWalkBack,
  settleExpiredTrades,
} from '../../engine/systems/settlementEngine';
import { clampCronyFavor, tickSlop } from '../../engine/systems/slopEngine';
import { gateYap, pickShotgunTarget, resolveYapShock } from '../../engine/systems/yapShockEngine';
import {
  flashDipValuationMultiplier,
  raidsAbolished,
} from '../../engine/systems/perkEngine';
import { PAPER_TRADE_ALLOWANCE } from '../../constants/onboarding';
import { openTrade } from './orderPlacement';
import { sound } from '../../audio/soundEngine';

export interface TradingSlice extends TradingSliceContract {}

export const createTradingSlice: StateCreator<GameStore, [], [], TradingSlice> = (set, get) => ({
  stocks: { ...INITIAL_STOCKS },
  activeTrades: [],
  hasSettledYapTrade: false,
  slopSuspicion: 5.0,
  vexVolatility: 15.0,
  cronyFavor: 30,
  cronyFavorRemainder: 0,
  lifetimeOptionsProfit: 0,
  paperTradesRemaining: PAPER_TRADE_ALLOWANCE,
  paperTradesWon: 0,
  isWalkBackWindowActive: false,
  walkBackSecondsRemaining: 0,
  lastWalkBackNotice: undefined,
  lastTargetStockSymbol: undefined,
  lastYapPost: undefined,
  yapTargetMode: 'selected',
  selectedStock: 'DOOR',
  lastYapTimestamp: 0,
  yapCooldownSeconds: 10,
  lastRaidMessage: undefined,
  lastRaidTimestamp: 0,

  setYapTargetMode: (mode) => set({ yapTargetMode: mode }),
  setSelectedStock: (symbol) => set({ selectedStock: symbol }),
  dismissRaidAlert: () => set({ lastRaidMessage: undefined }),

  // The order body lives in `orderPlacement.ts` — see the note there on why.
  openOptionTrade: (symbol, type, leverage, collateral) =>
    openTrade(get(), set, symbol, type, leverage, collateral),

  // Manual settlement lives in `settlementSlice` alongside the auto-settle it
  // must agree with. See `settlementEngine` for the pricing rules.

  triggerYapMarketShock: (yap) => {
    const state = get();
    const now = Date.now();

    // INVARIANT: [A YAP Is Never Free] — market access, cooldown and ink cost
    // are all checked by one engine function so they cannot drift apart.
    const refusal = gateYap({
      hasMarketAccess: state.hasMarketAccess,
      inkLevel: state.inkLevel,
      inkCost: INK_COST_PER_YAP,
      secondsSinceLastYap: (now - state.lastYapTimestamp) / 1000,
      cooldownSeconds: state.yapCooldownSeconds,
    });
    if (refusal) return { success: false, reason: refusal };

    // Target resolution based on yapTargetMode toggle.
    // INVARIANT: [Causality Is The Premise] `pickShotgunTarget` is the ONLY
    // randomness in the YAP path — it chooses WHICH stock gets crashed, never
    // HOW MUCH. The magnitude is a pure function of player decisions, so a
    // crash can never originate from a passive random walk.
    const isShotgun = state.yapTargetMode === 'shotgun';
    const target: StockSymbol = isShotgun
      ? pickShotgunTarget(Object.keys(state.stocks) as StockSymbol[])
      : state.selectedStock || 'DOOR';

    const targetStock = state.stocks[target];
    if (!targetStock) return { success: false, reason: 'Target stock not found' };

    const shock = resolveYapShock({
      tariffPercentage: yap.tariffPercentage,
      isCapsFrenzy: state.isCapsFrenzy,
      isShotgun,
      currentPrice: targetStock.currentPrice,
      priceHistory: targetStock.priceHistory,
    });
    const newPrice = shock.newPrice;

    // Check if player has an active PUT on this target stock (INSIDER COMBO!)
    const hasActivePut = state.activeTrades.some((t) => t.symbol === target && t.type === 'PUT');
    sound.playDeskThud();
    if (hasActivePut) sound.playChaChing();

    // INVARIANT: [A Crash Leaves A Scar Where The Player Can See It]
    // `stampPlayerMove` is the only sanctioned way to mark a candle, and this
    // is one of the two player-driven paths allowed to call it. The severity is
    // `shock.crashSeverity` — the value the crash engine actually applied after
    // its clamp — not a re-derivation, so the marker's size can never disagree
    // with the price that moved. See `playerMoveCandles`.
    const crashedCandles = stampPlayerMove(
      targetStock.candles,
      newPrice,
      shock.crashSeverity,
      directionOf(targetStock.currentPrice, newPrice),
      now
    );

    set({
      stocks: {
        ...state.stocks,
        [target]: {
          ...targetStock,
          currentPrice: newPrice,
          priceHistory: shock.priceHistory,
          candles: crashedCandles,
          // INVARIANT: the SAME `now` that stamped the candle. Two clock reads
          // could disagree by a tick and the grading ramp would start from a
          // timestamp its own scar contradicts.
          lastPlayerMoveAt: now,
        },
      },
      inkLevel: Math.max(0, state.inkLevel - INK_COST_PER_YAP),
      lastTargetStockSymbol: target,
      lastYapPost: yap,
      isWalkBackWindowActive: true,
      walkBackSecondsRemaining: WALK_BACK_WINDOW_SECONDS,
      lastWalkBackNotice: undefined,
      lastYapTimestamp: now,
      hasRadarAccess: true,
      // Tutorial: firing the first YAP completes "Open A Paper Put" and shows
      // "Launch A 3:00 AM YAP". The chain teaches, then hands over the desk.
      tutorialStepIndex: state.tutorialStepIndex === 2 ? 3 : state.tutorialStepIndex,
      slopSuspicion: Math.min(
        100,
        state.slopSuspicion + (isShotgun ? YAP_HEAT_SHOTGUN : YAP_HEAT)
      ),
      // Crony Favor faucet: landing a YAP earns political capital.
      cronyFavor: clampCronyFavor(state.cronyFavor + CRONY_FAVOR_PER_YAP),
      vexVolatility: Math.min(
        VEX_CAP,
        state.vexVolatility + (isShotgun ? VEX_GAIN_SHOTGUN : VEX_GAIN_SELECTED)
      ),
    });

    return { success: true, targetSymbol: target, combo: hasActivePut };
  },

  executeWalkBack: () => {
    const state = get();
    const now = Date.now();
    if (!state.isWalkBackWindowActive) return false;

    const target = state.lastTargetStockSymbol;
    if (!target || !state.stocks[target]) return false;

    // INVARIANT: only CALLs opened AFTER the YAP landed count. Stamped at open
    // time by `openOptionTrade` — see `resolveWalkBack`.
    const comboCalls = state.activeTrades.filter(
      (trade) => trade.isWalkBackCombo && trade.symbol === target && trade.type === 'CALL'
    );
    if (comboCalls.length === 0) return false;

    const targetStock = state.stocks[target];
    const squeeze = resolveWalkBack({
      target,
      currentPrice: targetStock.currentPrice,
      priceHistory: targetStock.priceHistory,
      comboCalls,
      vexVolatility: state.vexVolatility,
      hasDarkPoolFiber: state.activeUpgrades.includes('darkpool_fiber'),
      valuationMultiplier: flashDipValuationMultiplier(state.flashDipSecondsRemaining),
      pumpMultiplier: WALK_BACK_PUMP_MULTIPLIER,
    });
    if (!squeeze.matched) return false;

    // INVARIANT: [A Rally The Player Forced Is Also Causal]
    // The recovery is the second half of the same player-caused move, so it is
    // the second path allowed to stamp. Its magnitude is READ BACK off the two
    // prices `resolveWalkBack` just returned rather than typed here — see
    // `playerMoveCandles` for why a literal at this call site would rot the
    // moment `WALK_BACK_PUMP_MULTIPLIER` is tuned.
    const rallyCandles = stampPlayerMove(
      targetStock.candles,
      squeeze.pumpPrice,
      moveMagnitude(targetStock.currentPrice, squeeze.pumpPrice),
      directionOf(targetStock.currentPrice, squeeze.pumpPrice),
      now
    );

    sound.playChaChing();
    set({
      stocks: {
        ...state.stocks,
        [target]: {
          ...targetStock,
          currentPrice: squeeze.pumpPrice,
          priceHistory: squeeze.priceHistory,
          candles: rallyCandles,
          // Same `now` as the stamp — see the YAP path.
          lastPlayerMoveAt: now,
        },
      },
      treasuryCash: state.treasuryCash + squeeze.comboPayout,
      activeTrades: state.activeTrades.filter((trade) => !comboCalls.some((combo) => combo.id === trade.id)),
      isWalkBackWindowActive: false,
      walkBackSecondsRemaining: 0,
      lastWalkBackNotice: `STRADDLE SQUEEZE: $${target} CALL SETTLED FOR $${Math.round(squeeze.comboPayout).toLocaleString()}.`,
    });
    return true;
  },

  // PolyGrift wagers and the S.L.O.P. audit bribe live in `predictionSlice` —
  // they are side bets and political payments, not the 0DTE market.

  tickMarket: (deltaSeconds) => {
    const state = get();
    const now = Date.now();

    // The market tick is now a thin orchestrator: three PURE engines each own
    // one rule set, and this action only wires their results into one `set`.
    //   marketEngine    — price simulation incl. the $PAIN composite
    //   settlementEngine— 0DTE expiry, walk-back unwinding, paper refunds
    //   slopEngine      — heat decay and Special Counsel raid enforcement
    // INVARIANT: $PAIN is excluded from the constituent average because it is
    // derived from that average; including it would let the index define itself.

    // INVARIANT: the tick's own `now` is threaded into the price engine so a
    // candle bucket is opened by the same instant the price was printed. If the
    // engine reached for its own `Date.now()` the two could straddle a 2s
    // boundary and file a print into a bucket the player never saw open.
    const market = tickMarketPrices(state.stocks, state.tariffRates, Math.random, now);
    const updatedStocks = market.stocks;

    // Walk-back countdown. INVARIANT: an expired window unwinds combo CALL
    // collateral for free, or the 8-second straddle window would be a trap.
    let walkBackActive = state.isWalkBackWindowActive;
    let walkBackRem = state.walkBackSecondsRemaining;
    if (walkBackActive) {
      walkBackRem -= deltaSeconds;
      if (walkBackRem <= 0) {
        walkBackActive = false;
        walkBackRem = 0;
      }
    }
    const walkBackWindowExpired = state.isWalkBackWindowActive && !walkBackActive;

    const settlement = settleExpiredTrades({
      trades: state.activeTrades,
      prices: updatedStocks,
      vexVolatility: state.vexVolatility,
      hasDarkPoolFiber: state.activeUpgrades.includes('darkpool_fiber'),
      // One live valuation for every path: a position that expires mid-Flash-Dip
      // settles at the dip, and the live P&L readout in the order slip prices
      // the same way, so the two cannot disagree about what a slam is worth.
      valuationMultiplier: flashDipValuationMultiplier(state.flashDipSecondsRemaining),
      walkBackWindowExpired,
      lastTargetStockSymbol: state.lastTargetStockSymbol,
      now,
    });
    const returnedComboCollateral = settlement.returnedComboCollateral;

    // S.L.O.P. decay and Special Counsel raid enforcement. INVARIANT: the raid
    // reads PRE-decay heat, and a seizure never drops the treasury below the
    // bankruptcy floor. See `slopEngine`.
    const postSettlementTreasury =
      state.treasuryCash +
      settlement.settledCash +
      settlement.returnedComboCollateral +
      settlement.returnedPaperCollateral;
    const slop = tickSlop(
      {
        slopSuspicion: state.slopSuspicion,
        cronyFavor: state.cronyFavor,
        treasuryCash: postSettlementTreasury,
        lastRaidTimestamp: state.lastRaidTimestamp,
        deltaSeconds,
        now,
        raidsAbolished: raidsAbolished(state.unlockedPerks),
      },
      state.lastRaidMessage
    );
    if (slop.raided) {
      if (slop.averted) sound.playChaChing();
      else sound.playDeskThud();
    }

    const newVex = Math.max(VEX_BASELINE, state.vexVolatility - VEX_DECAY_PER_SECOND * deltaSeconds);

    set({
      treasuryCash: slop.treasuryCash,
      lifetimeOptionsProfit: state.lifetimeOptionsProfit + settlement.settledProfit,
      cronyFavor: slop.cronyFavor,
      stocks: updatedStocks,
      activeTrades: settlement.remainingTrades,
      isWalkBackWindowActive: walkBackActive,
      walkBackSecondsRemaining: Math.max(0, walkBackRem),
      lastWalkBackNotice: walkBackWindowExpired
        ? returnedComboCollateral > 0
          ? 'WINDOW MISSED. Combo CALL collateral returned; realized PUT gains are untouched.'
          : 'WINDOW CLOSED. Buy a matching CALL during the next crash to attempt the squeeze.'
        : state.lastWalkBackNotice,
      slopSuspicion: slop.slopSuspicion,
      vexVolatility: newVex,
      lastRaidMessage: slop.lastRaidMessage,
      lastRaidTimestamp: slop.lastRaidTimestamp,
      // Hand back the practice trades that were refunded, capped at the
      // original allowance so a long-running exploit can never bank extra.
      paperTradesRemaining: Math.min(
        PAPER_TRADE_ALLOWANCE,
        state.paperTradesRemaining + settlement.refundedPaperAllowance
      ),
    });
  },

  /**
   * INVARIANT: [The Palm-a-Grifto Golf Protocol]
   * Every open contract's clock is pushed forward by the offline duration, so a
   * player who closes the tab mid-trade never returns to an expired position
   * they could not have managed. See `extendTradesForOffline`.
   */
  extendActiveTradesForOffline: (elapsedSeconds) => {
    if (elapsedSeconds <= 0) return;
    set((state) => ({ activeTrades: extendTradesForOffline(state.activeTrades, elapsedSeconds) }));
  },
});
