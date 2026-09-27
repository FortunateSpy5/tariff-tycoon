/**
 * App.tsx: Zero-Scroll Tri-Pane Master Layout Coordinator
 * Implements the Hybrid Resolute Cockpit: Telemetry Wing, Tactile Blotter, Expansion Deck.
 * Enforces strict desktop zero-scroll invariants; line count strictly under 120 lines.
 */

import React from 'react';
import { useGameLoop } from './hooks/useGameLoop';
import { useGameHotkeys } from './hooks/useGameHotkeys';
import { useDesktopViewport } from './hooks/useDesktopViewport';
import { useGameStore } from './store/useGameStore';
import { BreakingNewsBar } from './components/ticker/BreakingNewsBar';
import { TelemetryConsolePane } from './components/terminal/TelemetryConsolePane';
import { ResoluteBlotterCenter } from './components/desk/ResoluteBlotterCenter';
import { ExecutiveExpansionPane } from './components/dump/ExecutiveExpansionPane';
import { HotkeyFooterHUD } from './components/hud/HotkeyFooterHUD';

export const App: React.FC = () => {
  // Initialize real-time ticks, desktop hotkeys, and sub-1080p scale metrics
  useGameLoop();
  useGameHotkeys();
  const { scaleFactor } = useDesktopViewport();

  const isCapsFrenzy = useGameStore((s) => s.isCapsFrenzy);

  return (
    <div
      className={`h-screen h-[100dvh] w-screen w-[100dvw] overflow-hidden select-none overscroll-none bg-stone-950 text-stone-100 flex flex-col font-sans transition-all duration-300 selection:bg-amber-500 selection:text-stone-950 ${
        isCapsFrenzy ? 'ring-8 ring-inset ring-red-600/80' : ''
      }`}
    >
      {/* Top Header & Real-Time Breaking Ticker (48px) */}
      <header className="shrink-0 h-12 z-20">
        <BreakingNewsBar />
      </header>

      {/* Main Zero-Scroll Tri-Pane Surface */}
      <main
        className="flex-1 min-h-0 w-full p-2.5 grid grid-cols-12 gap-2.5 items-stretch overflow-hidden"
        style={
          scaleFactor < 1
            ? { transform: `scale(${scaleFactor})`, transformOrigin: 'top center' }
            : undefined
        }
      >
        {/* Left Wing: Telemetry Console (Stocks, PolyGrift, S.L.O.P.) */}
        <section className="col-span-3 h-full min-h-0 overflow-hidden">
          <TelemetryConsolePane />
        </section>

        {/* Center Stage: The Resolute Tactile Blotter (Stamp, Props, YAPs) */}
        <section className="col-span-5 h-full min-h-0 overflow-hidden">
          <ResoluteBlotterCenter />
        </section>

        {/* Right Wing: Executive Expansion Deck (D.U.M.P., Unlocks, Tariffs, Caymans) */}
        <section className="col-span-4 h-full min-h-0 overflow-hidden">
          <ExecutiveExpansionPane />
        </section>
      </main>

      {/* Fixed Bottom Hotkey HUD (36px) */}
      <footer className="shrink-0 h-9 z-20">
        <HotkeyFooterHUD />
      </footer>
    </div>
  );
};

export default App;
