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
import { createDeskEconomySlice, type DeskEconomySlice } from './slices/deskEconomySlice';
import { createChannelSlice, type ChannelSlice } from './slices/channelSlice';
import { createDeskPropsSlice, type DeskPropsSlice } from './slices/deskPropsSlice';
import { createCrisisSlice, type CrisisSlice } from './slices/crisisSlice';
import { createTradingSlice, type TradingSlice } from './slices/tradingSlice';
import { createPredictionSlice, type PredictionSlice } from './slices/predictionSlice';
import { createSettlementSlice, type SettlementSlice } from './slices/settlementSlice';
import { createDumpSlice, type DumpSlice } from './slices/dumpSlice';
import { createPrestigeSlice, type PrestigeSlice } from './slices/prestigeSlice';
import { createPerkSlice, type PerkSlice } from './slices/perkSlice';
import { createSettingsSlice, type SettingsSlice } from './slices/settingsSlice';
import { calculateOfflineEarnings } from '../engine/math/formulas';
import type { LeftChannelTab, RightChannelTab } from '../types/unlocks';

export type GameStore = DeskSlice &
  DeskEconomySlice &
  ChannelSlice &
  DeskPropsSlice &
  CrisisSlice &
  TradingSlice &
  PredictionSlice &
  SettlementSlice &
  DumpSlice &
  PrestigeSlice &
  PerkSlice &
  SettingsSlice;

export const useGameStore = create<GameStore>()(
  persist(
    (...a) => ({
      ...createDeskSlice(...a),
      ...createDeskEconomySlice(...a),
      ...createChannelSlice(...a),
      ...createDeskPropsSlice(...a),
      ...createCrisisSlice(...a),
      ...createTradingSlice(...a),
      ...createPredictionSlice(...a),
      ...createSettlementSlice(...a),
      ...createDumpSlice(...a),
      ...createPrestigeSlice(...a),
      ...createPerkSlice(...a),
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
        // INVARIANT: [Perks Are Permanent, Timers Are Not]
        // `unlockedPerks` and the two lifetime counters persist; the Flash Dip
        // timer, the 401(k) peak and its clock are run state and are rebuilt
        // from zero on a reload. Persisting a countdown would hand a returning
        // player free options valuation, and persisting the peak would let a
        // match be claimed against positions that no longer exist.
        unlockedPerks: state.unlockedPerks,
        totalFlashDipsTriggered: state.totalFlashDipsTriggered,
        totalAutoMatchPaid: state.totalAutoMatchPaid,
        executiveDecrees: state.executiveDecrees,
        americaLLCIncorporated: state.americaLLCIncorporated,
        cronyFavor: state.cronyFavor,
        cronyFavorRemainder: state.cronyFavorRemainder,
        agencies: state.agencies,
        // `candles` rides inside each `StockDefinition`, so persisting `stocks`
        // already persists the chart — no separate persist key exists or is
        // needed. INVARIANT: [A Legacy Save Degrades To An Empty Series]
        // A save written before `candles` existed rehydrates with the field
        // absent, so every read path here treats it as optional and the pure
        // engine seeds the first bucket from the live price on the next tick
        // (see `accumulateCandle`). Bumping `version` and writing a migration
        // would be the wrong fix: it would stamp synthetic history onto every
        // returning player's chart, and the chart's whole claim is that every
        // wick is a price the simulation actually printed.
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
        // INVARIANT: [A Comfort Setting Is Not An Economy Setting, But It Is
        // Still A Setting] — persisted with the rest of the cockpit's
        // preferences so a reload cannot re-arm a layer the player deliberately
        // switched off. A save written before this key existed restores
        // `undefined`, and zustand's `merge` keeps the slice default (`true`)
        // rather than inventing a falsy value, so an old save upgrades to hints
        // ON — see `hintsEnabled` in `settingsSlice.ts`.
        hintsEnabled: state.hintsEnabled,
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
        // REDESIGN: the $10,000 cash gate is gone (the market now unlocks on the
        // first stamp slam). Retained for OLD saves only: a pre-redesign player
        // who had earned past $10k should not lose terminal access on upgrade.
        const hadMarketAccess = Boolean(
          state.hasMarketAccess || phase >= 2 || (state.treasuryCash ?? 0) >= 10000 || (state.totalClicks ?? 0) > 0
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
        /* CHANNEL SELECTION IS NOT GATED ON REHYDRATION.
           These resets used to force a locked channel back to its default, on the
           theory that a tab you cannot use should not be selectable. Under [The
           Seal Is a Promise, Not a Wall] a sealed channel is a legitimate, safe
           place to land: it renders a SealedDossier and exposes no actions. The
           only thing still corrected here is a tab id outside its union (a
           corrupted or older save), which must not leave the pane rendering
           nothing. */
        const LEFT_TABS: LeftChannelTab[] = ['stocks', 'radar', 'polygrift'];
        const RIGHT_TABS: RightChannelTab[] = ['brief', 'dump', 'unlocks', 'tariffs', 'caymans'];
        if (!LEFT_TABS.includes(state.activeLeftTab)) state.activeLeftTab = 'stocks';
        if (!RIGHT_TABS.includes(state.activeRightTab)) state.activeRightTab = 'brief';
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
              // NOTE: deliberately does NOT touch hasMarketAccess. Passive income
              // must never be what opens the terminal — see [The Ten-Minute Wall].
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
