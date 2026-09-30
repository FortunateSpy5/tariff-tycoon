/**
 * Right Wing: Executive Expansion Pane
 * Hosts multi-channel tabs: [D] D.U.M.P., [U] Crony Unlocks, [T] Tariffs, [C] Caymans Prestige.
 *
 * REDESIGN [The Phantom Wings]:
 * This pane used to FILTER locked tabs out of the strip, so a Phase 1 player saw
 * no tabs at all — just the Situation Room — and the four headline systems the
 * game is named for were unreachable and unnameable. Every channel is now always
 * present; a sealed one renders a SealedDossier instead of its body. See
 * `constants/tabDemands` and [The Seal Is a Promise, Not a Wall].
 *
 * INVARIANT: the locked branch must come BEFORE the tab body. A sealed channel
 * must never mount DumpAgenciesTab / CronyUnlocksTab / BilateralTariffsTab /
 * CaymansPrestigeTab, or its actions would be reachable while sealed.
 */

import React from 'react';
import { Briefcase, Zap } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import type { RightChannelTab } from '../../types/unlocks';
import { isRightTabUnlocked, type UnlockState } from '../../engine/systems/unlockEngine';
import { RIGHT_TAB_DEMANDS } from '../../constants/tabDemands';
import { PaneShell, TabStrip, StatusStrip } from '../ui/PaneShell';
import { SealedDossier } from '../ui/SealedDossier';
import { DumpAgenciesTab } from './tabs/DumpAgenciesTab';
import { CronyUnlocksTab } from './tabs/CronyUnlocksTab';
import { BilateralTariffsTab } from './tabs/BilateralTariffsTab';
import { CaymansPrestigeTab } from './tabs/CaymansPrestigeTab';
import { SituationRoom } from './SituationRoom';
import { readPhaseProgress } from './readPhaseProgress';

/* `short` is what each tab falls back to when the strip is too narrow for the
   full label. The right deck is 3/12 of a 1720px cockpit and packs five channels,
   so four of these five genuinely run short at 1080p. See [A Truncated Tab Name
   Is A Feature Nobody Asked For] in `PaneShell` for how the thresholds were
   measured.

   Every short form is bounded by the widest `short` in the strip, which is
   `TARIFF` at 53 layout px — `CAYMN` is 43, so it fits the band with slack, while
   `CAYMANS` at 61 would not have and would have clipped in exactly the narrow
   band it exists to serve. A prestige channel called `CAYMNS` also stops being
   the word the run summary and the reset modal both use for it; `CAYMN` is the
   abbreviation the player's own keyboard shortcuts already teach. */
const TABS: { id: RightChannelTab; label: string; short: string; shortcut: string }[] = [
  { id: 'brief', label: 'BRIEF', short: 'BRIEF', shortcut: 'B' },
  { id: 'dump', label: 'D.U.M.P.', short: 'DUMP', shortcut: 'D' },
  { id: 'unlocks', label: 'UNLOCKS', short: 'CRONY', shortcut: 'U' },
  { id: 'tariffs', label: 'TARIFFS', short: 'TARIFF', shortcut: 'T' },
  { id: 'caymans', label: 'CAYMANS', short: 'CAYMN', shortcut: 'C' },
];

export const ExecutiveExpansionPane: React.FC = () => {
  const phase = useGameStore((s) => s.phase);
  const hasMarketAccess = useGameStore((s) => s.hasMarketAccess);
  const treasuryCash = useGameStore((s) => s.treasuryCash);
  const activeRightTab = useGameStore((s) => s.activeRightTab);
  const setActiveRightTab = useGameStore((s) => s.setActiveRightTab);

  /* Seal state comes from `unlockEngine`, the single source of truth. The
     previous version re-derived each tab's availability with its own inline
     condition, which is exactly the drift that module exists to prevent.
     Subscribed as individual primitives and assembled into the UnlockState
     shape deliberately: returning a fresh object straight from a selector
     re-renders on every store write. */
  const hasRadarAccess = useGameStore((s) => s.hasRadarAccess);
  const hasPolyGriftAccess = useGameStore((s) => s.hasPolyGriftAccess);
  const hasCronyUnlocksAccess = useGameStore((s) => s.hasCronyUnlocksAccess);
  const hasTariffAccess = useGameStore((s) => s.hasTariffAccess);
  const hasPrestigeAccess = useGameStore((s) => s.hasPrestigeAccess);

  const unlockState: UnlockState = {
    phase,
    hasMarketAccess,
    hasRadarAccess,
    hasPolyGriftAccess,
    hasCronyUnlocksAccess,
    hasTariffAccess,
    hasPrestigeAccess,
  };

  const isUnlocked = (id: RightChannelTab) => isRightTabUnlocked(id, unlockState);
  const isSealed = !isUnlocked(activeRightTab);

  return (
    <PaneShell
      header={
        <TabStrip
          tabs={TABS.map((t) => ({ ...t, locked: !isUnlocked(t.id) }))}
          activeId={activeRightTab}
          onSelect={(id) => setActiveRightTab(id as RightChannelTab)}
          accent="gold"
          /* hint-allow: TabStrip renders the buttons, and each one carries its
             own hint from CHANNEL_PURPOSE inside PaneShell. This call site only
             passes the selection callback down. */
        />
      }
      footer={
        /* REPLACED [0.1]: this read `CABINET GOVERNANCE` / `READY`. `READY` was
           the only variable and it never changed — the strip told the player
           nothing, in the one place that is permanently on screen. It is now the
           one number that is never visible anywhere else and always matters:
           how far the treasury is from the next rung. See `readPhaseProgress`. */
        <StatusStrip
          icon={<Briefcase className="w-3 h-3 text-accent-ink" aria-hidden />}
          label="CABINET"
          right={
            <>
              <Zap className="w-3 h-3 text-ink-2" aria-hidden />
              <span className="text-accent-ink font-bold">{readPhaseProgress(phase, treasuryCash)}</span>
            </>
          }
        />
      }
    >
      {/* INVARIANT ORDER: 'brief' is never sealed, so it is checked first. The
          sealed branch then precedes every tab body, so a sealed channel can
          never mount its actions. */}
      {activeRightTab === 'brief' ? (
        <SituationRoom />
      ) : isSealed ? (
        /* SEALED: the demand card, never the body. It is shown even before the
            first stamp slam — a player who clicks TARIFFS on turn one should see
            "buy your first lobbying upgrade", not a first-slam card they did not
            ask for. */
        <SealedDossier demand={RIGHT_TAB_DEMANDS[activeRightTab]} accent="gold" />
      ) : (
        <>
          {activeRightTab === 'dump' && <DumpAgenciesTab />}
          {activeRightTab === 'unlocks' && <CronyUnlocksTab />}
          {activeRightTab === 'tariffs' && <BilateralTariffsTab />}
          {activeRightTab === 'caymans' && <CaymansPrestigeTab />}
        </>
      )}
    </PaneShell>
  );
};
