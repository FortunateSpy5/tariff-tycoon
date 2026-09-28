import React from 'react';
import { Globe, MessageSquareQuote, TrendingDown } from 'lucide-react';
import { DossierHeader } from '../DossierHeader';
import { useGameStore } from '../../../store/useGameStore';
import { PARODY_NATIONS } from '../../../constants/nations';
import { formatCurrency } from '../../../engine/math/bigNumber';
import { Card } from '../../ui';

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
    <div className="h-full min-h-0 flex flex-col gap-2 select-none">
      <div className="shrink-0">
        <DossierHeader
          icon={<Globe className="w-3.5 h-3.5 text-gold-500" />}
          title="Bilateral Tariff Dials"
          status={`Total Duties: +${formatCurrency(tariffRevenuePerSecond)}/s`}
        />

        {!hasPrestigeAccess && (
          <p className="mt-2 border-l-2 border-amber-500/70 bg-amber-950/20 px-2 py-1 t-micro text-stone-400">
            Change a dial to qualify for the Cayman reorganization.
          </p>
        )}
      </div>

      {/* Nations List — flexes to fill remaining vertical space */}
      <div className="flex-1 min-h-0 space-y-2 overflow-y-auto custom-scrollbar pr-0.5">
        {PARODY_NATIONS.map((nation) => {
            const currentRate = tariffRates[nation.id] ?? nation.defaultTariffRate;
            const cableText = getBeggingCable(nation, currentRate);

            // Compute local tariff revenue for display
            let rateFactor = currentRate <= 250 ? currentRate / 100 : Math.max(0.3, 2.5 - ((currentRate - 250) / 100) * 0.4);
            const nationIncome = (nation.baseExportYield || 10.0) * rateFactor * (phase === 1 ? 0.3 : phase * 0.9);
            const isPunitive = currentRate > 250;

            return (
              <Card key={nation.id} density="tight" className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-newsprint-900 text-xs block">
                      {nation.name}
                    </span>
                    <span className="t-caption text-newsprint-800 font-mono block">
                      Chief Exports: {nation.chiefExports.join(', ')}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="t-caption text-emerald-700 font-mono font-semibold">
                        Duty: +${nationIncome.toFixed(1)}/s
                      </span>
                      <span className="t-caption text-wax-600 font-mono flex items-center gap-0.5">
                        <TrendingDown className="w-2.5 h-2.5" />
                        Depresses: {nation.linkedStocks.map((s) => `$${s}`).join(', ')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <span className={`font-mono font-black text-sm block ${
                        isPunitive ? 'text-wax-600 animate-pulse' : currentRate >= 100 ? 'text-wax-500' : 'text-newsprint-900'
                      }`}>
                        {currentRate}%
                      </span>
                      {isPunitive && (
                        <span className="t-caption text-gold-700 font-mono block">+Trade Heat</span>
                      )}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => handleAdjustTariff(nation.id, 25)}
                        title="Increase tariff by +25%"
                        className="px-1.5 py-0.5 bg-wax-600 hover:bg-wax-500 border border-wax-700 text-newsprint-50 font-mono t-caption font-bold rounded cursor-pointer active:scale-95"
                      >
                        +25%
                      </button>
                      <button
                        onClick={() => handleAdjustTariff(nation.id, -25)}
                        title="Lower tariff by -25%"
                        className="px-1.5 py-0.5 bg-newsprint-300 hover:bg-newsprint-200 border border-newsprint-400 text-newsprint-900 font-mono t-caption font-bold rounded cursor-pointer active:scale-95"
                      >
                        -25%
                      </button>
                    </div>
                  </div>
                </div>

                {/* Diplomatic Begging Cable */}
                <div className="bg-newsprint-200/70 rounded p-1.5 border border-newsprint-300 t-caption font-sans italic text-newsprint-800 flex items-start gap-1.5">
                  <MessageSquareQuote className="w-3 h-3 text-gold-600 shrink-0 mt-0.5" />
                  <span>"{cableText}"</span>
                </div>
              </Card>
            );
          })}
      </div>

      <div className="shrink-0 p-2 bg-newsprint-200/60 border border-newsprint-400 rounded t-micro text-newsprint-800 italic">
        "Tariffs produce continuous Treasury duties while depressing foreign stock valuations. Tariffs above 250% risk trade war blowback and Heat accumulation."
      </div>
    </div>
  );
};
