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
import { SLOP_CRITICAL_THRESHOLD } from './engine/systems/slopEngine';
import { BreakingNewsBar } from './components/ticker/BreakingNewsBar';
import { TelemetryConsolePane } from './components/terminal/TelemetryConsolePane';
import { ResoluteBlotterCenter } from './components/desk/ResoluteBlotterCenter';
import { ExecutiveExpansionPane } from './components/dump/ExecutiveExpansionPane';
import { HotkeyFooterHUD } from './components/hud/HotkeyFooterHUD';
import { FirstVisitCoach } from './components/hud/FirstVisitCoach';
import { HintLayer } from './components/ui/HintTooltip';
import { DebugPanel } from './components/debug/DebugPanel';

export const App: React.FC = () => {
  // Initialize real-time ticks, desktop hotkeys, and sub-1080p scale metrics
  useGameLoop();
  useGameHotkeys();
  const { scaleFactor } = useDesktopViewport();
  const [debugOpen] = useDebugOpen();

  const isCapsFrenzy = useGameStore((s) => s.isCapsFrenzy);
  const activeCrisis = useGameStore((s) => s.activeCrisis);
  const slopSuspicion = useGameStore((s) => s.slopSuspicion);

  /* INVARIANT: [The Panic Scale Is A Warning Channel, Not A Second Palette]
     Phase 2.1 added a saturated red scale, and the whole risk of it is that it
     spreads: a red that appears on ordinary UI stops reading as alarm within a
     session, which is exactly what the newsprint direction avoids by never
     reaching for saturated colour at all.

     So it fires on THREE states only, and each is a genuine "you are losing
     something or racing a clock":
       - a crisis is RINGING (a countdown the player must answer),
       - the walk-back window is open (the game's only timed skill expression),
       - S.L.O.P. heat is critical (a raid is imminent and about to seize cash).
     Frenzy already had a ring and keeps it. A sub-100 suspicion is NOT a panic
     state — at 60% heat nothing is happening yet, and dyeing the whole cockpit
     red for it would make the real 100% meaningless. */
  const isRinging = Boolean(activeCrisis);
  const slopCritical = slopSuspicion >= SLOP_CRITICAL_THRESHOLD;
  const panicLevel = isRinging || slopCritical ? 'panic-wash-strong' : isCapsFrenzy ? 'panic-wash' : '';

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
      className={`h-screen h-[100dvh] w-screen w-[100dvw] overflow-hidden select-none overscroll-none surround-room text-ink-1 flex flex-col font-sans transition-all duration-300 selection:bg-accent selection:text-ink-1 ${
        /* INVARIANT: [One Alarm Frame, Not Two]
           This was an 8px saturated red ring inset around the entire viewport
           DURING FRENZY, stacked on top of `panic-wash-strong`'s 3px frame plus
           its 90px red inset wash. Two concentric red perimeters ringing all
           three panes and both bars. `index.css` explicitly claims panic-wash
           is "deliberately NOT a full-screen red overlay" — applied to the root
           element it functionally was one.

           `panic-wash-strong` already fires on `isRinging || slopCritical`, and
           frenzy implies a ring, so the single frame is never absent. It is also
           `dead-ink` rather than `dead`: the bare fill measured 2.68:1 against
           the warm ground and could not clear the 3:1 that a control boundary
           owes. Removed rather than restyled — it was decoration, and it was
           beating the hero object for attention.

           `text-term-ink-1` on this root was near-white inherited text on a warm
           ground. The paper half needs the paper ink ladder; anything that does
           not set a colour of its own was inheriting the SCREEN's ink. */
        ''
      } ${panicLevel}`}
      style={rootStyle}
    >
      {/* Top Header & Real-Time Breaking Ticker (48px) */}
      <header className="shrink-0 h-12 z-20">
        <BreakingNewsBar />
      </header>

      {/* ISSUE-017 + ISSUE-020. Sits directly under the rail rather than in a
          corner, and collapses to nothing the moment the player acts on it or
          dismisses it — see `FirstVisitCoach`. It is `shrink-0` inside a flex
          column whose other children are `flex-1`/`h-12`/`h-8`, so the strip
          costs the desk exactly its own height and the cockpit stays zero-scroll
          with or without it. */}
      <FirstVisitCoach />

      {/* Main Zero-Scroll Tri-Pane Surface
          Phase 2.6: the `max-w-[1720px] mx-auto` the UI spec has claimed since
          it was written and `App.tsx` never implemented. Measured at 2560px, the
          un-capped grid gave the desk ~840px of empty parchment, because a
          `col-span-5` of a 2560px row is 1067px and the blotter's own content is
          ~600px wide. The cockpit is a document on a desk; past a certain width
          it stops being a document and starts being a letterbox with a game in
          the middle. The cap is what the spec always said it was. */}
      <main className="flex-1 min-h-0 w-full p-2.5 overflow-hidden">
        <div className="h-full w-full max-w-[1720px] mx-auto grid grid-cols-12 gap-2.5 items-stretch">
          {/* Left Wing: Telemetry Console (Stocks, PolyGrift, S.L.O.P.)
              4/12, up from 3. Measured: the left wing holds 20 buttons and the
              price chart and was the tightest column on screen, while the right
              wing was 75% EMPTY — 674px of 894px — holding two cards. The grid
              was giving the pane with the least content the most room. */}
          <section className="col-span-4 h-full min-h-0 overflow-hidden">
            <TelemetryConsolePane />
          </section>

          {/* Center Stage: The Resolute Tactile Blotter (Stamp, Props, YAPs) */}
          <section className="col-span-5 h-full min-h-0 overflow-hidden">
            <ResoluteBlotterCenter />
          </section>

          {/* Right Wing: Executive Expansion Deck (D.U.M.P., Unlocks, Tariffs,
              Caymans) — 3/12, down from 4. */}
          <section className="col-span-3 h-full min-h-0 overflow-hidden">
            <ExecutiveExpansionPane />
          </section>
        </div>
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
