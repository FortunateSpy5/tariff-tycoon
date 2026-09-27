/**
 * Dual-Phase Clicker Button
 * Phase 1: Heavy Blue Rubber Stamp [CONFISCATED - BY ORDER OF AGENT 412] at Gate 99B.
 * Phase 2+: Oversized 24k Golden Sherpie signing executive orders on the Resolute blotter.
 * Compact fluid layout guarantees zero overflow on 720p/768p laptop viewports.
 */

import React, { useState, useRef } from 'react';
import { PenTool, Stamp, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useGameStore } from '../../store/useGameStore';
import { calculateClickValue } from '../../engine/math/formulas';
import { formatCurrency } from '../../engine/math/bigNumber';

interface FloatingNumber {
  id: number;
  x: number;
  y: number;
  text: string;
}

export const ClickerButton: React.FC = () => {
  const phase = useGameStore((s) => s.phase);
  const clickDesk = useGameStore((s) => s.clickDesk);
  const inkLevel = useGameStore((s) => s.inkLevel);
  const isCapsFrenzy = useGameStore((s) => s.isCapsFrenzy);
  const screenShakeEnabled = useGameStore((s) => s.screenShakeEnabled);
  const isHighTantrum = useGameStore((s) => s.tantrumMeter > 85);
  const sovereignImmunitySlips = useGameStore((s) => s.sovereignImmunitySlips);

  const [isPressed, setIsPressed] = useState(false);
  const [floatingNumbers, setFloatingNumbers] = useState<FloatingNumber[]>([]);
  const nextIdRef = useRef(0);

  // Calculate current click cash value: base $5.00 * phaseMultiplier (1x at P1, 10x at P2)
  const clickValue = calculateClickValue(
    phase,
    5.0,
    isCapsFrenzy ? 100 : inkLevel,
    isCapsFrenzy,
    sovereignImmunitySlips || 0
  );

  const isDry = inkLevel <= 0 && !isCapsFrenzy;
  const isRecoilActive = screenShakeEnabled && (isCapsFrenzy || isHighTantrum);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    clickDesk();

    // Trigger celebratory confetti burst during Frenzy
    if (isCapsFrenzy) {
      confetti({
        particleCount: 15,
        spread: 45,
        origin: { y: 0.6 },
        colors: ['#ef4444', '#f59e0b', '#dc2626'],
      });
    }

    // Spawn floating cash number at click coordinates
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newFloater: FloatingNumber = {
      id: ++nextIdRef.current,
      x,
      y,
      text: `+${formatCurrency(clickValue)}`,
    };

    setFloatingNumbers((prev) => [...prev.slice(-5), newFloater]);
  };

  return (
    <div className="relative flex flex-col items-center justify-center p-1.5 select-none my-auto">
      {/* Floating Cash Indicators with pure onAnimationEnd cleanup */}
      {floatingNumbers.map((floater) => (
        <span
          key={floater.id}
          onAnimationEnd={() => {
            setFloatingNumbers((prev) => prev.filter((item) => item.id !== floater.id));
          }}
          className="absolute font-black text-xs sm:text-sm pointer-events-none animate-float-fade font-mono text-emerald-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] z-30"
          style={{ left: `${floater.x}px`, top: `${floater.y - 15}px` }}
        >
          {floater.text}
        </span>
      ))}

      {/* Main Interactive Button */}
      <button
        onClick={handleClick}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
        onTouchStart={() => setIsPressed(true)}
        onTouchEnd={() => setIsPressed(false)}
        className={`relative group w-44 h-44 sm:w-52 sm:h-52 md:w-60 md:h-60 rounded-full flex flex-col items-center justify-center cursor-pointer transition-all duration-75 shadow-2xl ${
          isPressed ? 'scale-95' : 'hover:scale-102'
        } ${isRecoilActive ? 'animate-recoil' : ''} ${
          isCapsFrenzy
            ? 'bg-gradient-to-br from-red-600 via-amber-600 to-red-700 ring-6 ring-red-500/50 animate-pulse'
            : phase === 1
            ? 'bg-gradient-to-br from-blue-700 via-indigo-800 to-blue-950 ring-4 ring-blue-500/30'
            : 'bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 ring-4 ring-amber-400/40'
        }`}
      >
        {/* Glow backdrop */}
        <div
          className={`absolute inset-0 rounded-full blur-lg opacity-25 ${
            isCapsFrenzy ? 'bg-red-500' : phase === 1 ? 'bg-blue-400' : 'bg-amber-300'
          }`}
        />

        {/* Inner Stamp / Pen Surface */}
        <div className="relative z-10 flex flex-col items-center text-center p-2">
          {phase === 1 ? (
            <>
              <Stamp className="w-10 h-10 sm:w-12 sm:h-12 text-blue-200 mb-1 drop-shadow-md group-hover:rotate-6 transition-transform" />
              <span className="font-mono text-[10px] font-black tracking-widest text-blue-300 uppercase">
                Gate 99B Customs
              </span>
              <span className="text-lg sm:text-xl font-black text-white tracking-wider uppercase mt-0.5">
                CONFISCATE
              </span>
              <span className="text-[10px] font-mono text-blue-200/80 mt-0.5">
                [BY AGENT 412]
              </span>
            </>
          ) : (
            <>
              <PenTool className="w-10 h-10 sm:w-12 sm:h-12 text-stone-950 mb-1 drop-shadow group-hover:-rotate-12 transition-transform" />
              <span className="font-mono text-[10px] font-black tracking-widest text-amber-950 uppercase">
                Resolute Desk
              </span>
              <span className="text-lg sm:text-xl font-black text-stone-950 tracking-wider uppercase mt-0.5">
                {isDry ? 'DRY SCRATCH' : 'SIGN TARIFF'}
              </span>
              <span className="text-[10px] font-mono text-amber-950/80 mt-0.5">
                24k Golden Sherpie
              </span>
            </>
          )}

          {/* Current Yield Tag */}
          <div className="mt-2 px-2.5 py-0.5 rounded-full bg-stone-950/60 backdrop-blur-sm border border-white/10 flex items-center gap-1 font-mono text-[11px] font-bold text-emerald-300 shadow">
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>+{formatCurrency(clickValue)} / tap</span>
          </div>
        </div>
      </button>

      {/* Helper caption */}
      <span className="mt-1.5 text-[10px] font-mono text-stone-400 text-center">
        {phase === 1
          ? 'Slam stamp to seize contraband & seed treasury ($10k unlocks Oval Office)'
          : isCapsFrenzy
          ? '🚨 FRENZY: 10x REVENUE // CLICK AS FAST AS POSSIBLE'
          : 'Slam Sherpie to issue executive orders & build tantrum'}
      </span>
    </div>
  );
};
