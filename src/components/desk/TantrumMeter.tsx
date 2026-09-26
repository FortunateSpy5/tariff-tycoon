/**
 * Tantrum Meter & CAPS LOCK FRENZY Mode
 * Measures Dealmaker executive blood pressure, triggering 10x frenzy at 100%.
 */

import React from 'react';
import { Flame, Siren } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';

export const TantrumMeter: React.FC = () => {
  const tantrumMeter = useGameStore((s) => s.tantrumMeter);
  const isCapsFrenzy = useGameStore((s) => s.isCapsFrenzy);
  const capsFrenzySecondsRemaining = useGameStore((s) => s.capsFrenzySecondsRemaining);

  const percentage = Math.min(100, Math.round(tantrumMeter));

  return (
    <div className="w-full bg-stone-900/90 border border-stone-800 rounded-lg p-3 shadow-sm select-none">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-300">
          {isCapsFrenzy ? (
            <Siren className="w-3.5 h-3.5 text-red-500 animate-spin" />
          ) : (
            <Flame className={`w-3.5 h-3.5 ${percentage > 70 ? 'text-red-500 animate-pulse' : 'text-amber-500'}`} />
          )}
          <span>{isCapsFrenzy ? '🚨 CAPS LOCK FRENZY ACTIVE' : 'Executive Tantrum Meter'}</span>
        </div>
        <span
          className={`text-xs font-mono font-bold ${
            isCapsFrenzy ? 'text-red-400 animate-pulse' : percentage > 70 ? 'text-red-400' : 'text-stone-300'
          }`}
        >
          {isCapsFrenzy ? `${Math.ceil(capsFrenzySecondsRemaining)}s REMAINING` : `${percentage}%`}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2.5 bg-stone-950 rounded-full overflow-hidden border border-stone-800">
        <div
          className={`h-full transition-all duration-100 ${
            isCapsFrenzy
              ? 'bg-gradient-to-r from-red-600 via-amber-400 to-red-600 animate-pulse'
              : percentage > 70
              ? 'bg-gradient-to-r from-amber-500 to-red-600'
              : 'bg-gradient-to-r from-amber-600 to-amber-500'
          }`}
          style={{ width: `${isCapsFrenzy ? 100 : percentage}%` }}
        />
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-[10px] text-stone-500 mt-1.5">
        <span>{isCapsFrenzy ? '💥 10x CASH MULTIPLIER & ZERO INK CONSUMPTION' : 'Clicks build tantrum (+3.5% dry)'}</span>
        <span>{isCapsFrenzy ? 'PURE DEGEN ENERGY' : 'Frenzy triggers at 100%'}</span>
      </div>
    </div>
  );
};
