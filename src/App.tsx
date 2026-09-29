/**
 * App.tsx: Zero-Scroll Tri-Pane Master Layout Coordinator
 * Implements the Hybrid Resolute Cockpit: Telemetry Wing, Tactile Blotter, Expansion Deck.
 * Enforces strict desktop zero-scroll invariants; line count strictly under 120 lines.
 */

import React, { useEffect } from 'react';
import { useGameLoop } from './hooks/useGameLoop';
import { useGameHotkeys, useDebugOpen } from './hooks/useGameHotkeys';
import { useDesktopViewport } from './hooks/useDesktopViewport';
import { useGameStore } from './store/useGameStore';
import { BreakingNewsBar } from './components/ticker/BreakingNewsBar';
import { TelemetryConsolePane } from './components/terminal/TelemetryConsolePane';
import { ResoluteBlotterCenter } from './components/desk/ResoluteBlotterCenter';
import { ExecutiveExpansionPane } from './components/dump/ExecutiveExpansionPane';
import { HotkeyFooterHUD } from './components/hud/HotkeyFooterHUD';
import { HintLayer } from './components/ui/HintTooltip';
import { DebugPanel } from './components/debug/DebugPanel';

export const App: React.FC = () => {
  // Initialize real-time ticks, desktop hotkeys, and sub-1080p scale metrics
  useGameLoop();
  useGameHotkeys();
  const { scaleFactor } = useDesktopViewport();
  const [debugOpen] = useDebugOpen();

  const isCapsFrenzy = useGameStore((s) => s.isCapsFrenzy);
  const rootStyle = {
    '--viewport-scale': String(scaleFactor),
    ...(scaleFactor < 1
      ? {
          width: `${100 / scaleFactor}vw`,
          height: `${100 / scaleFactor}dvh`,
          transform: `scale(${scaleFactor})`,
          transformOrigin: 'top left',
        }
      : {}),
  } as React.CSSProperties;

  // INVARIANT: [Portalled Content Must Inherit The Viewport Scale]
  // The whole cockpit shrinks below 1080p via `--viewport-scale`, which every
  // `t-*` tier divides by. `--viewport-scale` was set only on the root <div> —
  // and <HintLayer> portals its bubble to `document.body`, OUTSIDE that div, so
  // the tooltip was the one thing on screen rendering at full size against a
  // scaled-down cockpit. Mirroring the variable onto <html> makes it inherit.
  useEffect(() => {
    document.documentElement.style.setProperty('--viewport-scale', String(scaleFactor));
  }, [scaleFactor]);

  return (
    <div
      className={`h-screen h-[100dvh] w-screen w-[100dvw] overflow-hidden select-none overscroll-none bg-newsprint-950 text-newsprint-100 flex flex-col font-sans transition-all duration-300 selection:bg-gold-500 selection:text-newsprint-950 ${
        isCapsFrenzy ? 'ring-8 ring-inset ring-red-600/80' : ''
      }`}
      style={rootStyle}
    >
      {/* Top Header & Real-Time Breaking Ticker (48px) */}
      <header className="shrink-0 h-12 z-20">
        <BreakingNewsBar />
      </header>

      {/* Main Zero-Scroll Tri-Pane Surface */}
      <main
        className="flex-1 min-h-0 w-full p-2.5 grid grid-cols-12 gap-2.5 items-stretch overflow-hidden"
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

      {/* Fixed Bottom Hotkey HUD — 32px to match the rewritten footer, which
          dropped from 36px once the duplicate toggles and strapline were cut. */}
      <footer className="shrink-0 h-8 z-20">
        <HotkeyFooterHUD />
      </footer>

      {/* INVARIANT: [No Element On Screen May Be Unhoverable]
          One delegated layer serves every `data-hint` element in the cockpit,
          mounted once at the root. It must stay the ONLY tooltip host — a
          second implementation would be the drift this primitive exists to
          prevent. Enforced by `npm run hover:check`. */}
      <HintLayer />

      {/* DEV ONLY: state inspector toggled with `~`. Tree-shaken from prod builds. */}
      {import.meta.env.DEV && debugOpen && <DebugPanel />}
    </div>
  );
};

export default App;
