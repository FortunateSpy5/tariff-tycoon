import React from 'react';
import { Globe, MessageSquareQuote, TrendingDown, DollarSign } from 'lucide-react';
import { useGameStore } from '../../../store/useGameStore';
import { PARODY_NATIONS } from '../../../constants/nations';
import { formatCurrency } from '../../../engine/math/bigNumber';

export const BilateralTariffsTab: React.FC = () => {
  const phase = useGameStore((s) => s.phase);
  const tariffRates = useGameStore((s) => s.tariffRates);
  const setTariffRate = useGameStore((s) => s.setTariffRate);
  const tariffRevenuePerSecond = useGameStore((s) => s.tariffRevenuePerSecond || 0);
  const hasPrestigeAccess = useGameStore((s) => s.hasPrestigeAccess);

  const handleAdjustTariff = (nationId: string, delta: number) => {
    const current = tariffRates[nationId] ?? 100;
    setTariffRate(nationId, Math.max(0, Math.min(500, current + delta)));
  };

  const getBeggingCable = (nation: typeof PARODY_NATIONS[number], rate: number) => {
    if (rate < 100) return nation.beggingTiers.mild;
    if (rate < 300) return nation.beggingTiers.desperate;
    return nation.beggingTiers.surrender;
  };

  return (
    <div className="space-y-2 flex-1 flex flex-col justify-between select-none">
      <div>
        <div className="flex items-center justify-between text-[10px] font-mono text-stone-400 border-b border-stone-800 pb-1.5 mb-2">
          <div className="flex items-center gap-1.5 text-red-400 font-bold">
            <Globe className="w-3.5 h-3.5" />
            <span>BILATERAL TARIFF DIALS</span>
          </div>
          <div className="flex items-center gap-1 text-emerald-400 font-bold">
            <DollarSign className="w-3 h-3" />
            <span>Total Duties: +{formatCurrency(tariffRevenuePerSecond)}/s</span>
          </div>
        </div>

        {!hasPrestigeAccess && (
          <p className="mb-2 border-l-2 border-amber-500/70 bg-amber-950/20 px-2 py-1 text-[10px] text-stone-300">
            Change a dial to qualify for the Cayman reorganization.
          </p>
        )}

        {/* Nations List */}
        <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-0.5">
          {PARODY_NATIONS.map((nation) => {
            const currentRate = tariffRates[nation.id] ?? nation.defaultTariffRate;
            const cableText = getBeggingCable(nation, currentRate);

            // Compute local tariff revenue for display
            let rateFactor = currentRate <= 250 ? currentRate / 100 : Math.max(0.3, 2.5 - ((currentRate - 250) / 100) * 0.4);
            const nationIncome = (nation.baseExportYield || 10.0) * rateFactor * (phase === 1 ? 0.3 : phase * 0.9);
            const isPunitive = currentRate > 250;

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
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] text-emerald-400 font-mono font-semibold">
                        Duty: +${nationIncome.toFixed(1)}/s
                      </span>
                      <span className="text-[9px] text-red-400 font-mono flex items-center gap-0.5">
                        <TrendingDown className="w-2.5 h-2.5" />
                        Depresses: {nation.linkedStocks.map((s) => `$${s}`).join(', ')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <span className={`font-mono font-black text-sm block ${
                        isPunitive ? 'text-amber-400 animate-pulse' : currentRate >= 100 ? 'text-red-400' : 'text-stone-300'
                      }`}>
                        {currentRate}%
                      </span>
                      {isPunitive && (
                        <span className="text-[8px] text-amber-500 font-mono block">+Trade Heat</span>
                      )}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => handleAdjustTariff(nation.id, 25)}
                        title="Increase tariff by +25%"
                        className="px-1.5 py-0.5 bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-300 font-mono text-[9px] font-bold rounded cursor-pointer active:scale-95"
                      >
                        +25%
                      </button>
                      <button
                        onClick={() => handleAdjustTariff(nation.id, -25)}
                        title="Lower tariff by -25%"
                        className="px-1.5 py-0.5 bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 font-mono text-[9px] font-bold rounded cursor-pointer active:scale-95"
                      >
                        -25%
                      </button>
                    </div>
                  </div>
                </div>

                {/* Diplomatic Begging Cable */}
                <div className="bg-stone-900/60 rounded p-1.5 border border-stone-800/80 text-[9px] font-sans italic text-stone-400 flex items-start gap-1.5">
                  <MessageSquareQuote className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                  <span>"{cableText}"</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-2 bg-stone-950/80 border border-stone-800 rounded text-[9px] text-stone-500 italic mt-auto">
        "Tariffs produce continuous Treasury duties while depressing foreign stock valuations. Tariffs above 250% risk trade war blowback and Heat accumulation."
      </div>
    </div>
  );
};
