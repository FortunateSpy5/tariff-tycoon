/**
 * S.L.O.P. Radar Tab
 * Tracks regulatory heat, grand jury countdowns, and crony auditor bribes.
 */

import React from 'react';
import { ShieldAlert, Award, FileX2 } from 'lucide-react';
import { useGameStore } from '../../../store/useGameStore';
import { Card } from '../../ui';

export const SlopRadarTab: React.FC = () => {
  const slopSuspicion = useGameStore((s) => s.slopSuspicion);
  const vexVolatility = useGameStore((s) => s.vexVolatility);
  const cronyFavor = useGameStore((s) => s.cronyFavor);
  const bribeSlopAuditors = useGameStore((s) => s.bribeSlopAuditors);
  const shredSubpoenas = useGameStore((s) => s.shredSubpoenas);

  const isCritical = slopSuspicion >= 75;
  const isDangerous = slopSuspicion >= 50;

  return (
    <div className="h-full min-h-0 flex flex-col gap-2.5 select-none">
      <div className="shrink-0">
        {/* Header */}
        <div className="flex items-center justify-between t-micro font-mono text-stone-500 border-b border-stone-800 pb-1.5">
          <div className="flex items-center gap-1.5 text-red-400 font-bold">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>S.L.O.P. INQUEST RADAR</span>
          </div>
          <span>Status: {isCritical ? 'CRITICAL' : isDangerous ? 'ELEVATED' : 'DOCILE'}</span>
        </div>
      </div>

      {/* Suspicion Heat Gauge — the hero element, expands to fill spare height */}
      <Card density="tight" className="flex-1 min-h-0 flex flex-col justify-center gap-3 bg-stone-950">
        <div className="flex justify-between items-baseline text-xs font-mono">
          <span className="text-stone-500">Grand Jury Heat</span>
          <span
            className={`text-2xl font-black tabular-nums tracking-tight ${
              isCritical ? 'text-red-400 animate-pulse' : isDangerous ? 'text-amber-400' : 'text-emerald-400'
            }`}
          >
            {slopSuspicion.toFixed(1)}
            <span className="text-sm text-stone-500">%</span>
          </span>
        </div>
        <div className="w-full flex-1 min-h-[56px] bg-stone-900 rounded-lg overflow-hidden border border-stone-800">
          <div
            className={`h-full transition-all duration-300 ${
              isCritical
                ? 'bg-gradient-to-r from-amber-500 via-red-500 to-red-600 animate-pulse'
                : 'bg-gradient-to-r from-emerald-500 to-amber-500'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, slopSuspicion))}%` }}
          />
        </div>
        <span className="t-micro text-stone-500 font-mono block leading-snug">
          Accumulates on 1,000x trades and state secret sales; decays -0.2%/sec passively.
        </span>
      </Card>

      <div className="shrink-0 space-y-2.5">
        {/* VEX Volatility Metric */}
        <Card density="tight" className="flex justify-between items-center font-mono t-micro bg-stone-950">
          <span className="text-stone-500">VEX Volatility Index:</span>
          <span className="text-amber-400 font-bold">{vexVolatility.toFixed(1)} pts</span>
        </Card>

        {/* Tactical Defense Tools */}
        <div className="space-y-1.5">
          <button
            onClick={() => bribeSlopAuditors(20)}
            disabled={cronyFavor < 20}
            className={`w-full py-2 rounded-lg font-mono t-micro font-bold flex items-center justify-center gap-1.5 transition-all ${
              cronyFavor >= 20
                ? 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-md active:scale-95 cursor-pointer'
                : 'bg-stone-800 text-stone-500 cursor-not-allowed'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Bribe Inquest Lead (Costs 20 Favor // -16% Heat)</span>
          </button>

          <button
            onClick={shredSubpoenas}
            className="w-full py-2 rounded-lg bg-stone-950 border border-stone-800 hover:border-emerald-600/80 text-emerald-400 font-mono t-micro font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
          >
            <FileX2 className="w-3.5 h-3.5" />
            <span>Emergency Shredder (-25% Heat) [Hotkey: S]</span>
          </button>
        </div>

        <div className="p-2 bg-stone-950/80 border border-stone-800 rounded t-micro text-stone-500 italic">
          "Special Counsel audits trigger full asset freezes at 100% heat unless averted via bribes or document shredding."
        </div>
      </div>
    </div>
  );
};
