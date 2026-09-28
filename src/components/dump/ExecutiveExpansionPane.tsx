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
import { PaneShell, TabStrip, StatusStrip } from '../ui';
import { DumpAgenciesTab } from './tabs/DumpAgenciesTab';
import { CronyUnlocksTab } from './tabs/CronyUnlocksTab';
import { BilateralTariffsTab } from './tabs/BilateralTariffsTab';
import { CaymansPrestigeTab } from './tabs/CaymansPrestigeTab';
import { SituationRoom } from './SituationRoom';

export const ExecutiveExpansionPane: React.FC = () => {
  const phase = useGameStore((s) => s.phase);
  const hasMarketAccess = useGameStore((s) => s.hasMarketAccess);
  const hasCronyUnlocksAccess = useGameStore((s) => s.hasCronyUnlocksAccess);
  const hasTariffAccess = useGameStore((s) => s.hasTariffAccess);
  const hasPrestigeAccess = useGameStore((s) => s.hasPrestigeAccess);
  const treasuryCash = useGameStore((s) => s.treasuryCash);
  const totalClicks = useGameStore((s) => s.totalClicks);
  const activeRightTab = useGameStore((s) => s.activeRightTab);
  const setActiveRightTab = useGameStore((s) => s.setActiveRightTab);

  const isLocked = phase < 2;

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
    <PaneShell
      header={
        availableTabs.length > 0 ? (
          <TabStrip
            tabs={availableTabs}
            activeId={activeRightTab}
            onSelect={(id) => setActiveRightTab(id as RightChannelTab)}
            accent="gold"
          />
        ) : undefined
      }
      footer={
        <StatusStrip
          icon={<Briefcase className="w-3 h-3 text-gold-400" />}
          label="CABINET GOVERNANCE"
          right={
            <>
              <Zap className="w-3 h-3 text-phosphor-400" />
              <span className="text-gold-400 font-bold">READY</span>
            </>
          }
        />
      }
    >
      {/* REDESIGN: [The Empty Cabinet Problem]
          The right wing used to render a suitcase icon and a lock message for
          a new player's entire first session — roughly a third of the cockpit,
          dead. It now shows the Situation Room: the tutorial directive, live
          career objectives, and the shareable certificate button. The heavy
          sealed-cabinet treatment is retained only for the gap between having
          market access and reaching Phase 2, where it now frames real content
          instead of replacing it. */}
      {isLocked ? (
        hasMarketAccess ? (
          <SituationRoom />
        ) : (
          <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-5 text-center">
            <Briefcase className="w-7 h-7 text-gold-500 mb-3" />
            <span className="t-micro font-bold tracking-widest text-stone-500 uppercase">
              Phase 1 // Customs Authorization
            </span>
            <h4 className="mt-2 font-black text-gold-300 tracking-wider t-read font-mono">
              BAGHOLDER PRO // FIRST SLAM
            </h4>
            <p className="t-body text-stone-400 mt-2 max-w-[250px] leading-relaxed">
              Slam the customs stamp once and the market terminal unseals. The
              causal shorting loop is playable from your very first tap.
            </p>
            <div
              className="w-full max-w-[280px] mt-5"
              role="progressbar"
              aria-label="Progress to your first stamp slam"
              aria-valuemin={0}
              aria-valuemax={1}
              aria-valuenow={totalClicks > 0 ? 1 : 0}
            >
              <div className="h-2.5 overflow-hidden rounded-full border border-stone-700 bg-stone-900">
                <div
                  className="h-full bg-gradient-to-r from-gold-600 to-phosphor-400 transition-[width] duration-300"
                  style={{ width: totalClicks > 0 ? '100%' : '0%' }}
                />
              </div>
              <div className="mt-1.5 flex justify-between t-micro font-mono text-stone-300">
                <span>{totalClicks > 0 ? 'TERMINAL UNSEALED' : 'AWAITING FIRST SLAM'}</span>
                <span>{formatCurrency(treasuryCash)}</span>
              </div>
            </div>
          </div>
        )
      ) : (
        <>
          {activeRightTab === 'dump' && <DumpAgenciesTab />}
          {activeRightTab === 'unlocks' && <CronyUnlocksTab />}
          {activeRightTab === 'tariffs' && <BilateralTariffsTab />}
          {activeRightTab === 'caymans' && <CaymansPrestigeTab />}
        </>
      )}
    </PaneShell>
  );
};
