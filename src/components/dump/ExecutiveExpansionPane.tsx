/**
 * Right Wing: Executive Expansion Pane
 * Hosts multi-channel tabs: [D] D.U.M.P., [U] Crony Unlocks, [T] Tariffs, [C] Caymans Prestige.
 * Displays physical TSA security shutter overlay when in Phase 1 (Airport Customs).
 */

import React from 'react';
import { Briefcase, Zap } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import type { RightChannelTab } from '../../types/unlocks';
import { formatCurrency } from '../../engine/math/bigNumber';
import { DumpAgenciesTab } from './tabs/DumpAgenciesTab';
import { CronyUnlocksTab } from './tabs/CronyUnlocksTab';
import { BilateralTariffsTab } from './tabs/BilateralTariffsTab';
import { CaymansPrestigeTab } from './tabs/CaymansPrestigeTab';

export const ExecutiveExpansionPane: React.FC = () => {
  const phase = useGameStore((s) => s.phase);
  const hasMarketAccess = useGameStore((s) => s.hasMarketAccess);
  const hasCronyUnlocksAccess = useGameStore((s) => s.hasCronyUnlocksAccess);
  const hasTariffAccess = useGameStore((s) => s.hasTariffAccess);
  const hasPrestigeAccess = useGameStore((s) => s.hasPrestigeAccess);
  const treasuryCash = useGameStore((s) => s.treasuryCash);
  const activeRightTab = useGameStore((s) => s.activeRightTab);
  const setActiveRightTab = useGameStore((s) => s.setActiveRightTab);

  const isLocked = phase < 2;
  const milestoneTarget = hasMarketAccess ? 1000000 : 10000;
  const milestoneProgress = Math.min(100, (treasuryCash / milestoneTarget) * 100);

  const tabs: { id: RightChannelTab; label: string; shortcut: string }[] = [
    { id: 'dump', label: 'D.U.M.P.', shortcut: 'D' },
    { id: 'unlocks', label: 'UNLOCKS', shortcut: 'U' },
    { id: 'tariffs', label: 'TARIFFS', shortcut: 'T' },
    { id: 'caymans', label: 'CAYMANS', shortcut: 'C' },
  ];
  const availableTabs = tabs.filter((tab) =>
    (tab.id === 'dump' && phase >= 2) ||
    (tab.id === 'unlocks' && hasCronyUnlocksAccess) ||
    (tab.id === 'tariffs' && hasTariffAccess) ||
    (tab.id === 'caymans' && hasPrestigeAccess)
  );

  return (
    <div className="h-full bg-stone-900/95 border border-stone-800 rounded-xl flex flex-col justify-between shadow-2xl relative overflow-hidden select-none">
      
      {/* Channel Selector Header */}
      {availableTabs.length > 0 && (
        <div className="flex items-center bg-stone-950 border-b border-stone-800 p-1 gap-1 shrink-0">
        {availableTabs.map((tab) => {
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
      )}

      {/* Main Tab Surface */}
      <div className="flex-1 min-h-0 p-2.5 overflow-hidden flex flex-col justify-between relative">
        {activeRightTab === 'dump' && <DumpAgenciesTab />}
        {activeRightTab === 'unlocks' && <CronyUnlocksTab />}
        {activeRightTab === 'tariffs' && <BilateralTariffsTab />}
        {activeRightTab === 'caymans' && <CaymansPrestigeTab />}

        {/* Phase 1 Security Shutter Lock Overlay */}
        {isLocked && (
          <div className="absolute inset-0 bg-stone-950/85 z-20 flex flex-col items-center justify-center p-5 text-center border-2 border-dashed border-amber-900/60">
            <Briefcase className="w-7 h-7 text-amber-500 mb-3" />
            <span className="font-mono text-[10px] font-bold tracking-widest text-stone-400 uppercase">
              Phase 1 // Customs Authorization
            </span>
            <h4 className="mt-2 font-black text-amber-300 tracking-wider text-sm font-mono">
              {hasMarketAccess ? 'OVAL OFFICE // $1,000,000' : 'BAGHOLDER PRO // $10,000'}
            </h4>
            <p className="text-xs text-stone-300 mt-2 max-w-[250px] leading-relaxed">
              {hasMarketAccess
                ? 'The D.U.M.P. cabinet, executive upgrades, tariffs, and Cayman paperwork are waiting on the motorcade.'
                : 'The market terminal and its accompanying subpoenas are waiting behind the next customs seal.'}
            </p>
            <div
              className="w-full max-w-[280px] mt-5"
              role="progressbar"
              aria-label={hasMarketAccess ? 'Oval Office treasury progress' : 'BagHolder Pro treasury progress'}
              aria-valuemin={0}
              aria-valuemax={milestoneTarget}
              aria-valuenow={Math.min(treasuryCash, milestoneTarget)}
            >
              <div className="h-2.5 overflow-hidden rounded-full border border-stone-700 bg-stone-900">
                <div
                  className="h-full bg-gradient-to-r from-amber-600 to-emerald-400 transition-[width] duration-300"
                  style={{ width: `${milestoneProgress}%` }}
                />
              </div>
              <div className="mt-1.5 flex justify-between font-mono text-[10px] text-stone-300">
                <span>{formatCurrency(treasuryCash)}</span>
                <span>{formatCurrency(milestoneTarget)}</span>
              </div>
            </div>
            {hasMarketAccess && (
              <p className="mt-4 border-t border-stone-800 pt-3 text-[10px] text-stone-400">
                First liquidation: $50,000 treasury + 25 Crony Favor.
              </p>
            )}
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
