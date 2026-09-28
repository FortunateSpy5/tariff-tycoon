/**
 * Subpoena Paper Shredder Prop
 * Sits on the desk blotter; purges incriminating trade slips to avoid DOJ raids.
 * Clicking reduces S.L.O.P. regulatory suspicion by -25%.
 */

import React, { useState } from 'react';
import { FileX2, AlertTriangle } from 'lucide-react';
import { useGameStore } from '../../../store/useGameStore';

export const SubpoenaShredderProp: React.FC = () => {
  const isHighHeat = useGameStore((s) => s.slopSuspicion > 70);
  const cronyFavor = useGameStore((s) => s.cronyFavor);
  const shredSubpoenas = useGameStore((s) => s.shredSubpoenas);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(false);

  const handleClick = () => {
    if (cooldown) {
      setFeedback('COOLING DOWN (5s)');
      setTimeout(() => setFeedback(null), 1000);
      return;
    }
    if (cronyFavor < 10) {
      setFeedback('NEED 10 FAVOR 🤝');
      setTimeout(() => setFeedback(null), 1500);
      return;
    }

    const success = shredSubpoenas();
    if (success) {
      setCooldown(true);
      setFeedback('WHIRRR! -25% HEAT (-10 🤝)');
      setTimeout(() => setFeedback(null), 2000);
      setTimeout(() => setCooldown(false), 5000);
    } else {
      setFeedback('COOLDOWN ACTIVE');
      setTimeout(() => setFeedback(null), 1200);
    }
  };

  const hasEnoughFavor = cronyFavor >= 10;

  return (
    <button
      onClick={handleClick}
      disabled={cooldown || !hasEnoughFavor}
      title="Shred incriminating trade documents (-25% S.L.O.P. Suspicion, costs 10 Favor) [Hotkey: S]"
      className={`p-2 rounded-lg border transition-all flex items-center gap-2 text-left cursor-pointer group relative overflow-hidden select-none active:scale-95 ${
        cooldown || !hasEnoughFavor
          ? 'opacity-60 cursor-not-allowed bg-stone-900 border-stone-800 text-stone-500'
          : isHighHeat
          ? 'bg-amber-950/80 border-amber-500/80 text-amber-200 shadow-md shadow-amber-950/40'
          : 'bg-stone-950/90 border-stone-800 text-stone-400 hover:border-emerald-600/60'
      }`}
    >
      <div className={`p-1.5 rounded-md ${isHighHeat ? 'bg-amber-500 text-stone-950 animate-pulse' : 'bg-stone-900 text-emerald-400'}`}>
        {isHighHeat ? <AlertTriangle className="w-4 h-4" /> : <FileX2 className="w-4 h-4" />}
      </div>
      <div>
        <span className={`font-mono font-bold t-micro block ${isHighHeat ? 'text-amber-400' : 'text-emerald-400'}`}>
          SHREDDER
        </span>
        <span className="t-caption text-stone-500 font-mono block">
          {!hasEnoughFavor ? 'Need 10 Favor [S]' : isHighHeat ? 'PURGE HEAT NOW!' : '-25% (10 🤝) [S]'}
        </span>
      </div>

      {feedback && (
        <div className="absolute inset-0 bg-stone-950/95 flex items-center justify-center t-micro font-mono font-bold text-emerald-400 px-1 text-center">
          {feedback}
        </div>
      )}
    </button>
  );
};
