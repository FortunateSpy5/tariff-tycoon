/**
 * SealedDossier — the body rendered in place of a channel the player has not
 * unlocked yet.
 *
 * DESIGN RATIONALE [The Phantom Wings]:
 * A locked cockpit channel used to be filtered out of the tab strip entirely, so
 * the right wing had no tabs at all during Phase 1 and the systems the game is
 * named for were named only in a Career Objectives list with no way to inspect
 * them. This component is what a locked channel renders INSTEAD of its real
 * body: a redacted dossier naming the event that opens the channel, a progress
 * bar where the gate is a number, and a one-line teaser of what is behind the
 * door.
 *
 * INVARIANT: [The Seal Is a Promise, Not a Wall]
 * Selecting a sealed channel must be free and reversible, and it must never
 * mount the channel's real body — otherwise a locked channel would be a place
 * where actions live. The panes enforce this by branching on the lock state
 * before they render tab content; this component is only ever mounted in the
 * sealed branch. It intentionally exposes no callbacks that mutate the store.
 *
 * INVARIANT: only `demand.progress` supplies a bar. Event gates (first YAP,
 * first liquidation) have no honest 0-1 reading, and a fake bar that sits at 0%
 * forever is worse than no bar.
 */

import React from 'react';
import { Lock, ChevronRight } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import { formatCurrency } from '../../engine/math/bigNumber';
import type { TabDemand } from '../../constants/tabDemands';
import { Card } from './Card';

export const SealedDossier: React.FC<{
  demand: TabDemand;
  /** Accent for the seal header: gold for the right deck, phosphor for the CRT. */
  accent?: 'gold' | 'phosphor';
}> = ({ demand, accent = 'gold' }) => {
  const treasuryCash = useGameStore((s) => s.treasuryCash);

  const reading = demand.progress?.({ treasuryCash });
  const pct = reading
    ? Math.min(100, Math.max(0, (reading.current / reading.target) * 100))
    : null;

  const sealText = accent === 'gold' ? 'text-gold-500' : 'text-phosphor-400';
  const barFill = accent === 'gold' ? 'bg-gold-500' : 'bg-phosphor-500';

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-2 overflow-y-auto custom-scrollbar">
      <Card material="classified" className="shrink-0">
        <div className="flex items-center gap-2">
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
              accent === 'gold' ? 'border-gold-600/50 bg-gold-900/40' : 'border-phosphor-600/50 bg-phosphor-900/40'
            }`}
          >
            <Lock className={`h-4 w-4 ${sealText}`} />
          </div>
          <div className="min-w-0 flex-1">
            <div className={`t-micro font-black tracking-widest uppercase ${sealText}`}>
              Channel Sealed
            </div>
            <div className="t-caption font-bold uppercase truncate text-newsprint-200">
              {demand.title}
            </div>
          </div>
        </div>
      </Card>

      {/* The demand — the one action that opens this channel. */}
      <Card material="panel" className="shrink-0">
        <div className="t-micro font-bold tracking-widest uppercase text-newsprint-400 mb-1">
          To Open
        </div>
        <p className="t-body text-gold-300 leading-snug flex items-start gap-1.5">
          <ChevronRight className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>{demand.requirement}</span>
        </p>

        {reading && pct !== null && (
          <>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-newsprint-800">
              <div
                className={`h-full rounded-full transition-[width] duration-500 ${barFill}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="mt-1 flex justify-between t-micro font-mono text-newsprint-400">
              <span>{formatCurrency(reading.current)}</span>
              <span>{formatCurrency(reading.target)}</span>
            </div>
          </>
        )}
      </Card>

      {/* The teaser — what is behind the door. This is the retention hook. */}
      <Card material="panel" className="shrink-0">
        <div className="t-micro font-bold tracking-widest uppercase text-newsprint-400 mb-1">
          Inside
        </div>
        <p className="t-caption text-newsprint-300 leading-relaxed">{demand.teaser}</p>
      </Card>
    </div>
  );
};
