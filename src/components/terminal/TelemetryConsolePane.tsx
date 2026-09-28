/**
 * Left Wing: Telemetry Console Pane
 * Hosts multi-channel tabs: [1] Stocks & 0DTE Options, [2] PolyGrift Bets, [3] S.L.O.P. Radar.
 * Displays physical TSA security shutter overlay when in Phase 1 (Airport Customs).
 */

import React from 'react';
import { Lock, Radio, Activity } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import type { LeftChannelTab } from '../../types/unlocks';
import { StocksOptionsTab } from './tabs/StocksOptionsTab';
import { PolyGriftTab } from './tabs/PolyGriftTab';
import { SlopRadarTab } from './tabs/SlopRadarTab';

export const TelemetryConsolePane: React.FC = () => {
  const hasMarketAccess = useGameStore((s) => s.hasMarketAccess);
  const hasRadarAccess = useGameStore((s) => s.hasRadarAccess);
  const hasPolyGriftAccess = useGameStore((s) => s.hasPolyGriftAccess);
  const activeLeftTab = useGameStore((s) => s.activeLeftTab);
  const setActiveLeftTab = useGameStore((s) => s.setActiveLeftTab);

  const isLocked = !hasMarketAccess;

  const tabs: { id: LeftChannelTab; label: string; shortcut: string }[] = [
    { id: 'stocks', label: 'STOCKS', shortcut: '1' },
    { id: 'radar', label: 'S.L.O.P.', shortcut: '2' },
    { id: 'polygrift', label: 'POLY-GRIFT', shortcut: '3' },
  ];
  const availableTabs = tabs.filter((tab) =>
    (tab.id === 'stocks' && hasMarketAccess) ||
    (tab.id === 'polygrift' && hasPolyGriftAccess) ||
    (tab.id === 'radar' && hasRadarAccess)
  );

  return (
    <div className="h-full min-h-0 bg-stone-900/95 border border-stone-800 rounded-xl flex flex-col shadow-2xl relative overflow-hidden select-none">
      
      {/* Channel Selector Header */}
      {availableTabs.length > 0 && (
        <div className="flex items-center bg-stone-950 border-b border-stone-800 p-1 gap-1 shrink-0">
        {availableTabs.map((tab) => {
          const isActive = activeLeftTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveLeftTab(tab.id)}
              disabled={isLocked}
              className={`flex-1 py-1 px-1.5 text-center rounded font-mono font-bold t-micro transition-all cursor-pointer flex items-center justify-center gap-1 ${
                isActive
                  ? 'bg-emerald-500 text-stone-950 shadow-md font-black'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
              }`}
            >
              <span>[{tab.shortcut}]</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
        </div>
      )}

      {/* Main Tab Surface */}
      <div className="flex-1 min-h-0 p-2.5 overflow-hidden flex flex-col relative">
        {activeLeftTab === 'stocks' && <StocksOptionsTab />}
        {activeLeftTab === 'polygrift' && <PolyGriftTab />}
        {activeLeftTab === 'radar' && <SlopRadarTab />}

        {/* Phase 1 Security Shutter Lock Overlay
            INVARIANT: fully opaque, and only rendered when there is no tab content behind it,
            so the underlying terminal is never ghosted through the shutter. */}
        {isLocked && (
          <div className="absolute inset-0 bg-stone-950 z-20 flex flex-col items-center justify-center p-4 text-center">
            <div className="p-3 bg-amber-950/40 rounded-full border border-amber-600/40 text-amber-500 mb-2">
              <Lock className="w-6 h-6 animate-pulse" />
            </div>
            <h4 className="font-black text-amber-400 tracking-wider t-micro font-mono">
              RESTRICTED SECURITY ZONE
            </h4>
            <p className="t-micro text-stone-400 mt-1 max-w-[200px] leading-relaxed">
              {/* REDESIGN: this used to say "$10,000 seed cash". The market now
                  unlocks on the player's first stamp slam, so the copy was lying
                  about a threshold that no longer exists. */}
              Slam the customs stamp once to unseal BagHolder Pro. The Oval Office
              opens at $1,000,000.
            </p>
          </div>
        )}
      </div>

      {/* Bottom Telemetry Status Indicator */}
      <div className="bg-stone-950 border-t border-stone-800 px-3 py-1.5 flex justify-between items-center t-micro font-mono text-stone-500 shrink-0">
        <div className="flex items-center gap-1.5">
          <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
          <span>CITADULL HFT FEED</span>
        </div>
        <div className="flex items-center gap-1">
          <Activity className="w-3 h-3 text-amber-400" />
          <span className="text-emerald-400 font-bold">0ms LATENCY</span>
        </div>
      </div>
    </div>
  );
};
