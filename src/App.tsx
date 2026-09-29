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

  // INVARIANT: [Portalled Content Must NOT Inherit The Viewport Scale]
  // Every `t-*` tier computes `font-size: calc(9.5px / var(--viewport-scale))`
  // and the cockpit root then applies `transform: scale(scaleFactor)`. Those two
  // cancel: the type is authored at 9.5px and renders at 9.5px PHYSICAL, at any
  // viewport. <HintLayer> portals its bubble to `document.body`, outside that
  // transform, so it only ever gets the division half.
  //
  // An earlier version mirrored `--viewport-scale` onto <html>, reasoning that
  // the bubble "should inherit the scale". That is the arithmetic backwards, and
  // it made the tooltip ~19% LARGER than the cockpit at every viewport under
  // 840px tall — 1280x720 and 1366x768, both required sizes. The value for
  // untransformed portalled content is therefore 1, not the scale factor: the
  // bubble renders at the same physical size as the text it sits beside.
  useEffect(() => {
    document.documentElement.style.setProperty('--viewport-scale', '1');
  }, []);

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
