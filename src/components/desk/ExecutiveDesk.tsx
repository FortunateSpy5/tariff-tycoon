/**
 * Executive Desk & Blotter Surface Component
 * Combines blotter document preview, tactile clicker button, ink stamina, and tantrum meters.
 */

import React from 'react';
import { FileText, ArrowRight, ShieldCheck } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import { ClickerButton } from './ClickerButton';
import { InkMeter } from './InkMeter';
import { TantrumMeter } from './TantrumMeter';
import { formatCurrency } from '../../engine/math/bigNumber';

export const ExecutiveDesk: React.FC = () => {
  const phase = useGameStore((s) => s.phase);
  const setGamePhase = useGameStore((s) => s.setGamePhase);
  const treasuryCash = useGameStore((s) => s.treasuryCash);
  const totalClicks = useGameStore((s) => s.totalClicks);

  const canAdvanceToPhase2 = phase === 1 && treasuryCash >= 1_000_000;

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-6">
      {/* Phase Advancement Banner (Airport -> Oval Office at $1M) */}
      {phase === 1 && (
        <div className="w-full bg-stone-900 border border-blue-900/60 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-950/80 rounded-lg border border-blue-800 text-blue-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-stone-200">
                Phase 1: Gate 99B Liberty International
              </h3>
              <p className="text-xs text-stone-400">
                Accumulate <span className="text-emerald-400 font-mono font-semibold">{formatCurrency(1000000)}</span> to seize the Oval Office desk!
              </p>
            </div>
          </div>

          <button
            onClick={() => setGamePhase(2)}
            disabled={!canAdvanceToPhase2}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
              canAdvanceToPhase2
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 shadow-lg hover:scale-105 active:scale-95 animate-pulse'
                : 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700'
            }`}
          >
            <span>Promote to Oval Office</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Desk Blotter Surface */}
      <div
        className={`w-full rounded-2xl border p-6 flex flex-col items-center justify-between relative overflow-hidden shadow-2xl transition-colors duration-500 ${
          phase === 1
            ? 'bg-stone-900/90 border-blue-900/40 shadow-blue-950/20'
            : 'bg-gradient-to-b from-stone-900 via-stone-900/95 to-amber-950/20 border-amber-900/40 shadow-amber-950/20'
        }`}
      >
        {/* Parchment Document Header */}
        <div className="w-full max-w-lg bg-amber-50/5 border border-amber-500/20 rounded-lg p-3 text-center mb-2 shadow-inner backdrop-blur-sm">
          <div className="flex items-center justify-center gap-2 text-xs font-mono font-bold tracking-widest text-amber-400/90 uppercase">
            <FileText className="w-4 h-4" />
            <span>
              {phase === 1
                ? 'CUSTOMS SEIZURE LOG // AGENT 412'
                : `EXECUTIVE ORDER #${8400 + totalClicks} // 3:00 AM DIRECTIVE`}
            </span>
          </div>
          <p className="text-xs text-stone-300 italic mt-1">
            {phase === 1
              ? '"Foreign brie and uninspected produce confiscated for emergency redistribution."'
              : '"By authority vested in the Dealmaker-in-Chief, international trade is officially cancelled."'}
          </p>
        </div>

        {/* Center Clicker */}
        <ClickerButton />

        {/* Bottom Meters (Ink & Tantrum) */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <InkMeter />
          <TantrumMeter />
        </div>
      </div>
    </div>
  );
};
