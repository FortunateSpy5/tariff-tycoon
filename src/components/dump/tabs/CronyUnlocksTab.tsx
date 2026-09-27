/**
 * Crony Unlocks Tab: The Oligarch Tech Tree
 * Permanent upgrade store to scale manual click yield, autopen interns, and 0DTE multipliers.
 */

import React, { useState } from 'react';
import { Award, Check, Sparkles } from 'lucide-react';
import { useGameStore } from '../../../store/useGameStore';
import { INITIAL_CRONY_UPGRADES } from '../../../constants/unlocks';
import { formatCurrency } from '../../../engine/math/bigNumber';

export const CronyUnlocksTab: React.FC = () => {
  const treasuryCash = useGameStore((s) => s.treasuryCash);
  const activeUpgrades = useGameStore((s) => s.activeUpgrades);
  const hasTariffAccess = useGameStore((s) => s.hasTariffAccess);
  const buyUpgrade = useGameStore((s) => s.buyUpgrade);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleBuy = (upgradeId: string, name: string, cost: number) => {
    if (treasuryCash < cost) {
      setFeedback(`Need ${formatCurrency(cost)} to unlock ${name}!`);
      setTimeout(() => setFeedback(null), 2000);
      return;
    }

    const success = buyUpgrade(upgradeId);
    if (success) {
      setFeedback(`⚡ UNLOCKED ${name}!`);
      setTimeout(() => setFeedback(null), 2500);
    }
  };

  return (
    <div className="space-y-2 flex-1 flex flex-col justify-between select-none">
      <div>
        <div className="flex items-center justify-between text-[10px] font-mono text-stone-400 border-b border-stone-800 pb-1.5 mb-2">
          <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <Award className="w-3.5 h-3.5" />
            <span>OLIGARCH LOBBYING UPGRADES</span>
          </div>
          <span>PERMANENT MULTIPLIERS</span>
        </div>

        {!hasTariffAccess && (
          <p className="mb-2 border-l-2 border-amber-500/70 bg-amber-950/20 px-2 py-1 text-[10px] text-stone-300">
            Your first purchase gets you a seat at the tariff dials.
          </p>
        )}

        {/* Upgrades List */}
        <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-0.5">
          {INITIAL_CRONY_UPGRADES.map((upg) => {
            const isOwned = activeUpgrades.includes(upg.id);
            const canAfford = treasuryCash >= upg.cost;

            return (
              <div
                key={upg.id}
                className={`p-2 rounded-lg border transition-all ${
                  isOwned
                    ? 'bg-stone-950/40 border-stone-900 opacity-60'
                    : 'bg-stone-950 border-stone-800 hover:border-emerald-600/60'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 font-mono font-bold text-stone-200 text-xs">
                      <span>{upg.name}</span>
                      <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                    </div>
                    <p className="text-[9px] text-stone-400 font-mono mt-0.5 leading-snug">
                      {upg.description}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    {isOwned ? (
                      <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 font-mono text-[9px] font-bold flex items-center gap-1">
                        <Check className="w-2.5 h-2.5" />
                        ACQUIRED
                      </span>
                    ) : (
                      <button
                        onClick={() => handleBuy(upg.id, upg.name, upg.cost)}
                        disabled={!canAfford}
                        className={`px-2.5 py-1 rounded font-mono text-[10px] font-bold transition-all ${
                          canAfford
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-stone-950 active:scale-95 shadow cursor-pointer font-black'
                            : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                        }`}
                      >
                        {formatCurrency(upg.cost)}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {feedback && (
        <div className="p-1.5 rounded bg-stone-950 border border-emerald-500/40 text-center font-mono text-[10px] font-bold text-emerald-300 animate-pulse mt-auto">
          {feedback}
        </div>
      )}
    </div>
  );
};
