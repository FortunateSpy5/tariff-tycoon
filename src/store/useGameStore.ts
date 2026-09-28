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
        hasMarketAccess: state.hasMarketAccess,
        tutorialStepIndex: state.tutorialStepIndex,
        paperTradesRemaining: state.paperTradesRemaining,
        paperTradesWon: state.paperTradesWon,
        hasRadarAccess: state.hasRadarAccess,
        hasPolyGriftAccess: state.hasPolyGriftAccess,
        hasCronyUnlocksAccess: state.hasCronyUnlocksAccess,
        hasTariffAccess: state.hasTariffAccess,
        hasPrestigeAccess: state.hasPrestigeAccess,
        treasuryCash: state.treasuryCash,
        passiveCashPerSecond: state.passiveCashPerSecond,
        tariffRevenuePerSecond: state.tariffRevenuePerSecond,
        lifetimeCashEarned: state.lifetimeCashEarned,
        lifetimeOptionsProfit: state.lifetimeOptionsProfit,
        totalClicks: state.totalClicks,
        inkLevel: state.inkLevel,
        tantrumMeter: state.tantrumMeter,
        isCapsFrenzy: state.isCapsFrenzy,
        capsFrenzySecondsRemaining: state.capsFrenzySecondsRemaining,
        totalFrenziesTriggered: state.totalFrenziesTriggered,
        frenzyCooldownSecondsRemaining: state.frenzyCooldownSecondsRemaining,
        totalCrisesAnswered: state.totalCrisesAnswered,
        totalCrisesSuppressed: state.totalCrisesSuppressed,
        dryClicksCount: state.dryClicksCount,
        inkRefillCount: state.inkRefillCount,
        sovereignImmunitySlips: state.sovereignImmunitySlips,
        totalSISLifetime: state.totalSISLifetime,
        flightToCaymansCount: state.flightToCaymansCount,
        unlockedPerks: state.unlockedPerks,
        executiveDecrees: state.executiveDecrees,
        americaLLCIncorporated: state.americaLLCIncorporated,
        cronyFavor: state.cronyFavor,
        cronyFavorRemainder: state.cronyFavorRemainder,
        agencies: state.agencies,
        stocks: state.stocks,
        activeTrades: state.activeTrades,
        hasSettledYapTrade: state.hasSettledYapTrade,
        isWalkBackWindowActive: state.isWalkBackWindowActive,
        walkBackSecondsRemaining: state.walkBackSecondsRemaining,
        lastWalkBackNotice: state.lastWalkBackNotice,
        lastTargetStockSymbol: state.lastTargetStockSymbol,
        lastYapPost: state.lastYapPost,
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
        lastPrinterTimestamp: state.lastPrinterTimestamp,
        activeLeftTab: state.activeLeftTab,
        activeRightTab: state.activeRightTab,
        isMuted: state.isMuted,
        screenShakeEnabled: state.screenShakeEnabled,
        streamerMode: state.streamerMode,
        // Persist the ACTUAL last-saved timestamp (refreshed every 5s by updateLastSaved),
        // NOT Date.now(). Overwriting it here on every serialization would reset the offline
        // window to ~0 on each tick, silently disabling the Palm-a-Grifto offline protocol.
        lastSavedTimestamp: state.lastSavedTimestamp,
      }),
      version: 1,
      migrate: (persistedState, version) => {
        const state = persistedState as Partial<GameStore>;
        if (version >= 1) return state as GameStore;

        const phase = state.phase ?? 1;
        const hadMarketAccess = Boolean(
          state.hasMarketAccess || phase >= 2 || (state.treasuryCash ?? 0) >= 10000
        );
        const wasInOval = phase >= 2;
        return {
          ...state,
          activeTrades: state.activeTrades?.map((trade) => ({
            ...trade,
            isWalkBackCombo: Boolean(
              state.isWalkBackWindowActive &&
              trade.type === 'CALL' &&
              trade.symbol === state.lastTargetStockSymbol &&
              trade.openedAtTimestamp >= (state.lastYapTimestamp ?? 0)
            ),
          })),
          hasMarketAccess: hadMarketAccess,
          hasRadarAccess: Boolean(state.hasRadarAccess || hadMarketAccess),
          hasPolyGriftAccess: Boolean(state.hasPolyGriftAccess || hadMarketAccess),
          hasSettledYapTrade: Boolean(state.hasSettledYapTrade || hadMarketAccess),
          hasCronyUnlocksAccess: Boolean(state.hasCronyUnlocksAccess || wasInOval),
          hasTariffAccess: Boolean(state.hasTariffAccess || wasInOval),
          hasPrestigeAccess: Boolean(state.hasPrestigeAccess || wasInOval),
          lastWalkBackNotice: state.lastWalkBackNotice,
        } as GameStore;
      },
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.hasMarketAccess = Boolean(state.hasMarketAccess || state.phase >= 2 || state.totalClicks > 0);
        if (!state.hasMarketAccess) state.activeLeftTab = 'stocks';
        if (state.activeLeftTab === 'radar' && !state.hasRadarAccess) state.activeLeftTab = 'stocks';
        if (state.activeLeftTab === 'polygrift' && !state.hasPolyGriftAccess) state.activeLeftTab = 'stocks';
        if (state.phase < 2 || (state.activeRightTab === 'unlocks' && !state.hasCronyUnlocksAccess)) {
          state.activeRightTab = 'dump';
        }
        if (state.activeRightTab === 'tariffs' && !state.hasTariffAccess) state.activeRightTab = 'dump';
        if (state.activeRightTab === 'caymans' && !state.hasPrestigeAccess) state.activeRightTab = 'dump';
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
              state.hasMarketAccess = state.hasMarketAccess || state.treasuryCash >= 10000;
              console.log(
                `[Palm-a-Grifto Protocol] Welcome back! While golfing, collected $${cashEarned.toFixed(2)} over ${secondsCredited}s.`
              );
            }
          }

          // Extend expiration timestamp of all active trades by offlineSeconds
          if (state.activeTrades && state.activeTrades.length > 0) {
            state.activeTrades = state.activeTrades.map((trade) => ({
              ...trade,
              expiresAtTimestamp: trade.expiresAtTimestamp + offlineSeconds * 1000,
            }));
          }
        }

        // Stamp the rehydrated save so a rapid reload cannot re-credit the same offline window.
        state.lastSavedTimestamp = now;
      },
    }
  )
);

// DEV ONLY: expose the store on `window.__game` so the simulation can be driven
// from the console or automated browser tests. Tree-shaken from production builds.
if (import.meta.env.DEV) {
  (window as unknown as Record<string, unknown>).__game = useGameStore;
}
