/**
 * Left Wing: Telemetry Console Pane
 * Hosts multi-channel tabs: [1] Stocks & 0DTE Options, [2] PolyGrift Bets, [3] S.L.O.P. Radar.
 *
 * REDESIGN [The Phantom Wings]:
 * Locked channels used to be filtered out of the strip, so a new player's left
 * wing had a single tab (or none) and no way to learn that Radar and PolyGrift
 * exist until the game handed them over for free. Every channel is now always
 * present; a sealed one renders a SealedDossier instead of its body.
 *
 * INVARIANT: the locked branch must come BEFORE the tab body. A sealed channel
 * must never mount StocksOptionsTab / SlopRadarTab / PolyGriftTab, or its
 * actions would be reachable while sealed.
 */

import React from 'react';
import { Radio, Activity } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import type { LeftChannelTab } from '../../types/unlocks';
import { isLeftTabUnlocked, type UnlockState } from '../../engine/systems/unlockEngine';
import { LEFT_TAB_DEMANDS } from '../../constants/tabDemands';
import { PaneShell, TabStrip, StatusStrip } from '../ui/PaneShell';
import { SealedDossier } from '../ui/SealedDossier';
import { StocksOptionsTab } from './tabs/StocksOptionsTab';
import { PolyGriftTab } from './tabs/PolyGriftTab';
import { SlopRadarTab } from './tabs/SlopRadarTab';

const TABS: { id: LeftChannelTab; label: string; shortcut: string }[] = [
  { id: 'stocks', label: 'STOCKS', shortcut: '1' },
  { id: 'radar', label: 'S.L.O.P.', shortcut: '2' },
  { id: 'polygrift', label: 'POLY-GRIFT', shortcut: '3' },
];

export const TelemetryConsolePane: React.FC = () => {
  const phase = useGameStore((s) => s.phase);
  const hasMarketAccess = useGameStore((s) => s.hasMarketAccess);
  const hasRadarAccess = useGameStore((s) => s.hasRadarAccess);
  const hasPolyGriftAccess = useGameStore((s) => s.hasPolyGriftAccess);
  const hasCronyUnlocksAccess = useGameStore((s) => s.hasCronyUnlocksAccess);
  const hasTariffAccess = useGameStore((s) => s.hasTariffAccess);
  const hasPrestigeAccess = useGameStore((s) => s.hasPrestigeAccess);
  const activeLeftTab = useGameStore((s) => s.activeLeftTab);
  const setActiveLeftTab = useGameStore((s) => s.setActiveLeftTab);

  /* Assembled from primitive subscriptions rather than returned from a single
     selector — a fresh object from a selector re-renders on every store write. */
  const unlockState: UnlockState = {
    phase,
    hasMarketAccess,
    hasRadarAccess,
    hasPolyGriftAccess,
    hasCronyUnlocksAccess,
    hasTariffAccess,
    hasPrestigeAccess,
  };

  const isUnlocked = (id: LeftChannelTab) => isLeftTabUnlocked(id, unlockState);
  const isSealed = !isUnlocked(activeLeftTab);

  return (
    <PaneShell
      /* REDESIGN [B1 — The Terminal Is a CRT]:
         BagHolder Pro is the game's signature surface and it was rendering as
         generic dark stone, identical to the desk it sits next to. Under the
         [Newsprint & Classified] direction the left wing is a phosphor CRT:
         green-on-black with scanlines, so the two wings read as different
         MATERIALS (terminal vs classified paperwork) rather than two dark
         rectangles. The right wing keeps `panel`. */
      className="surface-terminal border-phosphor-600/30"
      bodyClassName="p-2.5"
      header={
        <TabStrip
          tabs={TABS.map((t) => ({ ...t, locked: !isUnlocked(t.id) }))}
          activeId={activeLeftTab}
          onSelect={(id) => setActiveLeftTab(id as LeftChannelTab)}
          accent="phosphor"
          /* hint-allow: TabStrip renders the buttons, and each one carries its
             own hint from CHANNEL_PURPOSE inside PaneShell. This call site only
             passes the selection callback down. */
        />
      }
      footer={
        /* PRUNED [0.1]: this hand-rolled its own footer instead of using the
           shared <StatusStrip>, and it carried two labels. `CITADULL HFT FEED`
           was pure decoration — it never changed and described nothing the
           player could act on. `0ms LATENCY` is kept because it is LIVE: it
           flips to CHANNEL SEALED, so it is actually reporting the pane's state.
           One honest readout beats two, and routing it through StatusStrip
           removes the last fork of the pane-footer markup. */
        <StatusStrip
          accent="phosphor"
          icon={<Activity className="w-3 h-3 text-gold-400" aria-hidden />}
          /* INVARIANT: [The Label Names All Three Channels It Hosts]
             This pane hosts Stocks / S.L.O.P. / PolyGrift, so "BAGHOLDER PRO
             FEED" named one of the three. `StatusStrip`'s label is a
             non-interactive readout, so it carries no hint and the
             mislabel would have been permanently unhoverable and unfixable
             from the UI — decoration that is also wrong, which is worse than
             the `CITADULL HFT FEED` it replaced. Counted from TABS so it
             cannot drift when a channel is added. */
          label={`${TABS.length} CHANNELS`}
          right={
            <>
              <Radio className="w-3 h-3 text-phosphor-400 animate-pulse" aria-hidden />
              <span className="text-gold-400 font-bold">{isSealed ? 'CHANNEL SEALED' : '0ms LATENCY'}</span>
            </>
          }
        />
      }
    >
      {isSealed ? (
        /* SEALED: the selected channel's dossier. Never its body. */
        <SealedDossier demand={LEFT_TAB_DEMANDS[activeLeftTab]} accent="phosphor" />
      ) : (
        <>
          {activeLeftTab === 'stocks' && <StocksOptionsTab />}
          {activeLeftTab === 'polygrift' && <PolyGriftTab />}
          {activeLeftTab === 'radar' && <SlopRadarTab />}
        </>
      )}
    </PaneShell>
  );
};
