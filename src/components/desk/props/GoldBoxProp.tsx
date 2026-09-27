/**
 * Gold Classified Document Box Prop
 * Sits on the desk blotter; sells classified blueprints to offshore buyers.
 * Grants +$500 instant cash, but adds +8% S.L.O.P. regulatory heat.
 */

import React, { useState } from 'react';
import { Archive, Sparkles } from 'lucide-react';
import { useGameStore } from '../../../store/useGameStore';

export const GoldBoxProp: React.FC = () => {
  const sellClassifiedSecrets = useGameStore((s) => s.sellClassifiedSecrets);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleClick = () => {
    sellClassifiedSecrets();
    setFeedback('+$500 CASH (+8% HEAT)');
    setTimeout(() => setFeedback(null), 1800);
  };

  return (
    <button
      onClick={handleClick}
      title="Sell classified bathroom documents for +$500 (+8% Suspicion)"
      className="p-2 rounded-lg bg-stone-950/90 border border-stone-800 hover:border-amber-500/60 transition-all flex items-center gap-2 text-left cursor-pointer group relative overflow-hidden select-none active:scale-95"
    >
      <div className="p-1.5 rounded-md bg-amber-950/60 border border-amber-500/30 text-amber-400 group-hover:scale-110 transition-transform">
        <Archive className="w-4 h-4" />
      </div>
      <div>
        <div className="flex items-center gap-1 font-mono font-bold text-[10px] text-amber-400 group-hover:text-amber-300">
          <span>GOLD BOX</span>
          <Sparkles className="w-2.5 h-2.5 text-amber-300" />
        </div>
        <span className="text-[9px] text-stone-500 font-mono block">
          Sell Secrets (+$500)
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
