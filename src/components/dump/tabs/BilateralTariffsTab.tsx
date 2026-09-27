/**
 * Bilateral Tariffs Tab
 * Tracks foreign trade sanction dials and procedural diplomatic begging cables.
 */

import React, { useState } from 'react';
import { Globe, MessageSquareQuote } from 'lucide-react';
import { PARODY_NATIONS } from '../../../constants/nations';

export const BilateralTariffsTab: React.FC = () => {
  const [tariffRates, setTariffRates] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    PARODY_NATIONS.forEach((n) => {
      initial[n.id] = n.defaultTariffRate;
    });
    return initial;
  });

  const handleAdjustTariff = (nationId: string, delta: number) => {
    setTariffRates((prev) => ({
      ...prev,
      [nationId]: Math.max(0, Math.min(1000, (prev[nationId] || 100) + delta)),
    }));
  };

  return (
    <div className="space-y-2 flex-1 flex flex-col justify-between select-none">
      <div>
        <div className="flex items-center justify-between text-[10px] font-mono text-stone-400 border-b border-stone-800 pb-1.5 mb-2">
          <div className="flex items-center gap-1.5 text-red-400 font-bold">
            <Globe className="w-3.5 h-3.5" />
            <span>BILATERAL TARIFF DIALS</span>
          </div>
          <span>SANCTION PRESSURE</span>
        </div>

        {/* Nations List */}
        <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-0.5">
          {PARODY_NATIONS.map((nation) => {
            const currentRate = tariffRates[nation.id] || nation.defaultTariffRate;

            return (
              <div key={nation.id} className="bg-stone-950 border border-stone-800 rounded-lg p-2 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-stone-200 text-xs block">
                      {nation.name}
                    </span>
                    <span className="text-[9px] text-stone-500 font-mono block">
                      Chief Exports: {nation.chiefExports.join(', ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-red-400 text-sm">{currentRate}%</span>
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => handleAdjustTariff(nation.id, 50)}
                        title="Increase tariff by +50%"
                        className="px-1.5 py-0.5 bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-300 font-mono text-[9px] font-bold rounded cursor-pointer"
                      >
                        +50%
                      </button>
                      <button
                        onClick={() => handleAdjustTariff(nation.id, -50)}
                        title="Lower tariff by -50%"
                        className="px-1.5 py-0.5 bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 font-mono text-[9px] font-bold rounded cursor-pointer"
                      >
                        -50%
                      </button>
                    </div>
                  </div>
                </div>

                {/* Diplomatic Begging Cable */}
                <div className="bg-stone-900/60 rounded p-1.5 border border-stone-800/80 text-[9px] font-sans italic text-stone-400 flex items-start gap-1.5">
                  <MessageSquareQuote className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                  <span>"{nation.beggingTiers.mild}"</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-2 bg-stone-950/80 border border-stone-800 rounded text-[9px] text-stone-500 italic mt-auto">
        "Higher tariffs squeeze foreign revenue and accelerate market volatility on BagHolder Pro."
      </div>
    </div>
  );
};
