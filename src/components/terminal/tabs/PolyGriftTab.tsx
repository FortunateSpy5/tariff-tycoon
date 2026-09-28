/**
 * PolyGrift Tab: Prediction Markets & De-Dollarization Wagers
 * Wager on satirical geopolitical outcomes, late-night tariffs, and DOJ subpoenas.
 */

import React, { useState } from 'react';
import { Target, CheckCircle2, XCircle } from 'lucide-react';
import { useGameStore } from '../../../store/useGameStore';
import { INITIAL_POLYGRIFT_BETS } from '../../../constants/unlocks';
import { formatCurrency } from '../../../engine/math/bigNumber';

export const PolyGriftTab: React.FC = () => {
  const wagerPolyGrift = useGameStore((s) => s.wagerPolyGrift);
  const [feedback, setFeedback] = useState<string | null>(null);

  const wagerAmount = 1000;

  const handleWager = (betId: string, choice: 'YES' | 'NO') => {
    const currentTreasury = useGameStore.getState().treasuryCash;
    if (currentTreasury < wagerAmount) {
      setFeedback('Need at least $1,000 to wager!');
      setTimeout(() => setFeedback(null), 2000);
      return;
    }

    const result = wagerPolyGrift(betId, choice, wagerAmount);
    if (result.success) {
      if (result.won) {
        setFeedback(`WIN! +${formatCurrency(result.payout || 0)} PAYOUT on ${choice}!`);
      } else {
        setFeedback(`LOSS: -${formatCurrency(wagerAmount)} on ${choice}!`);
      }
      setTimeout(() => setFeedback(null), 2500);
    }
  };

  return (
    <div className="h-full min-h-0 flex flex-col gap-2 select-none">
      <div className="shrink-0">
        <div className="flex items-center justify-between t-micro font-mono text-stone-400 border-b border-stone-800 pb-1.5">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold">
            <Target className="w-3.5 h-3.5" />
            <span>POLY-GRIFT PREDICTION BOOK</span>
          </div>
          <span>Wager: $1,000 / slip</span>
        </div>
      </div>

      {/* Bets List — flexes to fill remaining vertical space */}
      <div className="flex-1 min-h-0 space-y-2 overflow-y-auto custom-scrollbar pr-0.5">
        {INITIAL_POLYGRIFT_BETS.map((bet) => (
            <div key={bet.id} className="surface-terminal-well rounded-lg p-2 space-y-1.5">
              <span className="font-sans font-medium text-phosphor-300 block text-xs leading-snug">
                {bet.title}
              </span>
              <div className="flex items-center justify-between t-caption font-mono text-phosphor-600">
                <span>Chance: <strong className="text-phosphor-400">{bet.probYes}%</strong></span>
                <span>Payout Multiplier: {bet.oddsYes}x / {bet.oddsNo}x</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                <button
                  onClick={() => handleWager(bet.id, 'YES')}
                  className="py-1 bg-emerald-900/60 hover:bg-emerald-800 border border-emerald-700/60 rounded text-emerald-300 font-mono font-bold t-micro flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  <span>YES ({bet.oddsYes}x)</span>
                </button>
                <button
                  onClick={() => handleWager(bet.id, 'NO')}
                  className="py-1 surface-terminal-well hover:border-phosphor-500/60 rounded text-phosphor-300 font-mono font-bold t-micro flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
                >
                  <XCircle className="w-2.5 h-2.5" />
                  <span>NO ({bet.oddsNo}x)</span>
                </button>
              </div>
            </div>
          ))}
      </div>

      {feedback && (
        <div className="shrink-0 p-1.5 rounded bg-gold-500/20 border border-gold-500/40 text-center font-mono t-micro font-bold text-gold-400 animate-pulse">
          {feedback}
        </div>
      )}
    </div>
  );
};
