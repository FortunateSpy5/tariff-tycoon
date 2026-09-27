/**
 * Red Rotary Emergency Phone Prop
 * Anti-bankruptcy bailout fail-safe.
 * Rings furiously when liquid cash falls below $10.
 * Clicking bills the government for Palm-a-Grifto golf carts ($5,000 x Phase).
 */

import React, { useState } from 'react';
import { Phone, PhoneCall } from 'lucide-react';
import { useGameStore } from '../../../store/useGameStore';

export const RedPhoneProp: React.FC = () => {
  const isBroke = useGameStore((s) => s.treasuryCash < 10);
  const phase = useGameStore((s) => s.phase);
  const triggerRedPhoneBailout = useGameStore((s) => s.triggerRedPhoneBailout);
  const [feedback, setFeedback] = useState<string | null>(null);

  const bailoutAmount = 5000 * (1 + phase);

  const handleClick = () => {
    if (isBroke) {
      triggerRedPhoneBailout();
      setFeedback(`+ $${bailoutAmount.toLocaleString()} BAILOUT!`);
      setTimeout(() => setFeedback(null), 2500);
    } else {
      setFeedback('Standby (Only active if cash < $10)');
      setTimeout(() => setFeedback(null), 2000);
    }
  };

  return (
    <button
      onClick={handleClick}
      title={isBroke ? 'EMERGENCY BAILOUT: Bill Sovereign Detail for golf cart rentals' : 'Emergency Hot-Line (Standby)'}
      className={`p-2 rounded-lg border transition-all flex items-center gap-2 text-left cursor-pointer group relative overflow-hidden select-none ${
        isBroke
          ? 'bg-red-950/80 border-red-600 text-red-200 animate-ring shadow-lg shadow-red-950/50'
          : 'bg-stone-950/90 border-stone-800 text-stone-400 hover:border-red-900/60'
      }`}
    >
      <div className={`p-1.5 rounded-md ${isBroke ? 'bg-red-600 text-stone-950' : 'bg-stone-900 text-red-500'}`}>
        {isBroke ? <PhoneCall className="w-4 h-4 animate-bounce" /> : <Phone className="w-4 h-4" />}
      </div>
      <div>
        <span className="font-mono font-bold text-[10px] block text-red-400 group-hover:text-red-300">
          RED PHONE
        </span>
        <span className="text-[9px] text-stone-500 font-mono block">
          {isBroke ? `RINGING! [BILL $${(bailoutAmount / 1000).toFixed(0)}k]` : 'Standby ($0)'}
        </span>
      </div>

      {feedback && (
        <div className="absolute inset-0 bg-stone-950/95 flex items-center justify-center text-[10px] font-mono font-bold text-amber-400 px-1 text-center">
          {feedback}
        </div>
      )}
    </button>
  );
};
