/**
 * App.tsx: Root Layout Coordinator
 * Orchestrates the Breaking News header, Executive Desk, and BagHolder Pro terminal.
 * Follows agentic architecture rule: strictly under 120 lines.
 */

import React from 'react';
import { useGameLoop } from './hooks/useGameLoop';
import { useGameStore } from './store/useGameStore';
import { BreakingNewsBar } from './components/ticker/BreakingNewsBar';
import { ExecutiveDesk } from './components/desk/ExecutiveDesk';
import { BagHolderProPreview } from './components/terminal/BagHolderProPreview';

export const App: React.FC = () => {
  // Initialize the real-time tick loop
  useGameLoop();

  const isCapsFrenzy = useGameStore((s) => s.isCapsFrenzy);
  const screenShakeEnabled = useGameStore((s) => s.screenShakeEnabled);
  const tantrumMeter = useGameStore((s) => s.tantrumMeter);

  // Dynamic screen shake intensity when approaching frenzy
  const shakeClass =
    screenShakeEnabled && tantrumMeter > 85 && !isCapsFrenzy
      ? 'animate-shake'
      : '';

  return (
    <div
      className={`min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans transition-all duration-300 selection:bg-amber-500 selection:text-stone-950 ${
        isCapsFrenzy ? 'ring-8 ring-inset ring-red-600/80' : ''
      } ${shakeClass}`}
    >
      {/* Top Header & Real-Time Breaking Ticker */}
      <BreakingNewsBar />

      {/* Main Game Surface */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 flex flex-col items-center gap-8 justify-between">
        {/* The Executive Blotter Desk */}
        <ExecutiveDesk />

        {/* BagHolder Pro Terminal (Under the Desk) */}
        <BagHolderProPreview />
      </main>

      {/* Ambient Footer */}
      <footer className="w-full py-2 bg-stone-950 border-t border-stone-900 text-center text-[10px] text-stone-600 font-mono">
        EXECUTIVE DEGEN: SHORT THE WORLD // 100% TRANSFORMATIVE SATIRE // ALL RIGHTS SHORTED
      </footer>
    </div>
  );
};

export default App;
