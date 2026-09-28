/**
 * D.U.M.P. Agencies Tab
 * Chainsaw list of federal agencies to liquidate for sequential multi-million dollar cash injections.
 * Enforces sequential gating so higher-tier agencies unlock progressively.
 */

import React, { useState } from 'react';
import { Scissors, AlertTriangle, CheckCircle, Lock, Handshake } from 'lucide-react';
import { useGameStore } from '../../../store/useGameStore';
import { formatCurrency } from '../../../engine/math/bigNumber';
import { DossierHeader } from '../DossierHeader';

export const DumpAgenciesTab: React.FC = () => {
  const agencies = useGameStore((s) => s.agencies);
  const cronyFavor = useGameStore((s) => s.cronyFavor);
  const treasuryCash = useGameStore((s) => s.treasuryCash);
  const hasCronyUnlocksAccess = useGameStore((s) => s.hasCronyUnlocksAccess);
  const hasTariffAccess = useGameStore((s) => s.hasTariffAccess);
  const hasPrestigeAccess = useGameStore((s) => s.hasPrestigeAccess);
  const liquidateAgency = useGameStore((s) => s.liquidateAgency);
  const totalCashHarvested = useGameStore((s) => s.totalCashHarvested);
  const activeHazardsCount = useGameStore((s) => s.activeHazardsCount);
  const disasterCapitalismRevenue = useGameStore((s) => s.disasterCapitalismRevenue);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  const handleLiquidate = (agencyId: string, name: string, yieldAmt: number, favorCost: number, minCash: number) => {
    if (cronyFavor < favorCost) {
      setAlertMsg(`Needs ${favorCost} Crony Favor to bribe liquidation committee!`);
      setTimeout(() => setAlertMsg(null), 2500);
      return;
    }
    if (treasuryCash < minCash) {
      setAlertMsg(`Needs ${formatCurrency(minCash)} Treasury cash to unlock!`);
      setTimeout(() => setAlertMsg(null), 2500);
      return;
    }

    const cash = liquidateAgency(agencyId);
    if (cash > 0) {
      setAlertMsg(`SCRAPPED ${name}! Injected +${formatCurrency(yieldAmt)} (+15% Heat)!`);
      setTimeout(() => setAlertMsg(null), 2500);
    }
  };

  return (
    <div className="h-full min-h-0 flex flex-col gap-2 select-none">
      <div className="shrink-0">
        <DossierHeader
          icon={<Scissors className="w-3.5 h-3.5 text-gold-500" />}
          title="Federal Agency Guillotine"
          status="Hatchet Orders"
        />

        {(totalCashHarvested > 0 || activeHazardsCount > 0) && (
          <div className="mt-2 grid grid-cols-3 gap-1 t-micro font-mono text-center">
            <div className="surface-sheet border border-newsprint-300 rounded px-1 py-0.5">
              <span className="block text-newsprint-800 uppercase">Harvested</span>
              <span className="text-emerald-700 font-bold">{formatCurrency(totalCashHarvested)}</span>
            </div>
            <div className="surface-sheet border border-newsprint-300 rounded px-1 py-0.5">
              <span className="block text-newsprint-800 uppercase">Hazards</span>
              <span className="text-gold-700 font-bold">{activeHazardsCount}</span>
            </div>
            <div className="surface-sheet border border-newsprint-300 rounded px-1 py-0.5">
              <span className="block text-newsprint-800 uppercase">Disaster Rev</span>
              <span className="text-emerald-700 font-bold">{formatCurrency(disasterCapitalismRevenue)}</span>
            </div>
          </div>
        )}

        {!hasCronyUnlocksAccess && (
          <p className="mt-2 border-l-2 border-gold-600/70 bg-gold-500/15 px-2 py-1 t-micro text-newsprint-200">
            First liquidation opens the Crony lobbying shop.
          </p>
        )}
        {hasCronyUnlocksAccess && !hasTariffAccess && (
          <p className="mt-2 border-l-2 border-emerald-500/70 bg-emerald-500/15 px-2 py-1 t-micro text-newsprint-200">
            Buy your first upgrade to gain authority over bilateral tariffs.
          </p>
        )}
        {hasTariffAccess && !hasPrestigeAccess && (
          <p className="mt-2 border-l-2 border-gold-600/70 bg-gold-500/15 px-2 py-1 t-micro text-newsprint-200">
            Adjust a tariff dial to unlock the Cayman reorganization.
          </p>
        )}
      </div>

      {/* Agency List — flexes to fill remaining vertical space */}
      <div className="flex-1 min-h-0 space-y-2 overflow-y-auto custom-scrollbar pr-0.5">
        {agencies.map((agency, index) => {
            const isScrapped = agency.isLiquidated;
            const isUnlocked = index === 0 || agencies[index - 1].isLiquidated;
            const previousAgency = index > 0 ? agencies[index - 1] : null;
            const hasFavor = cronyFavor >= agency.cronyFavorCost;
            const hasCash = treasuryCash >= agency.minNetWorthRequired;
            const canAfford = hasFavor && hasCash;

            return (
              <div
                key={agency.id}
                className={`p-2 rounded-lg border transition-all ${
                  isScrapped
                    ? 'bg-newsprint-200 border-newsprint-300 opacity-60'
                    : isUnlocked
                    ? 'surface-sheet border-newsprint-300 hover:border-gold-600/60'
                    : 'bg-newsprint-200 border-newsprint-400 opacity-70'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-newsprint-900 text-xs">{agency.acronym}</span>
                      <span className="t-micro text-newsprint-800 font-mono">({agency.name})</span>
                    </div>
                    <p className="t-caption text-emerald-700 font-mono mt-0.5">
                      Perk: {agency.perkDescription}
                    </p>
                    <p className="t-caption text-gold-700 font-mono flex items-center gap-1 mt-0.5">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      <Handshake className="w-2.5 h-2.5" aria-hidden />
                      Cost: {agency.cronyFavorCost} Favor // Req: {formatCurrency(agency.minNetWorthRequired)}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    {isScrapped ? (
                      <span className="px-2 py-0.5 rounded bg-newsprint-300 text-newsprint-800 font-mono t-caption font-bold flex items-center gap-1">
                        <CheckCircle className="w-2.5 h-2.5" />
                        SCRAPPED
                      </span>
                    ) : isUnlocked ? (
                      <button
                        onClick={() => handleLiquidate(agency.id, agency.acronym, agency.liquidationCashYield, agency.cronyFavorCost, agency.minNetWorthRequired)}
                        className={`px-2.5 py-1 rounded font-mono t-micro font-bold transition-all shadow ${
                          canAfford
                            ? 'bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 text-newsprint-950 font-black active:scale-95 cursor-pointer'
                            : 'bg-newsprint-300 text-newsprint-800 cursor-not-allowed'
                        }`}
                      >
                        <Scissors className="w-3 h-3" aria-hidden />
                        +{formatCurrency(agency.liquidationCashYield)}
                      </button>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-redaction-500 border border-redaction-700 text-newsprint-400 font-mono t-caption font-semibold flex items-center gap-1">
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

      {alertMsg && (
        <div className="shrink-0 p-1.5 rounded bg-gold-500/20 border border-gold-600/50 text-center font-mono t-micro font-bold text-gold-400 animate-pulse">
          {alertMsg}
        </div>
      )}
    </div>
  );
};
