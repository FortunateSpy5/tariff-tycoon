/**
 * BagHolder Pro Terminal Preview
 * Bottom fintech terminal displaying S.L.O.P. heat, stocks, and the [LAUNCH LETHAL YAP] trigger.
 */

import React, { useState } from 'react';
import { Smartphone, Send, RotateCcw, AlertOctagon, TrendingDown, TrendingUp } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import { generateProceduralYap } from '../../engine/systems/yapEngine';
import type { StockSymbol } from '../../types/market';
import type { YapPost } from '../../types/yap';

export const BagHolderProPreview: React.FC = () => {
  const stocks = useGameStore((s) => s.stocks);
  const slopSuspicion = useGameStore((s) => s.slopSuspicion);
  const triggerYapMarketShock = useGameStore((s) => s.triggerYapMarketShock);
  const executeWalkBack = useGameStore((s) => s.executeWalkBack);
  const isWalkBackWindowActive = useGameStore((s) => s.isWalkBackWindowActive);
  const walkBackSecondsRemaining = useGameStore((s) => s.walkBackSecondsRemaining);

  const [activeYap, setActiveYap] = useState<YapPost | null>(null);

  const handleFireYap = (preferredStock?: StockSymbol) => {
    const newYap = generateProceduralYap(preferredStock);
    setActiveYap(newYap);
    triggerYapMarketShock(newYap);

    // Immediate insider trading profit from shorting before the YAP
    const targetSym = newYap.targetSymbol || 'PAIN';
    const targetPrice = stocks[targetSym]?.currentPrice || 100;
    const insiderProfit = Math.round(targetPrice * 2.5);
    useGameStore.setState((state) => ({
      treasuryCash: state.treasuryCash + insiderProfit,
    }));
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-stone-950 border border-stone-800 rounded-2xl p-4 sm:p-5 shadow-2xl select-none">
      {/* Terminal Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-800 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-950/80 border border-emerald-800 rounded text-emerald-400">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <span className="font-mono text-xs font-black text-emerald-400 tracking-wider uppercase">
              BagHolder Pro v2.4
            </span>
            <span className="text-[10px] text-stone-500 block">
              Terminal taped under the Resolute Desk // 0DTE Options
            </span>
          </div>
        </div>

        {/* S.L.O.P. Suspicion Meter */}
        <div className="flex items-center gap-2">
          <AlertOctagon className={`w-3.5 h-3.5 ${slopSuspicion > 70 ? 'text-red-500 animate-pulse' : 'text-amber-500'}`} />
          <span className="text-xs text-stone-400">S.L.O.P. Suspicion:</span>
          <div className="w-24 h-2 bg-stone-900 rounded-full overflow-hidden border border-stone-800">
            <div
              className={`h-full transition-all duration-300 ${
                slopSuspicion > 70 ? 'bg-red-600 animate-pulse' : 'bg-amber-500'
              }`}
              style={{ width: `${Math.min(100, Math.round(slopSuspicion))}%` }}
            />
          </div>
          <span className="text-xs font-mono font-bold text-stone-300">
            {Math.round(slopSuspicion)}%
          </span>
        </div>
      </div>

      {/* Stock Quick-Crawl Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2 mb-4">
        {(Object.keys(stocks) as StockSymbol[]).slice(0, 5).map((sym) => {
          const s = stocks[sym];
          const delta = s.currentPrice - s.basePrice;
          const isUp = delta >= 0;
          return (
            <button
              key={sym}
              onClick={() => handleFireYap(sym)}
              className="bg-stone-900/80 hover:bg-stone-900 border border-stone-800/80 hover:border-stone-700 rounded-lg p-2 flex flex-col text-left transition-all active:scale-95 group"
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-mono text-xs font-black text-stone-200">${sym}</span>
                <span className={`text-[10px] flex items-center ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                  {isUp ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                </span>
              </div>
              <span className="text-sm font-mono font-bold text-stone-300 mt-0.5">
                ${s.currentPrice.toFixed(2)}
              </span>
              <span className="text-[9px] text-stone-500 group-hover:text-amber-400 transition-colors truncate">
                Click to Short & YAP
              </span>
            </button>
          );
        })}
      </div>

      {/* Action Controls & Active YAP Feed */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {/* Main YAP Fire Button */}
        <button
          onClick={() => handleFireYap()}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-amber-600 to-red-600 hover:opacity-95 text-stone-950 font-black text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
        >
          <Send className="w-4 h-4" />
          <span>Launch 3:00 AM Lethal Yap</span>
        </button>

        {/* 8-Second Walk-Back Straddle Squeeze Button */}
        {isWalkBackWindowActive && (
          <button
            onClick={executeWalkBack}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-stone-950 font-black text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg animate-bounce active:scale-95 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Walk-Back Clarification ({Math.ceil(walkBackSecondsRemaining)}s) +35% PUMP</span>
          </button>
        )}
      </div>

      {/* Active YAP Post Box */}
      {activeYap && (
        <div className="mt-3 p-3 bg-stone-900 border border-stone-800 rounded-xl text-xs">
          <div className="flex items-center justify-between text-stone-400 text-[10px] font-mono mb-1">
            <span>Posted at {activeYap.timestamp} via YAP Mobile</span>
            <span className="text-amber-400 font-bold">+{activeYap.viralQuotesCount.toLocaleString()} Quote-YAPs</span>
          </div>
          <p className="text-stone-200 font-sans leading-relaxed font-medium">
            "{activeYap.rawText}"
          </p>
        </div>
      )}
    </div>
  );
};
