/**
 * Debug Panel (DEV ONLY)
 * Toggled with the `~` / Backquote key. Never mounted in production builds
 * (guarded by import.meta.env.DEV in App.tsx) so it cannot ship to players.
 *
 * PURPOSE: Every stateful component in the cockpit (raid banner, walk-back window,
 * frenzy ring, active 0DTE positions, lock overlays, prestige panel) is normally
 * reachable only after minutes of real play. This panel lets us jump directly to
 * any of those states and drive the simulation, which is required to iterate on
 * mechanics without replaying the opening hour every time.
 */

import React, { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { formatCurrency } from '../../engine/math/bigNumber';
import { INITIAL_STOCKS } from '../../constants/stocks';
import type { StockSymbol } from '../../types/market';

/** One-click scenario presets covering every distinct UI state worth inspecting. */
const SCENARIOS: { id: string; label: string; hint: string; apply: () => Partial<ReturnType<typeof useGameStore.getState>> }[] = [
  {
    id: 'phase1-fresh',
    label: 'Phase 1 // Fresh start',
    hint: 'What a brand new player sees on first load.',
    apply: () => ({
      phase: 1, treasuryCash: 100, lifetimeCashEarned: 100,
      hasMarketAccess: false, hasRadarAccess: false, hasPolyGriftAccess: false,
      hasCronyUnlocksAccess: false, hasTariffAccess: false, hasPrestigeAccess: false,
      inkLevel: 100, tantrumMeter: 0, isCapsFrenzy: false, capsFrenzySecondsRemaining: 0,
      frenzyCooldownSecondsRemaining: 0, activeUpgrades: [], cronyFavor: 0, slopSuspicion: 0,
      activeTrades: [], activeLeftTab: 'stocks', activeRightTab: 'dump',
    }),
  },
  {
    id: 'phase1-market',
    label: 'Phase 1 // Market open',
    hint: 'BagHolder Pro unlocked, YAP and S.L.O.P. available.',
    apply: () => ({
      phase: 1, treasuryCash: 25000, lifetimeCashEarned: 25000,
      hasMarketAccess: true, hasRadarAccess: true, hasPolyGriftAccess: false,
      hasCronyUnlocksAccess: false, hasTariffAccess: false, hasPrestigeAccess: false,
      inkLevel: 100, tantrumMeter: 20, cronyFavor: 5, slopSuspicion: 8,
      activeTrades: [], activeLeftTab: 'stocks', activeRightTab: 'dump',
    }),
  },
  {
    id: 'crisis',
    label: 'Crisis Call // ringing',
    hint: 'Red phone mid-escalation with the SWEAR IN / IGNORE wager.',
    apply: () => ({
      phase: 1, treasuryCash: 40000, hasMarketAccess: true, hasRadarAccess: true,
      inkLevel: 80, tantrumMeter: 30, slopSuspicion: 10, cronyFavor: 5,
      activeCrisis: { id: 'canada_brie', elapsedSeconds: 17 },
      crisisCooldownSeconds: 45,
    }),
  },
  {
    id: 'frenzy',
    label: 'CAPS LOCK FRENZY // active',
    hint: 'Verify frenzy ring, ink freeze, and the post-frenzy cooldown.',
    apply: () => ({
      phase: 1, treasuryCash: 50000, hasMarketAccess: true, hasRadarAccess: true,
      inkLevel: 100, tantrumMeter: 0, isCapsFrenzy: true, capsFrenzySecondsRemaining: 20,
      frenzyCooldownSecondsRemaining: 0,
    }),
  },
  {
    id: 'frenzy-cooldown',
    label: 'Frenzy cooldown // locked out',
    hint: 'Verify the Cooling-Off Protocol blocks a re-trigger.',
    apply: () => ({
      phase: 1, treasuryCash: 50000, hasMarketAccess: true,
      inkLevel: 40, tantrumMeter: 85, isCapsFrenzy: false, capsFrenzySecondsRemaining: 0,
      frenzyCooldownSecondsRemaining: 30,
    }),
  },
  {
    id: 'walkback',
    label: 'Walk-back window // open',
    hint: '8-second straddle squeeze window on the desk.',
    apply: () => ({
      phase: 1, treasuryCash: 80000, hasMarketAccess: true, hasRadarAccess: true,
      lastTargetStockSymbol: 'DOOR', isWalkBackWindowActive: true, walkBackSecondsRemaining: 8,
      lastYapTimestamp: Date.now(),
    }),
  },
  {
    id: 'positions',
    label: 'Active 0DTE positions',
    hint: 'Settlement list and live P&L rows in the market terminal.',
    apply: () => ({
      phase: 1, treasuryCash: 90000, hasMarketAccess: true, hasRadarAccess: true,
      activeTrades: [
        { id: 'dbg-put-1', symbol: 'DOOR' as StockSymbol, type: 'PUT', entryPrice: 180,
          currentPrice: 0, strikePrice: 176, targetPrice: 165, leverage: 1000,
          collateralLocked: 1000, contractsCount: 1, openedAtTimestamp: Date.now() - 20000,
          expiresAtTimestamp: Date.now() + 40000, isWalkBackCombo: false },
        { id: 'dbg-call-1', symbol: 'GIGA' as StockSymbol, type: 'CALL', entryPrice: 190,
          currentPrice: 0, strikePrice: 200, targetPrice: 215, leverage: 100,
          collateralLocked: 5000, contractsCount: 1, openedAtTimestamp: Date.now() - 30000,
          expiresAtTimestamp: Date.now() + 30000, isWalkBackCombo: true },
      ] as never,
    }),
  },
  {
    id: 'raid',
    label: 'Special Counsel raid',
    hint: 'Red raid banner across the desk.',
    apply: () => ({
      phase: 2, treasuryCash: 400000, lifetimeCashEarned: 2e6, hasMarketAccess: true,
      hasRadarAccess: true, hasCronyUnlocksAccess: true, slopSuspicion: 88,
      cronyFavor: 60, lastRaidTimestamp: Date.now(), activeRightTab: 'dump',
    }),
  },
  {
    id: 'phase2',
    label: 'Phase 2 // Oval Office',
    hint: 'D.U.M.P. open, full right-wing tab set, agencies liquidable.',
    apply: () => ({
      phase: 2, treasuryCash: 5e6, lifetimeCashEarned: 5e7,
      hasMarketAccess: true, hasRadarAccess: true, hasPolyGriftAccess: true,
      hasCronyUnlocksAccess: true, hasTariffAccess: true, hasPrestigeAccess: true,
      cronyFavor: 120, slopSuspicion: 30, activeUpgrades: ['heavy_tungsten_nib'],
      sovereignImmunitySlips: 4, activeRightTab: 'dump',
    }),
  },
  {
    id: 'phase3',
    label: 'Phase 3 // Fortress America',
    hint: 'High-number formatting and prestige readiness.',
    apply: () => ({
      phase: 3, treasuryCash: 5e11, lifetimeCashEarned: 5e12,
      hasMarketAccess: true, hasRadarAccess: true, hasPolyGriftAccess: true,
      hasCronyUnlocksAccess: true, hasTariffAccess: true, hasPrestigeAccess: true,
      cronyFavor: 400, slopSuspicion: 20,
      activeUpgrades: ['heavy_tungsten_nib', 'autopen_army', 'darkpool_fiber', 'broad_daylight_printer'],
      sovereignImmunitySlips: 25, activeRightTab: 'caymans',
    }),
  },
];

/** Sliders for tuning the core loop without a rebuild. */
const NUMERIC_FIELDS: { key: string; label: string; step: number; min: number; max: number }[] = [
  { key: 'treasuryCash', label: 'Treasury', step: 1000, min: 0, max: 1e12 },
  { key: 'inkLevel', label: 'Ink', step: 5, min: 0, max: 100 },
  { key: 'tantrumMeter', label: 'Tantrum', step: 1, min: 0, max: 100 },
  { key: 'slopSuspicion', label: 'S.L.O.P. Heat', step: 1, min: 0, max: 100 },
  { key: 'vexVolatility', label: 'VEX', step: 1, min: 0, max: 80 },
  { key: 'cronyFavor', label: 'Crony Favor', step: 5, min: 0, max: 9999 },
  { key: 'sovereignImmunitySlips', label: 'SIS', step: 1, min: 0, max: 999 },
  { key: 'frenzyCooldownSecondsRemaining', label: 'Frenzy CD', step: 1, min: 0, max: 60 },
];

export const DebugPanel: React.FC = () => {
  const [tab, setTab] = useState<'scenarios' | 'values' | 'actions'>('scenarios');
  const state = useGameStore();

  const set = (patch: Record<string, unknown>) =>
    useGameStore.setState(patch as never, false);

  return (
    <div className="fixed bottom-9 right-2 z-[100] w-[340px] max-h-[82vh] flex flex-col rounded-lg border-2 border-fuchsia-500/70 bg-stone-950/97 shadow-2xl font-mono text-stone-200 select-none overflow-hidden">
      <header className="flex items-center justify-between px-2 py-1 bg-fuchsia-950/60 border-b border-fuchsia-700/50 shrink-0">
        <span className="text-[10px] font-black tracking-widest text-fuchsia-300">DEBUG // DEV ONLY</span>
        <span className="text-[10px] text-fuchsia-400/70">~ to close</span>
      </header>

      <nav className="flex gap-1 p-1 border-b border-stone-800 shrink-0">
        {(['scenarios', 'values', 'actions'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-1 rounded text-[10px] font-bold uppercase transition-colors ${
              tab === t ? 'bg-fuchsia-500 text-stone-950' : 'text-stone-400 hover:bg-stone-800'
            }`}
          >
            {t}
          </button>
        ))}
      </nav>

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-2 space-y-2">
        {tab === 'scenarios' && (
          <>
            {SCENARIOS.map((s) => (
              <button
                key={s.id}
                onClick={() => set(s.apply() as never)}
                title={s.hint}
                className="w-full text-left p-1.5 rounded border border-stone-700 bg-stone-900 hover:border-fuchsia-500/70 transition-colors"
              >
                <span className="block text-[10px] font-bold text-fuchsia-300">{s.label}</span>
                <span className="block text-[9px] text-stone-500 leading-snug">{s.hint}</span>
              </button>
            ))}
          </>
        )}

        {tab === 'values' && (
          <>
            {NUMERIC_FIELDS.map((f) => {
              const raw = (state as never as Record<string, number>)[f.key] ?? 0;
              const isMoney = f.key === 'treasuryCash';
              return (
                <label key={f.key} className="block">
                  <span className="flex justify-between text-[10px] text-stone-400">
                    <span>{f.label}</span>
                    <span className="text-amber-300 font-bold">
                      {isMoney ? formatCurrency(raw) : Math.round(raw * 10) / 10}
                    </span>
                  </span>
                  <input
                    type="range"
                    min={f.min}
                    max={f.max}
                    step={f.step}
                    value={raw}
                    onChange={(e) => set({ [f.key]: Number(e.target.value) })}
                    className="w-full accent-fuchsia-500"
                  />
                </label>
              );
            })}

            <div className="pt-1 border-t border-stone-800 space-y-1">
              <span className="block text-[10px] text-stone-500">PHASE</span>
              <div className="grid grid-cols-4 gap-1">
                {([1, 2, 3, 4] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => set({ phase: p })}
                    className={`py-1 rounded text-[10px] font-bold ${
                      state.phase === p ? 'bg-fuchsia-500 text-stone-950' : 'bg-stone-800 text-stone-400'
                    }`}
                  >
                    P{p}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-1 border-t border-stone-800 space-y-1">
              <span className="block text-[10px] text-stone-500">UNLOCK FLAGS</span>
              <div className="grid grid-cols-2 gap-1">
                {(
                  ['hasMarketAccess', 'hasRadarAccess', 'hasPolyGriftAccess',
                   'hasCronyUnlocksAccess', 'hasTariffAccess', 'hasPrestigeAccess'] as const
                ).map((flag) => (
                  <button
                    key={flag}
                    onClick={() => set({ [flag]: !(state as never as Record<string, boolean>)[flag] })}
                    className={`px-1 py-1 rounded text-[9px] font-bold truncate ${
                      (state as never as Record<string, boolean>)[flag]
                        ? 'bg-emerald-600 text-stone-950'
                        : 'bg-stone-800 text-stone-500'
                    }`}
                    title={flag}
                  >
                    {flag.replace('has', '')}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {tab === 'actions' && (
          <>
            <div className="grid grid-cols-2 gap-1">
              <button onClick={() => useGameStore.getState().clickDesk()} className="py-1.5 rounded bg-amber-600 text-stone-950 text-[10px] font-black">CLICK ×1</button>
              <button
                onClick={() => { for (let i = 0; i < 20; i++) { const t = Date.now(); if (i > 0) useGameStore.setState({ lastClickTimestamp: t - 100 }); useGameStore.getState().clickDesk(); } }}
                className="py-1.5 rounded bg-amber-700 text-stone-950 text-[10px] font-black"
              >CLICK ×20</button>
              <button onClick={() => useGameStore.getState().refillInk()} className="py-1.5 rounded bg-stone-700 text-[10px] font-bold">REFILL INK</button>
              <button onClick={() => useGameStore.getState().sellClassifiedSecrets()} className="py-1.5 rounded bg-stone-700 text-[10px] font-bold">GOLD BOX</button>
              <button onClick={() => useGameStore.getState().triggerRedPhoneBailout()} className="py-1.5 rounded bg-stone-700 text-[10px] font-bold">RED PHONE</button>
              <button onClick={() => useGameStore.getState().shredSubpoenas()} className="py-1.5 rounded bg-stone-700 text-[10px] font-bold">SHREDDER</button>
              <button onClick={() => useGameStore.getState().printEmergencyCash()} className="py-1.5 rounded bg-stone-700 text-[10px] font-bold">PRINTER</button>
              <button onClick={() => set({ inkLevel: 0 })} className="py-1.5 rounded bg-stone-700 text-[10px] font-bold">DRY THE NIB</button>
            </div>

            <div className="pt-1 border-t border-stone-800 space-y-1">
              <span className="block text-[10px] text-stone-500">YAP TARGET</span>
              <div className="grid grid-cols-3 gap-1">
                {(['DOOR', 'GIGA', 'FRUT', 'MICR', 'PAIN', 'LMBR'] as StockSymbol[]).map((sym) => (
                  <button
                    key={sym}
                    onClick={() => set({ selectedStock: sym })}
                    className={`py-1 rounded text-[10px] font-bold ${
                      state.selectedStock === sym ? 'bg-amber-500 text-stone-950' : 'bg-stone-800 text-stone-400'
                    }`}
                  >
                    ${sym}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-1 border-t border-stone-800 space-y-1">
              <span className="block text-[10px] text-stone-500">STOCK PRICES ({Object.keys(INITIAL_STOCKS).length} tickers)</span>
              <div className="grid grid-cols-3 gap-1">
                {(Object.keys(INITIAL_STOCKS) as StockSymbol[]).map((sym) => {
                  const stk = state.stocks[sym];
                  if (!stk) return null;
                  return (
                    <button
                      key={sym}
                      onClick={() => set({ stocks: { ...state.stocks, [sym]: { ...stk, currentPrice: stk.basePrice * 0.55 } } })}
                      title={`Crash $${sym} to 55% of base`}
                      className="py-1 rounded text-[10px] font-bold bg-red-900 text-red-200"
                    >
                      ▼${sym}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-1 border-t border-stone-800 space-y-1">
              <span className="block text-[10px] text-stone-500">CRISIS CALL</span>
              <div className="grid grid-cols-2 gap-1">
                <button
                  onClick={() => set({ activeCrisis: { id: 'canada_brie', elapsedSeconds: 0 } })}
                  className="py-1 rounded bg-red-800 text-red-100 text-[10px] font-bold"
                >
                  RING NOW
                </button>
                <button
                  onClick={() => set({ activeCrisis: { id: 'nearshore_chips', elapsedSeconds: 28 } })}
                  className="py-1 rounded bg-red-900 text-red-100 text-[10px] font-bold"
                >
                  MAX TIER
                </button>
                <button onClick={() => useGameStore.getState().swearInCrisis()} className="py-1 rounded bg-emerald-700 text-stone-950 text-[10px] font-bold">SWEAR IN</button>
                <button onClick={() => useGameStore.getState().suppressCrisis()} className="py-1 rounded bg-stone-700 text-[10px] font-bold">IGNORE</button>
              </div>
            </div>

            <button
              onClick={() => state.hardResetGame()}
              className="w-full py-2 rounded bg-red-700 text-stone-950 text-[10px] font-black mt-1"
            >
              HARD RESET GAME
            </button>
          </>
        )}
      </div>

      <footer className="px-2 py-1 border-t border-stone-800 text-[9px] text-stone-600 shrink-0">
        clicks: {state.totalClicks} · frenzies: {state.totalFrenziesTriggered} · refills: {state.inkRefillCount}
      </footer>
    </div>
  );
};
