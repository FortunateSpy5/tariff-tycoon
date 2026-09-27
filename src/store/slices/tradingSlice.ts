import type { StateCreator } from 'zustand';
import type { MarketState, StockSymbol, OptionType, ActiveOptionTrade, StockDefinition } from '../../types/market';
import type { YapPost } from '../../types/yap';
import type { GameStore } from '../useGameStore';
import { INITIAL_STOCKS } from '../../constants/stocks';
import { INITIAL_POLYGRIFT_BETS } from '../../constants/unlocks';
import { PARODY_NATIONS } from '../../constants/nations';
import { calculateOptionReturn } from '../../engine/math/formulas';
import { sound } from '../../audio/soundEngine';

export interface TradingSlice extends MarketState {
  openOptionTrade: (symbol: StockSymbol, type: OptionType, leverage: number, collateral: number) => boolean;
  settleOptionTrade: (tradeId: string) => number;
  triggerYapMarketShock: (yap: YapPost) => { success: boolean; reason?: string; targetSymbol?: StockSymbol; combo?: boolean };
  executeWalkBack: () => void;
  bribeSlopAuditors: (bribeAmount: number) => boolean;
  wagerPolyGrift: (betId: string, choice: 'YES' | 'NO', amount: number) => { success: boolean; won?: boolean; payout?: number };
  tickMarket: (deltaSeconds: number) => void;
  setYapTargetMode: (mode: 'selected' | 'shotgun') => void;
  setSelectedStock: (symbol: StockSymbol) => void;
  dismissRaidAlert: () => void;
}

export const createTradingSlice: StateCreator<GameStore, [], [], TradingSlice> = (set, get) => ({
  stocks: { ...INITIAL_STOCKS },
  activeTrades: [],
  slopSuspicion: 5.0,
  vexVolatility: 15.0,
  cronyFavor: 30,
  isWalkBackWindowActive: false,
  walkBackSecondsRemaining: 0,
  lastTargetStockSymbol: undefined,
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
    const now = Date.now();

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

    // Causal flash crash tied to tariff percentage, Frenzy mode, and Shotgun bonus
    const frenzyBonus = state.isCapsFrenzy ? 1.4 : 1.0;
    const shotgunBonus = isShotgun ? 1.25 : 1.0; // +25% severity for unhinged shotgun
    const tariffMagnitude = (yap.tariffPercentage || 100) / 1000;
    const crashMultiplier = Math.max(0.08, 1.0 - (0.25 + tariffMagnitude) * frenzyBonus * shotgunBonus);

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
      isWalkBackWindowActive: true,
      walkBackSecondsRemaining: 8, // 8-second Straddle Squeeze window
      lastYapTimestamp: now,
      slopSuspicion: Math.min(100, state.slopSuspicion + (isShotgun ? 16 : 12)),
      vexVolatility: Math.min(80, state.vexVolatility + (isShotgun ? 35 : 25)),
    });

    return { success: true, targetSymbol: target, combo: hasActivePut };
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

  wagerPolyGrift: (betId, choice, amount) => {
    const state = get();
    if (state.treasuryCash < amount || amount <= 0) return { success: false };

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

    // 4. Auto-settle expired option trades
    let netSettledCash = 0;
    const remainingTrades: ActiveOptionTrade[] = [];
    const hasDarkPoolFiber = state.activeUpgrades.includes('darkpool_fiber');

    state.activeTrades.forEach((trade) => {
      if (now >= trade.expiresAtTimestamp) {
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
        netSettledCash += Math.max(0, trade.collateralLocked + netProfit);
      } else {
        remainingTrades.push(trade);
      }
    });

    // 5. Special Counsel Raid (100% Heat enforcement)
    let currentSuspicion = Math.max(0, state.slopSuspicion - 0.2 * deltaSeconds);
    let currentFavor = state.cronyFavor;
    let currentTreasury = state.treasuryCash + netSettledCash;
    let raidMessage = state.lastRaidMessage;
    let raidTimestamp = state.lastRaidTimestamp;

    if (state.slopSuspicion >= 100 && now - (state.lastRaidTimestamp || 0) > 15000) {
      raidTimestamp = now;
      if (currentFavor >= 50) {
        // Averted via Crony Favor bribe!
        currentFavor -= 50;
        currentSuspicion = 25;
        raidMessage = '🛡️ RAID AVERTED! Bribed Special Counsel with 🤝 50 Favor (-75% Heat).';
        sound.playChaChing();
      } else {
        // Direct cash fine / asset seizure!
        const fineAmount = Math.max(5000, Math.round(currentTreasury * 0.35));
        currentTreasury = Math.max(10, currentTreasury - fineAmount);
        currentSuspicion = 20; // Plea agreement resets heat
        raidMessage = `🚨 DOJ RAID! Asset seizure executed: -$${fineAmount.toLocaleString()} (35% Treasury) confiscated!`;
        sound.playDeskThud();
      }
    }

    const newVex = Math.max(15.0, state.vexVolatility - 0.5 * deltaSeconds);

    set({
      treasuryCash: currentTreasury,
      cronyFavor: currentFavor,
      stocks: updatedStocks,
      activeTrades: remainingTrades,
      isWalkBackWindowActive: walkBackActive,
      walkBackSecondsRemaining: Math.max(0, walkBackRem),
      slopSuspicion: currentSuspicion,
      vexVolatility: newVex,
      lastRaidMessage: raidMessage,
      lastRaidTimestamp: raidTimestamp,
    });
  },
});
