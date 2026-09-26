/**
 * Trading Slice: Manages BagHolder Pro, leveraged options, and causal YAP market shocks.
 */

import type { StateCreator } from 'zustand';
import type { MarketState, StockSymbol, OptionType, ActiveOptionTrade } from '../../types/market';
import type { YapPost } from '../../types/yap';
import { INITIAL_STOCKS } from '../../constants/stocks';
import { calculateOptionReturn } from '../../engine/math/formulas';
import { sound } from '../../audio/soundEngine';

export interface TradingSlice extends MarketState {
  openOptionTrade: (symbol: StockSymbol, type: OptionType, leverage: number, collateral: number) => boolean;
  settleOptionTrade: (tradeId: string) => number;
  triggerYapMarketShock: (yap: YapPost) => void;
  executeWalkBack: () => void;
  bribeSecAuditors: (bribeAmount: number) => boolean;
  tickMarket: (deltaSeconds: number) => void;
}

export const createTradingSlice: StateCreator<TradingSlice, [], [], TradingSlice> = (set, get) => ({
  stocks: { ...INITIAL_STOCKS },
  activeTrades: [],
  secSuspicion: 5.0,
  vixVolatility: 15.0,
  cronyFavor: 100,
  isWalkBackWindowActive: false,
  walkBackSecondsRemaining: 0,

  openOptionTrade: (symbol, type, leverage, collateral) => {
    const state = get();
    const stock = state.stocks[symbol];
    if (!stock || collateral <= 0) return false;

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

    set({
      activeTrades: [...state.activeTrades, newTrade],
      secSuspicion: Math.min(100, state.secSuspicion + (leverage > 100 ? 5 : 1)),
    });
    sound.playChaChing();
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
      trade.collateralLocked
    );

    set({
      activeTrades: state.activeTrades.filter((t) => t.id !== tradeId),
    });

    if (netProfit > 0) {
      sound.playChaChing();
    }
    return trade.collateralLocked + netProfit;
  },

  triggerYapMarketShock: (yap) => {
    const state = get();
    const target = yap.targetSymbol || 'PAIN';
    const targetStock = state.stocks[target];
    if (!targetStock) return;

    // Causal flash crash: drop target stock by 25% to 45%
    const crashMultiplier = 1.0 - (0.25 + Math.random() * 0.2);
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
      isWalkBackWindowActive: true,
      walkBackSecondsRemaining: 8, // 8-second Straddle Squeeze window
      secSuspicion: Math.min(100, state.secSuspicion + 12),
      vixVolatility: Math.min(80, state.vixVolatility + 25),
    });
  },

  executeWalkBack: () => {
    const state = get();
    if (!state.isWalkBackWindowActive) return;

    // Pump markets back up +30%
    const updatedStocks = { ...state.stocks };
    Object.keys(updatedStocks).forEach((sym) => {
      const s = updatedStocks[sym as StockSymbol];
      const pumpPrice = +(s.currentPrice * 1.3).toFixed(2);
      s.currentPrice = pumpPrice;
      s.priceHistory = [...s.priceHistory.slice(1), pumpPrice];
    });

    sound.playChaChing();
    set({
      stocks: updatedStocks,
      isWalkBackWindowActive: false,
      walkBackSecondsRemaining: 0,
      cronyFavor: state.cronyFavor + 25,
    });
  },

  bribeSecAuditors: (bribeAmount) => {
    const state = get();
    if (state.cronyFavor < bribeAmount) return false;

    set({
      cronyFavor: state.cronyFavor - bribeAmount,
      secSuspicion: Math.max(0, state.secSuspicion - bribeAmount * 0.8),
    });
    return true;
  },

  tickMarket: (deltaSeconds) => {
    const state = get();

    // Natural random noise on stock prices
    const updatedStocks = { ...state.stocks };
    Object.keys(updatedStocks).forEach((sym) => {
      const s = updatedStocks[sym as StockSymbol];
      const noise = (Math.random() - 0.49) * 0.01 * s.volatilityMultiplier;
      const nextPrice = Math.max(0.5, +(s.currentPrice * (1 + noise)).toFixed(2));
      s.currentPrice = nextPrice;
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

    // Passive suspicion decay (-0.2% / sec)
    const newSuspicion = Math.max(0, state.secSuspicion - 0.2 * deltaSeconds);

    set({
      stocks: updatedStocks,
      isWalkBackWindowActive: walkBackActive,
      walkBackSecondsRemaining: Math.max(0, walkBackRem),
      secSuspicion: newSuspicion,
    });
  },
});
