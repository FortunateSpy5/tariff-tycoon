/**
 * D.U.M.P. Agencies Tab
 * Chainsaw list of federal agencies to liquidate for sequential multi-million dollar cash injections.
 * Enforces sequential gating so higher-tier agencies unlock progressively.
 */

import React, { useState } from 'react';
import { Scissors, AlertTriangle, CheckCircle, Lock } from 'lucide-react';
import { useGameStore } from '../../../store/useGameStore';
import { formatCurrency } from '../../../engine/math/bigNumber';

export const DumpAgenciesTab: React.FC = () => {
  const agencies = useGameStore((s) => s.agencies);
  const liquidateAgency = useGameStore((s) => s.liquidateAgency);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  const handleLiquidate = (agencyId: string, name: string, yieldAmt: number) => {
    const cash = liquidateAgency(agencyId);
    if (cash > 0) {
      setAlertMsg(`🪓 SCRAPPED ${name}! Injected +${formatCurrency(yieldAmt)}!`);
      setTimeout(() => setAlertMsg(null), 2500);
    }
  };

  return (
    <div className="space-y-2 flex-1 flex flex-col justify-between select-none">
      <div>
        <div className="flex items-center justify-between text-[10px] font-mono text-stone-400 border-b border-stone-800 pb-1.5 mb-2">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold">
            <Scissors className="w-3.5 h-3.5" />
            <span>FEDERAL AGENCY GUILLOTINE</span>
          </div>
          <span>SEQUENTIAL TARGETS</span>
        </div>

        {/* Agency List */}
        <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-0.5">
          {agencies.map((agency, index) => {
            const isScrapped = agency.isLiquidated;
            const isUnlocked = index === 0 || agencies[index - 1].isLiquidated;
            const previousAgency = index > 0 ? agencies[index - 1] : null;

            return (
              <div
                key={agency.id}
                className={`p-2 rounded-lg border transition-all ${
                  isScrapped
                    ? 'bg-stone-950/40 border-stone-900 opacity-60'
                    : isUnlocked
                    ? 'bg-stone-950 border-stone-800 hover:border-amber-600/60'
                    : 'bg-stone-950/50 border-stone-900 opacity-50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-stone-200 text-xs">{agency.acronym}</span>
                      <span className="text-[10px] text-stone-400 font-mono">({agency.name})</span>
                    </div>
                    <p className="text-[9px] text-emerald-400 font-mono mt-0.5">
                      Perk: {agency.perkDescription}
                    </p>
                    <p className="text-[9px] text-amber-500/90 font-mono flex items-center gap-1 mt-0.5">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      Hazard: {agency.hazardDescription}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    {isScrapped ? (
                      <span className="px-2 py-0.5 rounded bg-stone-800 text-stone-500 font-mono text-[9px] font-bold flex items-center gap-1">
                        <CheckCircle className="w-2.5 h-2.5" />
                        SCRAPPED
                      </span>
                    ) : isUnlocked ? (
                      <button
                        onClick={() => handleLiquidate(agency.id, agency.acronym, agency.liquidationCashYield)}
                        className="px-2.5 py-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-stone-950 font-black rounded font-mono text-[10px] active:scale-95 transition-all shadow cursor-pointer"
                      >
                        🪓 +{formatCurrency(agency.liquidationCashYield)}
                      </button>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-stone-900 border border-stone-800 text-stone-500 font-mono text-[8px] font-semibold flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" />
                        Awaits {previousAgency?.acronym}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {alertMsg && (
        <div className="p-1.5 rounded bg-stone-950 border border-amber-500/40 text-center font-mono text-[10px] font-bold text-amber-300 animate-pulse mt-auto">
          {alertMsg}
        </div>
      )}
    </div>
  );
};
