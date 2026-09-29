/**
 * Caymans Prestige Tab
 * Tier 1 Prestige: Flight to the Caymans & Sovereign Immunity Slips (SIS).
 *
 * INVARIANT: [The Gate Counts Collateral You Never Withdrew]
 * `executeFlightToCaymans` credits `lifetimeCashEarned + Σ lockedCollateral`
 * against `PRESTIGE_CASH_DIVISOR`, so margin still sitting in open 0DTE
 * positions counts toward the threshold. The button label used to advertise a
 * flat "Lifetime" requirement and quietly omitted that, which made the gate
 * read as stricter than it is. The label now names the collateral.
 */

import React, { useState } from 'react';
import { Palmtree, ShieldCheck, RefreshCw } from 'lucide-react';
import { useGameStore } from '../../../store/useGameStore';
import { calculatePrestigeSIS } from '../../../engine/math/formulas';
import { formatCurrency } from '../../../engine/math/bigNumber';
import { PRESTIGE_CASH_DIVISOR } from '../../../constants/balance';
import { RunSummaryCard } from '../../share/RunSummaryCard';
import { captureRunSnapshot, type RunSnapshot } from '../../share/runSummary';
import { Card } from '../../ui/Card';
import { hint } from '../../ui/hint';
import { DossierHeader } from '../DossierHeader';

