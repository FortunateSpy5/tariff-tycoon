/**
 * Ink Meter & Refill Controls
 * Tracks Golden Sharpie ink stamina, Desperation Dry Nib state, and refill costs.
 */

import React from 'react';
import { Droplet, RefreshCw, AlertTriangle } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import { calculateInkRefillCost } from '../../engine/math/formulas';
import { formatCurrency } from '../../engine/math/bigNumber';

export const InkMeter: React.FC = () => {
  const inkLevel = useGameStore((s) => s.inkLevel);
  const maxInk = useGameStore((s) => s.maxInk);
  const inkRefillCount = useGameStore((s) => s.inkRefillCount);
  const treasuryCash = useGameStore((s) => s.treasuryCash);
  const refillInk = useGameStore((s) => s.refillInk);
  const isCapsFrenzy = useGameStore((s) => s.isCapsFrenzy);

  const refillCost = calculateInkRefillCost(inkRefillCount);
  const canAfford = treasuryCash >= refillCost;
  const isDry = inkLevel <= 0 && !isCapsFrenzy;
  const inkPercent = Math.round((inkLevel / maxInk) * 100);

  return (
    <div className="w-full bg-stone-900/90 border border-stone-800 rounded-lg p-3 shadow-sm select-none">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-300">
          <Droplet className={`w-3.5 h-3.5 ${isDry ? 'text-red-500 animate-bounce' : 'text-amber-400'}`} />
          <span>Golden Sharpie Ink</span>
        </div>
        <span className={`text-xs font-mono font-bold ${isDry ? 'text-red-400' : 'text-stone-300'}`}>
          {isCapsFrenzy ? '∞ INFINITE' : `${inkPercent}%`}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2.5 bg-stone-950 rounded-full overflow-hidden border border-stone-800 mb-2">
        <div
          className={`h-full transition-all duration-150 ${
            isCapsFrenzy
              ? 'bg-gradient-to-r from-red-600 via-amber-500 to-red-600 animate-pulse'
              : isDry
              ? 'bg-red-600'
              : 'bg-gradient-to-r from-amber-600 to-amber-400'
          }`}
          style={{ width: `${isCapsFrenzy ? 100 : inkPercent}%` }}
        />
      </div>

      {/* Status Warning or Refill Button */}
      <div className="flex items-center justify-between gap-2 mt-1">
        {isDry ? (
          <div className="flex items-center gap-1 text-[11px] text-red-400 font-semibold">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>DRY NIB: +3.5% Tantrum Slingshot</span>
          </div>
        ) : (
          <span className="text-[10px] text-stone-500">
            {isCapsFrenzy ? 'Infinite ink during Frenzy' : 'Consumes 2 units per signature'}
          </span>
        )}

        <button
          onClick={() => refillInk()}
          disabled={!canAfford || inkPercent >= 100}
          className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-all ${
            canAfford && inkPercent < 100
              ? 'bg-amber-600 hover:bg-amber-500 text-stone-950 shadow-md active:scale-95'
              : 'bg-stone-800 text-stone-500 cursor-not-allowed'
          }`}
        >
          <RefreshCw className="w-3 h-3" />
          <span>Refill ({formatCurrency(refillCost)})</span>
        </button>
      </div>
    </div>
  );
};
