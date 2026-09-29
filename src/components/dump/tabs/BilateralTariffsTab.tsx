import React from 'react';
import { Globe, MessageSquareQuote, TrendingDown } from 'lucide-react';
import { DossierHeader } from '../DossierHeader';
import { useGameStore } from '../../../store/useGameStore';
import { PARODY_NATIONS } from '../../../constants/nations';
import { formatCurrency } from '../../../engine/math/bigNumber';
import { nationDutyPerSecond, lafferRateMultiplier } from '../../../engine/systems/tariffEngine';
import { Card } from '../../ui/Card';
import { hint } from '../../ui/hint';
import type { ParodyNation } from '../../../types/nations';

/** Render a nation's linked tickers as the `$TICKER` symbols the tab already uses. */
const tickerList = (nation: ParodyNation): string => nation.linkedStocks.map((s) => `$${s}`).join(', ');

export const BilateralTariffsTab: React.FC = () => {
  const phase = useGameStore((s) => s.phase);
  const tariffRates = useGameStore((s) => s.tariffRates);
  const setTariffRate = useGameStore((s) => s.setTariffRate);
  const tariffRevenuePerSecond = useGameStore((s) => s.tariffRevenuePerSecond || 0);
  const hasPrestigeAccess = useGameStore((s) => s.hasPrestigeAccess);

  const handleAdjustTariff = (nationId: string, delta: number) => {
    // INVARIANT: [No Free Lunch At Customs] — an absent key reads as 0, never as
    // `nation.defaultTariffRate`. Falling back to the default here would silently
    // re-open the free faucet the desk slice now gates behind the unlock, and the
    // dial would read one number while the engine paid out on another.
    const current = tariffRates[nationId] ?? 0;
    const next = Math.max(0, Math.min(500, current + delta));
    // INVARIANT: a no-op must not write. `setTariffRate` opens the Caymans
    // channel whenever the stored value CHANGES, so clamping a 500% dial back
    // to 500% would unlock prestige from a click that moved nothing — and at
    // the rails a "+25%" button would silently LOWER the rate.
    if (next === current) return;
    setTariffRate(nationId, next);
  };

  const getBeggingCable = (nation: ParodyNation, rate: number) => {
    // A nation nobody has tariffed has nothing to beg about — it has not been
    // harmed yet. The mildest cable is reserved for an actual imposition.
    if (rate < 25) return 'No diplomatic correspondence on file. This nation has not yet been harmed.';
    if (rate < 100) return nation.beggingTiers.mild;
    if (rate < 300) return nation.beggingTiers.desperate;
    return nation.beggingTiers.surrender;
  };

  /** Why +25 on this nation is or is not a good idea right now. */
  const upHint = (nation: ParodyNation, rate: number, next: number) => {
    const stocks = tickerList(nation);
    const ceiling = rate >= 500;
    if (ceiling) {
      return `Already at 500%. The dial is hard-capped there, so this is a no-op. At the cap the duty multiplier has fallen to ${lafferRateMultiplier(500)} — 60% of what the 250% peak pays — and the trade-war heat has been running for a while.`;
    }
    const curve =
      next > 250
        ? `Past 250% this leaves the revenue peak: the multiplier drops from ${lafferRateMultiplier(250)} to ${lafferRateMultiplier(next)}, and every nation above 250% adds 0.08%/sec of retaliatory heat to the radar.`
        : next === 250
        ? 'This is the revenue peak. The multiplier is 2.5x base and no retaliatory heat accrues. The next click puts you on the wrong side of the curve.'
        : `Still on the straight line: ${next / 100}x base export yield, climbing to the 2.5x peak at 250%.`;
    return (
      `Push ${nation.name} to ${next}%. Duty scales with the rate, not with the harm done. ${curve} ` +
      `Depresses ${stocks} by way of ${nation.chiefExports.join(', ')} — but only above 100%; ` +
      `under 50% the same tickers get a small relief rally instead.`
    );
  };

  /** Why -25 on this nation is or is not a good idea right now. */
  const downHint = (nation: ParodyNation, rate: number, next: number) => {
    const stocks = tickerList(nation);
    if (rate === 0) {
      return `Already at zero and the dial will not go negative. A nation nobody has tariffed draws no duty, and ${stocks} currently sits in the relief branch, taking the small rally a sub-50% rate buys rather than any drag.`;
    }
    // INVARIANT: [Stated Numbers Are True] — one point of rate is worth
    // `baseExportYield / 100 × phaseWeight` per second, not `baseExportYield`.
    // The first draft of this hint said each point hands back the whole base
    // yield, which overstates the cost of easing a dial by roughly 100×.
    const perPoint = nationDutyPerSecond(nation.baseExportYield, 1, phase);
    const crossesIntoRelief = rate >= 50 && next < 50;
    return (
      `Ease ${nation.name} to ${next}%. Duty income falls with the rate — each point of relief hands back ` +
      `${formatCurrency(perPoint)}/s at this phase weight — but it also steps ${stocks} ` +
      (crossesIntoRelief
        ? 'under 50%, out of the punitive band and into the relief rally. '
        : next <= 100
        ? 'off the punitive drag, since the pressure only bites above 100%. '
        : 'down toward the 250% peak. ') +
      'The moment this crosses below 250% the retaliatory heat clock stops.'
    );
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
            const currentRate = tariffRates[nation.id] ?? 0;
            const cableText = getBeggingCable(nation, currentRate);

            // INVARIANT: [One Definition Of The Laffer Curve] — this used to
            // re-implement `tariffEngine`'s curve and phase weight inline so the
            // readout could agree with itself. That is the `phaseEngine` hazard
            // again: a tuning change would have updated the engine's payout and
            // left this number (and every hover quoting it) stale. Ask the engine.
            const nationIncome = nationDutyPerSecond(nation.baseExportYield, currentRate, phase);
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
                        aria-disabled={currentRate >= 500}
                        {...hint(
                          upHint(nation, currentRate, Math.min(500, currentRate + 25)),
                          `Raise the tariff on ${nation.name} by 25 points`
                        )}
                        className={`px-1.5 py-0.5 bg-wax-600 hover:bg-wax-500 border border-wax-700 text-newsprint-50 font-mono t-caption font-bold rounded cursor-pointer active:scale-95 ${currentRate >= 500 ? 'opacity-50 cursor-not-allowed hover:bg-wax-600' : ''}`}
                      >
                        +25%
                      </button>
                      <button
                        onClick={() => handleAdjustTariff(nation.id, -25)}
                        aria-disabled={currentRate <= 0}
                        {...hint(
                          downHint(nation, currentRate, Math.max(0, currentRate - 25)),
                          `Lower the tariff on ${nation.name} by 25 points`
                        )}
                        className={`px-1.5 py-0.5 bg-newsprint-300 hover:bg-newsprint-200 border border-newsprint-400 text-newsprint-900 font-mono t-caption font-bold rounded cursor-pointer active:scale-95 ${currentRate <= 0 ? 'opacity-50 cursor-not-allowed hover:bg-newsprint-300' : ''}`}
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
