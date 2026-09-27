/**
 * Right Wing: Executive Expansion Pane
 * Hosts multi-channel tabs: [D] D.U.M.P., [U] Crony Unlocks, [T] Tariffs, [C] Caymans Prestige.
 * Displays physical TSA security shutter overlay when in Phase 1 (Airport Customs).
 */

import React from 'react';
import { Lock, Briefcase, Zap } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import type { RightChannelTab } from '../../types/unlocks';
import { DumpAgenciesTab } from './tabs/DumpAgenciesTab';
import { CronyUnlocksTab } from './tabs/CronyUnlocksTab';
import { BilateralTariffsTab } from './tabs/BilateralTariffsTab';
import { CaymansPrestigeTab } from './tabs/CaymansPrestigeTab';

export const ExecutiveExpansionPane: React.FC = () => {
  const phase = useGameStore((s) => s.phase);
  const activeRightTab = useGameStore((s) => s.activeRightTab);
  const setActiveRightTab = useGameStore((s) => s.setActiveRightTab);

  const isLocked = phase < 2;

  const tabs: { id: RightChannelTab; label: string; shortcut: string }[] = [
    { id: 'dump', label: 'D.U.M.P.', shortcut: 'D' },
    { id: 'unlocks', label: 'UNLOCKS', shortcut: 'U' },
    { id: 'tariffs', label: 'TARIFFS', shortcut: 'T' },
    { id: 'caymans', label: 'CAYMANS', shortcut: 'C' },
  ];

  return (
    <div className="h-full bg-stone-900/95 border border-stone-800 rounded-xl flex flex-col justify-between shadow-2xl relative overflow-hidden select-none">
      
      {/* Channel Selector Header */}
      <div className="flex items-center bg-stone-950 border-b border-stone-800 p-1 gap-1 shrink-0">
        {tabs.map((tab) => {
          const isActive = activeRightTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveRightTab(tab.id)}
              disabled={isLocked}
              className={`flex-1 py-1 px-1 text-center rounded font-mono font-bold text-[10px] transition-all cursor-pointer flex items-center justify-center gap-1 ${
                isActive
                  ? 'bg-amber-500 text-stone-950 shadow-md font-black'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
              }`}
            >
              <span>[{tab.shortcut}]</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Tab Surface */}
      <div className="flex-1 min-h-0 p-2.5 overflow-hidden flex flex-col justify-between relative">
        {activeRightTab === 'dump' && <DumpAgenciesTab />}
        {activeRightTab === 'unlocks' && <CronyUnlocksTab />}
        {activeRightTab === 'tariffs' && <BilateralTariffsTab />}
        {activeRightTab === 'caymans' && <CaymansPrestigeTab />}

        {/* Phase 1 Security Shutter Lock Overlay */}
        {isLocked && (
          <div className="absolute inset-0 bg-stone-950/95 z-20 flex flex-col items-center justify-center p-4 text-center border-2 border-dashed border-amber-900/60">
            <div className="p-3 bg-amber-950/40 rounded-full border border-amber-600/40 text-amber-500 mb-2">
              <Lock className="w-6 h-6 animate-pulse" />
            </div>
            <h4 className="font-black text-amber-400 tracking-wider text-xs font-mono">
              RESTRICTED SECURITY ZONE
            </h4>
            <p className="text-[10px] text-stone-400 mt-1 max-w-[200px] leading-relaxed">
              D.U.M.P. & Executive Expansion unlock at Phase 2 ($10,000 seed cash).
            </p>
          </div>
        )}
      </div>

      {/* Bottom Panel Status Indicator */}
      <div className="bg-stone-950 border-t border-stone-800 px-3 py-1.5 flex justify-between items-center text-[10px] font-mono text-stone-500 shrink-0">
        <div className="flex items-center gap-1.5">
          <Briefcase className="w-3 h-3 text-amber-400" />
          <span>CABINET GOVERNANCE</span>
        </div>
        <div className="flex items-center gap-1">
          <Zap className="w-3 h-3 text-emerald-400" />
          <span className="text-amber-400 font-bold">READY</span>
        </div>
      </div>
    </div>
  );
};
