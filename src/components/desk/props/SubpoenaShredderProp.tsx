/**
 * Subpoena Paper Shredder Prop
 * Sits on the desk blotter; purges incriminating trade slips to avoid DOJ raids.
 * Clicking reduces S.L.O.P. regulatory suspicion by -25%.
 */

import React, { useState } from 'react';
import { FileX2, AlertTriangle } from 'lucide-react';
import { useGameStore } from '../../../store/useGameStore';

export const SubpoenaShredderProp: React.FC = () => {
  const slopSuspicion = useGameStore((s) => s.slopSuspicion);
  const shredSubpoenas = useGameStore((s) => s.shredSubpoenas);
  const [feedback, setFeedback] = useState<string | null>(null);

  const isHighHeat = slopSuspicion > 70;

  const handleClick = () => {
    shredSubpoenas();
    setFeedback('WHIRRR! -25% HEAT');
    setTimeout(() => setFeedback(null), 1800);
  };

  return (
    <button
      onClick={handleClick}
      title="Shred incriminating trade documents (-25% S.L.O.P. Suspicion) [Hotkey: S]"
      className={`p-2 rounded-lg border transition-all flex items-center gap-2 text-left cursor-pointer group relative overflow-hidden select-none active:scale-95 ${
        isHighHeat
          ? 'bg-amber-950/80 border-amber-500/80 text-amber-200 shadow-md shadow-amber-950/40'
          : 'bg-stone-950/90 border-stone-800 text-stone-400 hover:border-emerald-600/60'
      }`}
    >
      <div className={`p-1.5 rounded-md ${isHighHeat ? 'bg-amber-500 text-stone-950 animate-pulse' : 'bg-stone-900 text-emerald-400'}`}>
        {isHighHeat ? <AlertTriangle className="w-4 h-4" /> : <FileX2 className="w-4 h-4" />}
      </div>
      <div>
        <span className={`font-mono font-bold text-[10px] block ${isHighHeat ? 'text-amber-400' : 'text-emerald-400'}`}>
          SHREDDER
        </span>
        <span className="text-[9px] text-stone-500 font-mono block">
          {isHighHeat ? 'PURGE HEAT NOW!' : 'Purge -25% [S]'}
        </span>
      </div>

      {feedback && (
        <div className="absolute inset-0 bg-stone-950/95 flex items-center justify-center text-[10px] font-mono font-bold text-emerald-400 px-1 text-center">
          {feedback}
        </div>
      )}
    </button>
  );
};