export const CaymansPrestigeTab: React.FC = () => {
  const activeTrades = useGameStore((s) => s.activeTrades);
  const lifetimeCashEarned = useGameStore((s) => s.lifetimeCashEarned);
  const lifetimeOptionsProfit = useGameStore((s) => s.lifetimeOptionsProfit);
  const sovereignImmunitySlips = useGameStore((s) => s.sovereignImmunitySlips);
  const executeFlightToCaymans = useGameStore((s) => s.executeFlightToCaymans);
  const [feedback, setFeedback] = useState<string | null>(null);
  // INVARIANT: captured BEFORE the reset. executeFlightToCaymans zeroes every
  // field in the snapshot, so reading it afterwards would render an empty card
  // and the player would never see the record of the run they just finished.
  const [runSummary, setRunSummary] = useState<RunSnapshot | null>(null);

  const lockedCollateral = (activeTrades || []).reduce((sum, t) => sum + (t.collateralLocked || 0), 0);
  const effectiveLifetimeCash = (lifetimeCashEarned || 0) + lockedCollateral;

  // Minimum $10^10 of lifetime cash, collateral included (GDD §5)
  const canPrestige = effectiveLifetimeCash >= PRESTIGE_CASH_DIVISOR;
  const potentialSIS = calculatePrestigeSIS(effectiveLifetimeCash, lifetimeOptionsProfit || 0);

  const handlePrestige = () => {
    if (!canPrestige) {
      setFeedback(`Need at least ${formatCurrency(PRESTIGE_CASH_DIVISOR)} lifetime cash to file Chapter 11 Reorganization!`);
      setTimeout(() => setFeedback(null), 2500);
      return;
    }

    // Snapshot first, then reset.
    const snapshot = captureRunSnapshot(potentialSIS);
    const earned = executeFlightToCaymans();
    if (earned <= 0) {
      setFeedback('Filing failed. The Cayman shell was rejected by the clerk.');
      setTimeout(() => setFeedback(null), 2500);
      return;
    }
    setRunSummary(snapshot);
    setFeedback(`PRESTIGE COMPLETE! Earned +${earned} Sovereign Immunity Slips!`);
    setTimeout(() => setFeedback(null), 3000);
  };

  // INVARIANT: [Lead With The Number, Then The Consequence]
  // The gated branch used to open by telling the player the "cheapest route to
  // qualifying is to size up and hold a position" — a balance designer
  // confessing an exploit, in the imperative, in the imperative voice of a
  // manual. The shortfall is the only number they came for, and it was
  // sentence four. Same facts, player-first.
  const prestigeHint = canPrestige
    ? `+${potentialSIS} Sovereign Immunity Slips, each a permanent +10% click yield. The gate is ` +
      `${formatCurrency(PRESTIGE_CASH_DIVISOR)} of lifetime earnings PLUS every dollar still locked in open ` +
      `0DTE positions. Wiped: treasury, every liquidation, every tariff dial, every upgrade, all heat, and ` +
      `every open position — closed out, not settled. Kept: your Slips, your decrees, the tutorial. You come ` +
      `back with $1M per Slip, raised to 1.2, so a fat filing compounds immediately.`
    : `${formatCurrency(Math.max(0, PRESTIGE_CASH_DIVISOR - effectiveLifetimeCash))} short. The gate is ` +
      `${formatCurrency(PRESTIGE_CASH_DIVISOR)} of lifetime earnings PLUS every dollar of collateral locked in ` +
      `open 0DTE positions — you have ${formatCurrency(effectiveLifetimeCash)} counted, and a fat position ` +
      `counts toward it. Filing wipes the treasury, every liquidation, every tariff dial, every upgrade, all heat, ` +
      `and every open position. You keep your Slips and their +10% click yield each.`;

  return (
    <div className="h-full min-h-0 flex flex-col gap-2.5 select-none">
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-2.5 pr-0.5">
        {runSummary && (
          <RunSummaryCard
            snapshot={runSummary}
            onDismiss={() => setRunSummary(null)}
            /* hint-allow: RunSummaryCard renders its own dismiss button, which
               carries its own hint. This call site only passes the callback. */
          />
        )}
        <DossierHeader
          icon={<Palmtree className="w-3.5 h-3.5 text-gold-500" />}
          title="Tier 1 Prestige: Flight to the Caymans"
          status="Permanent Sovereignty"
        />

        {/* Current Slips Meter */}
        <Card density="tight" className="flex items-center justify-between">
          <div>
            <span className="t-micro text-newsprint-800 font-mono block">Current Balance:</span>
            <span className="font-mono font-bold text-gold-700 text-sm flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" />
              {sovereignImmunitySlips || 0} Sovereign Immunity Slips (SIS)
            </span>
          </div>
          <div className="text-right">
            <span className="t-micro text-emerald-700 font-mono block">
              +{(sovereignImmunitySlips || 0) * 10}% Click Yield Multiplier
            </span>
          </div>
        </Card>

        {/* Prestige Reset Yield Card */}
        <div className="surface-sheet border border-newsprint-300 rounded-lg p-2.5 space-y-2">
          <span className="text-newsprint-900 font-medium text-xs block leading-snug">
            File Chapter 11 Nation Reorganization
          </span>
          <p className="t-micro text-newsprint-800 leading-relaxed font-sans">
            Dissolve the Republic into an offshore shell and start again. Treasury cash, every agency liquidation,
            every tariff dial, every crony upgrade and all S.L.O.P. heat return to zero, and any open 0DTE
            position is closed out rather than settled. You keep your Sovereign Immunity Slips: each is a permanent
            +10% on manual click yield and a $1,000-per-slip floor on every click, so a run can never begin soft-locked.
          </p>

          <div className="p-2 rounded bg-newsprint-200/70 border border-newsprint-300 font-mono text-xs flex justify-between items-center">
            <span className="text-newsprint-800">Yield on Flight:</span>
            <span className="text-emerald-700 font-bold">+{potentialSIS} SIS</span>
          </div>

          <div className="p-2 rounded bg-newsprint-200/70 border border-newsprint-300 font-mono t-caption flex justify-between items-center text-newsprint-800">
            <span>Counted: {formatCurrency(lifetimeCashEarned || 0)} earned</span>
            <span>+ {formatCurrency(lockedCollateral)} locked</span>
          </div>

          <button
            onClick={handlePrestige}
            // INVARIANT: [Gated Controls Use aria-Disabled, Not disabled]
            // A native `disabled` swallows pointer events and would remove the
            // hover text that explains the shortfall. `handlePrestige` guards.
            aria-disabled={!canPrestige}
            {...hint(prestigeHint, 'File Chapter 11 and flee to the Caymans')}
            className={`w-full py-2 rounded-lg font-mono t-micro font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
              canPrestige
                ? 'bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 text-newsprint-950 shadow cursor-pointer active:scale-95 font-black'
                : 'bg-newsprint-300 text-newsprint-800 cursor-not-allowed'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>
              {canPrestige
                ? 'Flee to the Caymans'
                : `Flee to the Caymans (Need ${formatCurrency(PRESTIGE_CASH_DIVISOR)} Lifetime + Collateral)`}
            </span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="shrink-0 p-1.5 rounded bg-gold-500/20 border border-gold-600/50 text-center font-mono t-micro font-bold text-gold-900 animate-pulse">
          {feedback}
        </div>
      )}
    </div>
  );
};
