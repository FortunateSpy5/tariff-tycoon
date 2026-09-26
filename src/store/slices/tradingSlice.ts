/**
 * Trading Slice: Manages BagHolder Pro, leveraged options, and causal YAP market shocks.
 */

import type { StateCreator } from 'zustand';
import type { MarketState, StockSymbol, OptionType, ActiveOptionTrade, StockDefinition } from '../../types/market';
import type { YapPost } from '../../types/yap';
import type { GameStore } from '../useGameStore';
import { INITIAL_STOCKS } from '../../constants/stocks';
import { calculateOptionReturn } from '../../engine/math/formulas';
import { sound } from '../../audio/soundEngine';

export interface TradingSlice extends MarketState {
  openOptionTrade: (symbol: StockSymbol, type: OptionType, leverage: number, collateral: number) => boolean;
  settleOptionTrade: (tradeId: string) => number;
  triggerYapMarketShock: (yap: YapPost) => void;
  executeWalkBack: () => void;
  bribeSlopAuditors: (bribeAmount: number) => boolean;
  tickMarket: (deltaSeconds: number) => void;
}

export const createTradingSlice: StateCreator<GameStore, [], [], TradingSlice> = (set, get) => ({
  stocks: { ...INITIAL_STOCKS },
  activeTrades: [],
  slopSuspicion: 5.0,
  vexVolatility: 15.0,
  cronyFavor: 100,
  isWalkBackWindowActive: false,
  walkBackSecondsRemaining: 0,
  lastTargetStockSymbol: undefined,

  openOptionTrade: (symbol, type, leverage, collateral) => {
    const state = get();
    const stock = state.stocks[symbol];
    if (!stock || collateral <= 0 || state.treasuryCash < collateral) return false;

    const newTrade: ActiveOptionTrade = {
      id: `trade-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      symbol,
      type,
      entryPrice: stock.currentPrice,
      targetPrice: stock.currentPrice,
      strikePrice: stock.currentPrice,
      leverage,
      contractsCount: Math.floor(collateral / 10),
      collateralLocked: collateral,
      openedAtTimestamp: Date.now(),
      expiresAtTimestamp: Date.now() + 60000, // 60-second contracts
      isSettled: false,
      profitOrLoss: 0,
    };

    sound.playChaChing();

    // Deduct collateral from treasuryCash and lock into option contract
    set({
      treasuryCash: state.treasuryCash - collateral,
      activeTrades: [...state.activeTrades, newTrade],
      slopSuspicion: Math.min(100, state.slopSuspicion + (leverage > 100 ? 5 : 1)),
    });
    return true;
  },

  settleOptionTrade: (tradeId) => {
    const state = get();
    const trade = state.activeTrades.find((t) => t.id === tradeId);
    if (!trade || trade.isSettled) return 0;

    const stock = state.stocks[trade.symbol];
    const netProfit = calculateOptionReturn(
      trade.type,
      trade.entryPrice,
      stock.currentPrice,
      trade.leverage,
      trade.collateralLocked,
      state.vexVolatility
    );

    const totalPayout = Math.max(0, trade.collateralLocked + netProfit);

    // Credit proceeds back to treasuryCash
    set({
      treasuryCash: state.treasuryCash + totalPayout,
      activeTrades: state.activeTrades.filter((t) => t.id !== tradeId),
    });

    if (netProfit > 0) {
      sound.playChaChing();
    }
    return totalPayout;
  },

  triggerYapMarketShock: (yap) => {
    const state = get();
    const target = yap.targetSymbol || 'PAIN';
    const targetStock = state.stocks[target];
    if (!targetStock) return;

    // Causal flash crash tied to tariff percentage and Frenzy mode
    const frenzyBonus = state.isCapsFrenzy ? 1.4 : 1.0;
    const tariffMagnitude = (yap.tariffPercentage || 100) / 1000;
    const crashMultiplier = Math.max(0.08, 1.0 - (0.25 + tariffMagnitude) * frenzyBonus);

    const newPrice = Math.max(1.0, +(targetStock.currentPrice * crashMultiplier).toFixed(2));
    const newHistory = [...targetStock.priceHistory.slice(1), newPrice];

    sound.playDeskThud();

    set({
      stocks: {
        ...state.stocks,
        [target]: {
          ...targetStock,
          currentPrice: newPrice,
          priceHistory: newHistory,
        },
      },
      lastTargetStockSymbol: target,
      isWalkBackWindowActive: true,
      walkBackSecondsRemaining: 8, // 8-second Straddle Squeeze window
      slopSuspicion: Math.min(100, state.slopSuspicion + 12),
      vexVolatility: Math.min(80, state.vexVolatility + 25),
    });
  },

  executeWalkBack: () => {
    const state = get();
    if (!state.isWalkBackWindowActive) return;

    const target = state.lastTargetStockSymbol;
    if (!target || !state.stocks[target]) return;

    const targetStock = state.stocks[target];
    // Pump ONLY the previously crashed target stock back up (+35%)
    const pumpPrice = +(targetStock.currentPrice * 1.35).toFixed(2);
    const newHistory = [...targetStock.priceHistory.slice(1), pumpPrice];

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
      isWalkBackWindowActive: false,
      walkBackSecondsRemaining: 0,
      cronyFavor: state.cronyFavor + 25,
    });
  },

  bribeSlopAuditors: (bribeAmount) => {
    const state = get();
    if (state.cronyFavor < bribeAmount) return false;

    set({
      cronyFavor: state.cronyFavor - bribeAmount,
      slopSuspicion: Math.max(0, state.slopSuspicion - bribeAmount * 0.8),
    });
    return true;
  },

  tickMarket: (deltaSeconds) => {
    const state = get();

    // Immutable update of stock prices without in-place mutation
    const updatedStocks: Record<StockSymbol, StockDefinition> = {} as Record<StockSymbol, StockDefinition>;
    (Object.keys(state.stocks) as StockSymbol[]).forEach((sym) => {
      const s = state.stocks[sym];
      const noise = (Math.random() - 0.49) * 0.01 * s.volatilityMultiplier;
      const nextPrice = Math.max(0.5, +(s.currentPrice * (1 + noise)).toFixed(2));
      updatedStocks[sym] = {
        ...s,
        currentPrice: nextPrice,
      };
    });

    // Walk-back countdown
    let walkBackActive = state.isWalkBackWindowActive;
    let walkBackRem = state.walkBackSecondsRemaining;
    if (walkBackActive) {
      walkBackRem -= deltaSeconds;
      if (walkBackRem <= 0) {
        walkBackActive = false;
        walkBackRem = 0;
      }
    }

    // Auto-settle expired option trades
    const now = Date.now();
    let netSettledCash = 0;
    const remainingTrades: ActiveOptionTrade[] = [];

    state.activeTrades.forEach((trade) => {
      if (now >= trade.expiresAtTimestamp) {
        const stock = updatedStocks[trade.symbol] || state.stocks[trade.symbol];
        const netProfit = calculateOptionReturn(
          trade.type,
          trade.entryPrice,
          stock.currentPrice,
          trade.leverage,
          trade.collateralLocked,
          state.vexVolatility
        );
        netSettledCash += Math.max(0, trade.collateralLocked + netProfit);
      } else {
        remainingTrades.push(trade);
      }
    });

    // Passive suspicion decay (-0.2% / sec)
    const newSuspicion = Math.max(0, state.slopSuspicion - 0.2 * deltaSeconds);
    const newVex = Math.max(15.0, state.vexVolatility - 0.5 * deltaSeconds);

    set({
      treasuryCash: state.treasuryCash + netSettledCash,
      stocks: updatedStocks,
      activeTrades: remainingTrades,
      isWalkBackWindowActive: walkBackActive,
      walkBackSecondsRemaining: Math.max(0, walkBackRem),
      slopSuspicion: newSuspicion,
      vexVolatility: newVex,
    });
  },
});
