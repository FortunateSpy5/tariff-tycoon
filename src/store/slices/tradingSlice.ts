import type { StateCreator } from 'zustand';
import type { MarketState, StockSymbol, OptionType, ActiveOptionTrade, StockDefinition } from '../../types/market';
import type { YapPost } from '../../types/yap';
import type { GameStore } from '../useGameStore';
import { INITIAL_STOCKS } from '../../constants/stocks';
import { INITIAL_POLYGRIFT_BETS } from '../../constants/unlocks';
import { PARODY_NATIONS } from '../../constants/nations';
import {
  MAX_CRASH_SEVERITY,
  VEX_BASELINE,
  VEX_CAP,
  VEX_DECAY_PER_SECOND,
  VEX_GAIN_SELECTED,
  VEX_GAIN_SHOTGUN,
  CRONY_FAVOR_PER_YAP,
  CRONY_FAVOR_MAX,
} from '../../constants/balance';
import { calculateOptionReturn } from '../../engine/math/formulas';
import {
  PAPER_TRADE_ALLOWANCE,
  PAPER_TRADE_WIN_TANTRUM,
} from '../../constants/onboarding';
import { sound } from '../../audio/soundEngine';

export interface TradingSlice extends MarketState {
  lastYapPost: YapPost | undefined;
  /** Cumulative realized profit from settled option trades this run (drives the prestige SIS formula). */
  lifetimeOptionsProfit: number;
  /**
   * Risk-free contracts remaining in the onboarding allowance.
   * Paper trades still lock collateral and still pay real winnings, but losses
   * are refunded in full — the player learns the causal loop at zero risk.
   */
  paperTradesRemaining: number;
  /** Total profitable paper trades, surfaced on the run-summary card. */
  paperTradesWon: number;
  openOptionTrade: (symbol: StockSymbol, type: OptionType, leverage: number, collateral: number) => boolean;
  settleOptionTrade: (tradeId: string) => number;
  triggerYapMarketShock: (yap: YapPost) => { success: boolean; reason?: string; targetSymbol?: StockSymbol; combo?: boolean };
  executeWalkBack: () => boolean;
  bribeSlopAuditors: (bribeAmount: number) => boolean;
  wagerPolyGrift: (betId: string, choice: 'YES' | 'NO', amount: number) => { success: boolean; won?: boolean; payout?: number };
  tickMarket: (deltaSeconds: number) => void;
  extendActiveTradesForOffline: (elapsedSeconds: number) => void;
  setYapTargetMode: (mode: 'selected' | 'shotgun') => void;
  setSelectedStock: (symbol: StockSymbol) => void;
  dismissRaidAlert: () => void;
}

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

  openOptionTrade: (symbol, type, leverage, collateral) => {
    const state = get();
    const stock = state.stocks[symbol];
    if (!state.hasMarketAccess || !stock || collateral <= 0 || state.treasuryCash < collateral) return false;

    const isWalkBackCombo =
      state.isWalkBackWindowActive && type === 'CALL' && symbol === state.lastTargetStockSymbol;

    // REDESIGN: [Safe Practice Stakes]
    // While the onboarding allowance is live, contracts are PAPER TRADES. They
    // behave identically in every way EXCEPT that a losing settlement refunds
    // the collateral instead of banking a loss. This lets a brand-new player
    // learn "open PUT -> YAP -> crash -> settle" without being bankrupted by
    // their own first guess, which was the single biggest early-game churn risk.
    const isPaperTrade = state.paperTradesRemaining > 0;

    // Strike is the price the contract bets on: PUTs profit below entry, CALLs above.
    // Target is the 5% move the degen is praying for.
    const strikePrice =
      type === 'PUT' ? stock.currentPrice * 0.95 : stock.currentPrice * 1.05;
    const targetPrice =
      type === 'PUT' ? stock.currentPrice * 0.9 : stock.currentPrice * 1.1;

    const newTrade: ActiveOptionTrade = {
      id: `trade-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      symbol,
      type,
      entryPrice: stock.currentPrice,
      targetPrice,
      strikePrice,
      leverage,
      contractsCount: Math.floor(collateral / 10),
      collateralLocked: collateral,
      openedAtTimestamp: Date.now(),
      expiresAtTimestamp: Date.now() + 60000, // 60-second contracts
      isSettled: false,
      profitOrLoss: 0,
      isWalkBackCombo,
      isPaperTrade,
    };

    sound.playChaChing();

    // Deduct collateral from treasuryCash and lock into option contract
    set({
      treasuryCash: state.treasuryCash - collateral,
      activeTrades: [...state.activeTrades, newTrade],
      slopSuspicion: Math.min(100, state.slopSuspicion + (leverage > 100 ? 5 : 1)),
      paperTradesRemaining: isPaperTrade ? state.paperTradesRemaining - 1 : state.paperTradesRemaining,
      // Tutorial: opening the first contract completes "Open A Paper Put" and
      // points the player at the YAP button.
      tutorialStepIndex: state.tutorialStepIndex === 1 ? 2 : state.tutorialStepIndex,
    });
    return true;
  },

  settleOptionTrade: (tradeId) => {
    const state = get();
    const trade = state.activeTrades.find((t) => t.id === tradeId);
    if (!trade || trade.isSettled) return 0;

    const stock = state.stocks[trade.symbol];
    const hasDarkPoolFiber = state.activeUpgrades.includes('darkpool_fiber');
    const netProfit = calculateOptionReturn(
      trade.type,
      trade.entryPrice,
      stock.currentPrice,
      trade.leverage,
      trade.collateralLocked,
      state.vexVolatility,
      hasDarkPoolFiber
    );

    const totalPayout = Math.max(0, trade.collateralLocked + netProfit);

    // INVARIANT: [Safe Practice Stakes — losses are training, not punishment]
    // A paper trade that loses refunds the collateral instead of banking the
    // loss. The player still feels the miss (the P&L line reads red) and still
    // burns the allowance, but a wrong first guess can never zero out a brand
    // new treasury. Wins pay out for real, so the loop still teaches that
    // front-running yourself WORKS — which is the whole pitch.
    const isLoss = netProfit < 0;
    const refundedPaperLoss = trade.isPaperTrade && isLoss;
    const creditedPayout = refundedPaperLoss ? trade.collateralLocked : totalPayout;

    // Credit proceeds back to treasuryCash
    const settledYapPut =
      trade.type === 'PUT' &&
      trade.symbol === state.lastTargetStockSymbol &&
      state.lastYapTimestamp > trade.openedAtTimestamp;
    set({
      treasuryCash: state.treasuryCash + creditedPayout,
      lifetimeOptionsProfit: state.lifetimeOptionsProfit + Math.max(0, netProfit),
      activeTrades: state.activeTrades.filter((t) => t.id !== tradeId),
      hasSettledYapTrade: state.hasSettledYapTrade || settledYapPut,
      hasPolyGriftAccess: state.hasPolyGriftAccess || settledYapPut,
      // Tutorial: settling the first YAP-targeted PUT completes "Settle The Contract".
      tutorialStepIndex:
        settledYapPut && state.tutorialStepIndex === 3
          ? 4
          : state.tutorialStepIndex,
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

  triggerYapMarketShock: (yap) => {
    const state = get();
    const now = Date.now();

    if (!state.hasMarketAccess) {
      return { success: false, reason: 'BagHolder Pro access is required to launch a market YAP.' };
    }

    // 1. INVARIANT: Cooldown enforcement (10s base cooldown)
    const elapsed = (now - state.lastYapTimestamp) / 1000;
    if (elapsed < state.yapCooldownSeconds) {
      const rem = Math.ceil(state.yapCooldownSeconds - elapsed);
      return { success: false, reason: `YAP on cooldown (${rem}s remaining)` };
    }

    // 2. INVARIANT: Ink Stamina requirement (costs 20 ink to launch a 3:00 AM lethal decree)
    if (state.inkLevel < 20) {
      return { success: false, reason: 'Need at least 20 Ink to sign a 3:00 AM Lethal YAP!' };
    }

    // 3. Target resolution based on yapTargetMode toggle
    let target: StockSymbol = state.selectedStock || 'DOOR';
    const isShotgun = state.yapTargetMode === 'shotgun';

    if (isShotgun) {
      const stockSymbols = Object.keys(state.stocks) as StockSymbol[];
      target = stockSymbols[Math.floor(Math.random() * stockSymbols.length)];
    }

    const targetStock = state.stocks[target];
    if (!targetStock) return { success: false, reason: 'Target stock not found' };

    // Causal flash crash tied to tariff percentage, Frenzy mode, and Shotgun bonus.
    // GDD §3.2: d = min(0.92, (0.25 + tariff/1000) * M_frenzy * M_shotgun); S_crash = max(1, S0 * (1 - d))
    const frenzyBonus = state.isCapsFrenzy ? 1.4 : 1.0;
    const shotgunBonus = isShotgun ? 1.25 : 1.0; // +25% severity for unhinged shotgun
    const tariffMagnitude = (yap.tariffPercentage || 100) / 1000;
    const crashSeverity = Math.min(
      MAX_CRASH_SEVERITY,
      (0.25 + tariffMagnitude) * frenzyBonus * shotgunBonus
    );
    const crashMultiplier = 1.0 - crashSeverity;

    const newPrice = Math.max(1.0, +(targetStock.currentPrice * crashMultiplier).toFixed(2));
    const newHistory = [...targetStock.priceHistory.slice(1), newPrice];

    // Check if player has an active PUT on this target stock (INSIDER COMBO!)
    const hasActivePut = state.activeTrades.some((t) => t.symbol === target && t.type === 'PUT');

    sound.playDeskThud();
    if (hasActivePut) {
      sound.playChaChing();
    }

    set({
      stocks: {
        ...state.stocks,
        [target]: {
          ...targetStock,
          currentPrice: newPrice,
          priceHistory: newHistory,
        },
      },
      inkLevel: Math.max(0, state.inkLevel - 20),
      lastTargetStockSymbol: target,
      lastYapPost: yap,
      isWalkBackWindowActive: true,
      walkBackSecondsRemaining: 8, // 8-second Straddle Squeeze window
      lastWalkBackNotice: undefined,
      lastYapTimestamp: now,
      hasRadarAccess: true,
      // Tutorial: firing the first YAP completes "Open A Paper Put" and shows
      // "Launch A 3:00 AM YAP". The chain teaches, then hands over the desk.
      tutorialStepIndex: state.tutorialStepIndex === 2 ? 3 : state.tutorialStepIndex,
      slopSuspicion: Math.min(100, state.slopSuspicion + (isShotgun ? 16 : 12)),
      // Crony Favor faucet: landing a YAP earns political capital.
      cronyFavor: Math.min(CRONY_FAVOR_MAX, state.cronyFavor + CRONY_FAVOR_PER_YAP),
      vexVolatility: Math.min(
        VEX_CAP,
        state.vexVolatility + (isShotgun ? VEX_GAIN_SHOTGUN : VEX_GAIN_SELECTED)
      ),
    });

    return { success: true, targetSymbol: target, combo: hasActivePut };
  },

  executeWalkBack: () => {
    const state = get();
    if (!state.isWalkBackWindowActive) return false;

    const target = state.lastTargetStockSymbol;
    if (!target || !state.stocks[target]) return false;

    const comboCalls = state.activeTrades.filter(
      (trade) => trade.isWalkBackCombo && trade.symbol === target && trade.type === 'CALL'
    );
    if (comboCalls.length === 0) return false;

    const targetStock = state.stocks[target];
    // Pump ONLY the previously crashed target stock back up (+35%)
    const pumpPrice = +(targetStock.currentPrice * 1.35).toFixed(2);
    const newHistory = [...targetStock.priceHistory.slice(1), pumpPrice];
    const hasDarkPoolFiber = state.activeUpgrades.includes('darkpool_fiber');
    const comboPayout = comboCalls.reduce((total, trade) => {
      const netProfit = calculateOptionReturn(
        trade.type,
        trade.entryPrice,
        pumpPrice,
        trade.leverage,
        trade.collateralLocked,
        state.vexVolatility,
        hasDarkPoolFiber
      );
      return total + Math.max(0, trade.collateralLocked + netProfit);
    }, 0);

    sound.playChaChing();

    set({
      stocks: {
        ...state.stocks,
        [target]: {
          ...targetStock,
          currentPrice: pumpPrice,
          priceHistory: newHistory,
        },
      },
      treasuryCash: state.treasuryCash + comboPayout,
      activeTrades: state.activeTrades.filter((trade) => !comboCalls.some((combo) => combo.id === trade.id)),
      isWalkBackWindowActive: false,
      walkBackSecondsRemaining: 0,
      lastWalkBackNotice: `STRADDLE SQUEEZE: $${target} CALL SETTLED FOR $${Math.round(comboPayout).toLocaleString()}.`,
    });
    return true;
  },

  bribeSlopAuditors: (bribeAmount) => {
    const state = get();
    if (!state.hasRadarAccess || state.cronyFavor < bribeAmount) return false;

    set({
      cronyFavor: state.cronyFavor - bribeAmount,
      slopSuspicion: Math.max(0, state.slopSuspicion - bribeAmount * 0.8),
    });
    return true;
  },

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
      slopSuspicion: Math.min(100, state.slopSuspicion + (won ? 3 : 1)),
    });

    return { success: true, won, payout };
  },

  tickMarket: (deltaSeconds) => {
    const state = get();
    const now = Date.now();

    // 1. Cross-stock and tariff effects
    const updatedStocks: Record<StockSymbol, StockDefinition> = {} as Record<StockSymbol, StockDefinition>;
    let constituentSum = 0;
    let constituentCount = 0;

    (Object.keys(state.stocks) as StockSymbol[]).forEach((sym) => {
      if (sym === 'PAIN') return;
      const s = state.stocks[sym];

      // Calculate tariff pressure from linked parody nations
      let tariffPressure = 0;
      PARODY_NATIONS.forEach((nation) => {
        if (nation.linkedStocks.includes(sym)) {
          const rate = state.tariffRates[nation.id] ?? nation.defaultTariffRate;
          if (rate > 100) {
            // Punitive tariff depresses foreign stock price drift
            tariffPressure -= ((rate - 100) / 100) * 0.0004;
          } else if (rate < 50) {
            // Trade relief rally
            tariffPressure += 0.0002;
          }
        }
      });

      const noise = (Math.random() - 0.49) * 0.01 * s.volatilityMultiplier + tariffPressure;
      const nextPrice = Math.max(0.5, +(s.currentPrice * (1 + noise)).toFixed(2));
      const prevHist = s.priceHistory || [];
      const updatedHist = prevHist.length >= 20 ? [...prevHist.slice(1), nextPrice] : [...prevHist, nextPrice];
      updatedStocks[sym] = {
        ...s,
        currentPrice: nextPrice,
        priceHistory: updatedHist,
      };
      constituentSum += nextPrice;
      constituentCount += 1;
    });

    // 2. $PAIN is the benchmark composite index reflecting constituent stocks and Strike Republic trade pressure
    let painTariffPressure = 0;
    PARODY_NATIONS.forEach((nation) => {
      if (nation.linkedStocks.includes('PAIN')) {
        const rate = state.tariffRates[nation.id] ?? nation.defaultTariffRate;
        if (rate > 100) {
          painTariffPressure -= ((rate - 100) / 100) * 0.0006;
        } else if (rate < 50) {
          painTariffPressure += 0.0003;
        }
      }
    });

    const painStock = state.stocks['PAIN'];
    if (painStock) {
      const avgConstituent = constituentCount > 0 ? constituentSum / constituentCount : 100;
      const noise = (Math.random() - 0.495) * 0.004;
      const targetPain = Math.max(
        10,
        +(painStock.currentPrice * (1 + noise + painTariffPressure) + (avgConstituent - 100) * 0.04).toFixed(2)
      );
      const painHist = painStock.priceHistory || [];
      const updatedPainHist = painHist.length >= 20 ? [...painHist.slice(1), targetPain] : [...painHist, targetPain];
      updatedStocks['PAIN'] = {
        ...painStock,
        currentPrice: targetPain,
        priceHistory: updatedPainHist,
      };
    }

    // 3. Walk-back countdown
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

    // 4. Auto-settle expired option trades
    let netSettledCash = 0;
    let netSettledProfit = 0;
    let returnedComboCollateral = 0;
    // INVARIANT: [Safe Practice Stakes holds on auto-settle too]
    // Expiry is a settlement path like any other, so it must honour the paper
    // refund and restore the allowance. Without this, a player who opened
    // contracts and let them lapse would silently forfeit both their practice
    // trades and their refund — the harshest possible lesson for a beginner.
    let returnedPaperCollateral = 0;
    let refundedPaperAllowance = 0;
    const remainingTrades: ActiveOptionTrade[] = [];
    const hasDarkPoolFiber = state.activeUpgrades.includes('darkpool_fiber');

    state.activeTrades.forEach((trade) => {
      if (
        walkBackWindowExpired &&
        trade.isWalkBackCombo &&
        trade.symbol === state.lastTargetStockSymbol
      ) {
        returnedComboCollateral += trade.collateralLocked;
      } else if (now >= trade.expiresAtTimestamp) {
        const stock = updatedStocks[trade.symbol] || state.stocks[trade.symbol];
        const netProfit = calculateOptionReturn(
          trade.type,
          trade.entryPrice,
          stock.currentPrice,
          trade.leverage,
          trade.collateralLocked,
          state.vexVolatility,
          hasDarkPoolFiber
        );
        if (trade.isPaperTrade && netProfit < 0) {
          // Losing paper trade: refund in full, and hand the allowance back.
          returnedPaperCollateral += trade.collateralLocked;
          refundedPaperAllowance += 1;
        } else {
          netSettledCash += Math.max(0, trade.collateralLocked + netProfit);
          netSettledProfit += Math.max(0, netProfit);
        }
      } else {
        remainingTrades.push(trade);
      }
    });

    // 5. Special Counsel Raid (100% Heat enforcement)
    let currentSuspicion = Math.max(0, state.slopSuspicion - 0.2 * deltaSeconds);
    let currentFavor = state.cronyFavor;
    let currentTreasury =
      state.treasuryCash + netSettledCash + returnedComboCollateral + returnedPaperCollateral;
    let raidMessage = state.lastRaidMessage;
    let raidTimestamp = state.lastRaidTimestamp;

    if (state.slopSuspicion >= 100 && now - (state.lastRaidTimestamp || 0) > 15000) {
      raidTimestamp = now;
      if (currentFavor >= 50) {
        // Averted via Crony Favor bribe!
        currentFavor -= 50;
        currentSuspicion = 25;
        raidMessage = 'RAID AVERTED! Bribed Special Counsel with 50 Favor (-75% Heat).';
        sound.playChaChing();
      } else {
        // Direct cash fine / asset seizure!
        const fineAmount = Math.max(5000, Math.round(currentTreasury * 0.35));
        currentTreasury = Math.max(10, currentTreasury - fineAmount);
        currentSuspicion = 20; // Plea agreement resets heat
        raidMessage = `DOJ RAID! Asset seizure executed: -$${fineAmount.toLocaleString()} (35% Treasury) confiscated!`;
        sound.playDeskThud();
      }
    }

    const newVex = Math.max(VEX_BASELINE, state.vexVolatility - VEX_DECAY_PER_SECOND * deltaSeconds);

    set({
      treasuryCash: currentTreasury,
      lifetimeOptionsProfit: state.lifetimeOptionsProfit + netSettledProfit,
      cronyFavor: currentFavor,
      stocks: updatedStocks,
      activeTrades: remainingTrades,
      isWalkBackWindowActive: walkBackActive,
      walkBackSecondsRemaining: Math.max(0, walkBackRem),
      lastWalkBackNotice: walkBackWindowExpired
        ? returnedComboCollateral > 0
          ? 'WINDOW MISSED. Combo CALL collateral returned; realized PUT gains are untouched.'
          : 'WINDOW CLOSED. Buy a matching CALL during the next crash to attempt the squeeze.'
        : state.lastWalkBackNotice,
      slopSuspicion: currentSuspicion,
      vexVolatility: newVex,
      lastRaidMessage: raidMessage,
      lastRaidTimestamp: raidTimestamp,
      // Hand back the practice trades that were refunded, capped at the
      // original allowance so a long-running exploit can never bank extra.
      paperTradesRemaining: Math.min(
        PAPER_TRADE_ALLOWANCE,
        state.paperTradesRemaining + refundedPaperAllowance
      ),
    });
  },

  extendActiveTradesForOffline: (elapsedSeconds) => {
    if (elapsedSeconds <= 0) return;
    set((state) => ({
      activeTrades: state.activeTrades.map((trade) => ({
        ...trade,
        expiresAtTimestamp: trade.expiresAtTimestamp + elapsedSeconds * 1000,
      })),
    }));
  },
});
