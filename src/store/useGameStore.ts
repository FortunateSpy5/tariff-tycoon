/**
 * Root Game Store: Integrates domain slices with localStorage persistence.
 * 
 * INVARIANT: [The Palm-a-Grifto Golf Protocol]
 * On storage rehydration, calculates passive treasury earnings accrued while offline (up to 48 hours).
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
        totalClicks: state.totalClicks,
        inkRefillCount: state.inkRefillCount,
        sovereignImmunitySlips: state.sovereignImmunitySlips,
        totalSISLifetime: state.totalSISLifetime,
        flightToCaymansCount: state.flightToCaymansCount,
        unlockedPerks: state.unlockedPerks,
        executiveDecrees: state.executiveDecrees,
        americaLLCIncorporated: state.americaLLCIncorporated,
        cronyFavor: state.cronyFavor,
        agencies: state.agencies,
        isMuted: state.isMuted,
        screenShakeEnabled: state.screenShakeEnabled,
        streamerMode: state.streamerMode,
        lastSavedTimestamp: Date.now(),
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const now = Date.now();
        const offlineSeconds = Math.max(0, (now - state.lastSavedTimestamp) / 1000);

        if (offlineSeconds > 5 && state.passiveCashPerSecond > 0) {
          const { cashEarned, secondsCredited } = calculateOfflineEarnings(
            state.passiveCashPerSecond,
            offlineSeconds
          );
          if (cashEarned > 0) {
            state.treasuryCash += cashEarned;
            console.log(
              `[Palm-a-Grifto Protocol] Welcome back! While golfing, collected ${cashEarned} over ${secondsCredited}s.`
            );
          }
        }
      },
    }
  )
);
