/**
 * Root Game Store: Integrates domain slices with localStorage persistence.
 * 
 * INVARIANT: [The Palm-a-Grifto Golf Protocol]
 * On storage rehydration, calculates passive treasury earnings accrued while offline (up to 48 hours).
 * Freezes and extends all active option trade expiration timers so players are never punished for absence.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createDeskSlice, type DeskSlice } from './slices/deskSlice';
import { createTradingSlice, type TradingSlice } from './slices/tradingSlice';
import { createDumpSlice, type DumpSlice } from './slices/dumpSlice';
import { createPrestigeSlice, type PrestigeSlice } from './slices/prestigeSlice';
import { createSettingsSlice, type SettingsSlice } from './slices/settingsSlice';
import { calculateOfflineEarnings } from '../engine/math/formulas';

export type GameStore = DeskSlice &
  TradingSlice &
  DumpSlice &
  PrestigeSlice &
  SettingsSlice;

export const useGameStore = create<GameStore>()(
  persist(
    (...a) => ({
      ...createDeskSlice(...a),
      ...createTradingSlice(...a),
      ...createDumpSlice(...a),
      ...createPrestigeSlice(...a),
      ...createSettingsSlice(...a),
    }),
    {
      name: 'executive_degen_save_v1',
      partialize: (state) => ({
        phase: state.phase,
        treasuryCash: state.treasuryCash,
        passiveCashPerSecond: state.passiveCashPerSecond,
        tariffRevenuePerSecond: state.tariffRevenuePerSecond,
        totalClicks: state.totalClicks,
        inkLevel: state.inkLevel,
        dryClicksCount: state.dryClicksCount,
        inkRefillCount: state.inkRefillCount,
        sovereignImmunitySlips: state.sovereignImmunitySlips,
        totalSISLifetime: state.totalSISLifetime,
        flightToCaymansCount: state.flightToCaymansCount,
        unlockedPerks: state.unlockedPerks,
        executiveDecrees: state.executiveDecrees,
        americaLLCIncorporated: state.americaLLCIncorporated,
        cronyFavor: state.cronyFavor,
        agencies: state.agencies,
        stocks: state.stocks,
        activeTrades: state.activeTrades,
        slopSuspicion: state.slopSuspicion,
        vexVolatility: state.vexVolatility,
        activeUpgrades: state.activeUpgrades,
        tariffRates: state.tariffRates,
        yapTargetMode: state.yapTargetMode,
        selectedStock: state.selectedStock,
        lastYapTimestamp: state.lastYapTimestamp,
        lastRaidTimestamp: state.lastRaidTimestamp,
        lastShredTimestamp: state.lastShredTimestamp,
        lastSecretSaleTimestamp: state.lastSecretSaleTimestamp,
        activeLeftTab: state.activeLeftTab,
        activeRightTab: state.activeRightTab,
        isMuted: state.isMuted,
        screenShakeEnabled: state.screenShakeEnabled,
        streamerMode: state.streamerMode,
        lastSavedTimestamp: Date.now(),
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const now = Date.now();
        const offlineSeconds = Math.max(0, (now - state.lastSavedTimestamp) / 1000);

        if (offlineSeconds > 5) {
          // Calculate passive cash accrued (agency passive yields + bilateral tariff export duties)
          const totalPassiveRate = (state.passiveCashPerSecond || 0) + (state.tariffRevenuePerSecond || 0);
          if (totalPassiveRate > 0) {
            const { cashEarned, secondsCredited } = calculateOfflineEarnings(
              totalPassiveRate,
              offlineSeconds
            );
            if (cashEarned > 0) {
              state.treasuryCash += cashEarned;
              console.log(
                `[Palm-a-Grifto Protocol] Welcome back! While golfing, collected $${cashEarned.toFixed(2)} over ${secondsCredited}s.`
              );
            }
          }

          // Offline Crony Favor accrual (+1 per minute offline)
          const offlineCronyBonus = Math.floor(Math.min(offlineSeconds, 48 * 3600) / 60);
          state.cronyFavor += offlineCronyBonus;

          // Extend expiration timestamp of all active trades by offlineSeconds
          if (state.activeTrades && state.activeTrades.length > 0) {
            state.activeTrades = state.activeTrades.map((trade) => ({
              ...trade,
              expiresAtTimestamp: trade.expiresAtTimestamp + offlineSeconds * 1000,
            }));
          }
        }
      },
    }
  )
);
