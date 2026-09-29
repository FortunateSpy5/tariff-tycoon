/**
 * Subpoena Paper Shredder Prop
 * Sits on the desk blotter; purges incriminating trade slips to shed S.L.O.P.
 * regulatory suspicion.
 *
 * DESIGN RATIONALE [The Prop That Lied By Existing]:
 * `canShredSubpoenas` requires `phase >= 2` — the shredder is an Oval Office
 * instrument. But this component rendered from turn one and never checked the
 * phase, so the player was shown a fully-styled, enabled control that silently
 * did nothing for their entire first session. Pressing it hit the phase guard
 * in `deskPropsSlice` and returned false, which the old component then reported
 * as "COOLDOWN ACTIVE" — the wrong reason, in a control that was not on a
 * cooldown at all.
 *
 * Per [The Seal Is a Promise, Not A Wall]: an unlockable thing must be visible
 * and named, but must not look operable before it is. So below Phase 2 this
 * renders the SAME prop in a sealed treatment that states what opens it, rather
 * than hiding it. A hidden prop teaches nothing; a sealed one is a promise.
 *
 * INVARIANT: the sealed face must not be a button. Nothing here is operable
 * until the Oval Office opens.
 */

import React, { useEffect, useState } from 'react';
import { FileX2, AlertTriangle, Lock } from 'lucide-react';
import { useGameStore } from '../../../store/useGameStore';
import { PHASE_CASH_THRESHOLDS } from '../../../engine/systems/phaseEngine';
import { RAID_BRIBE_COST, SLOP_DECAY_PER_SECOND } from '../../../engine/systems/slopEngine';
import { CRONY_FAVOR_PASSIVE_PER_SECOND } from '../../../constants/balance';
import { formatCurrency } from '../../../engine/math/bigNumber';
import { hint } from '../../ui/hint';
// INVARIANT: imported, not re-typed. These were locals with a "mirrors" comment,
// which is a lie waiting for a balance pass — see deskPropsSlice.
import {
  SHRED_COOLDOWN_SECONDS as COOLDOWN_SECONDS,
  SHRED_FAVOR_COST as FAVOR_COST,
  SHRED_HEAT_RELIEF as HEAT_RELIEF,
} from '../../../store/slices/deskPropsSlice';

export const SubpoenaShredderProp: React.FC = () => {
  const isHighHeat = useGameStore((s) => s.slopSuspicion > 70);
  const cronyFavor = useGameStore((s) => s.cronyFavor);
  const phase = useGameStore((s) => s.phase);
  const shredSubpoenas = useGameStore((s) => s.shredSubpoenas);
  const lastShredTimestamp = useGameStore((s) => s.lastShredTimestamp);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(0);

  // INVARIANT: [One Source Of Truth For The Cooldown]
  // This used to keep a LOCAL 5s timer. That desynced two ways: a reload
  // mid-cooldown left the label reading "PURGE HEAT NOW!" while the store
  // rejected the click, and the `[S]` hotkey — which calls the store directly —
  // could shred with the prop still showing no cooldown at all. Two surfaces,
  // two truths, one of them wrong. `SlopRadarTab` already derived it from
  // `lastShredTimestamp`; so does the Gold Box. All three now agree.
  useEffect(() => {
    const tick = () => {
      const elapsed = (Date.now() - (lastShredTimestamp || 0)) / 1000;
      setRemaining(Math.max(0, Math.ceil(COOLDOWN_SECONDS - elapsed)));
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [lastShredTimestamp]);

  if (phase < 2) {
    return (
      <div
        {...hint(
          `SEALED. The Subpoena Shredder is an Oval Office instrument, not a customs one. To open: hold ${formatCurrency(
            PHASE_CASH_THRESHOLDS[2] ?? 0
          )} in the treasury. Until then heat only bleeds off at ${SLOP_DECAY_PER_SECOND}%/s, and a raid lands on you anyway — the auto-bribe costs ${RAID_BRIBE_COST} Favor, and the shredder that would pull it back is still ${formatCurrency(
            PHASE_CASH_THRESHOLDS[2] ?? 0
          )} away.`,
          'Subpoena Shredder — sealed'
        )}
        className="p-2 rounded-lg border border-dashed border-newsprint-400 bg-newsprint-200/50 text-newsprint-800 flex items-center gap-2 text-left select-none"
      >
        <div className="p-1.5 rounded-md bg-newsprint-300/60 text-newsprint-700 shrink-0">
          <Lock className="w-4 h-4" aria-hidden />
        </div>
        <div>
          <span className="font-mono font-bold t-micro block text-newsprint-700">SHREDDER</span>
          <span className="t-caption font-mono block">Sealed — Oval Office instrument</span>
        </div>
      </div>
    );
  }

  const onCooldown = remaining > 0;
  const handleClick = () => {
    if (onCooldown) {
      setFeedback(`COOLING DOWN (${remaining}s)`);
      setTimeout(() => setFeedback(null), 1200);
      return;
    }
    if (cronyFavor < FAVOR_COST) {
      setFeedback(`NEED ${FAVOR_COST} FAVOR`);
      setTimeout(() => setFeedback(null), 1500);
      return;
    }
    // INVARIANT: never fail silently. If the store refuses, say why — a bare
    // return leaves the player staring at a live-looking button that does
    // nothing, which is the exact defect this prop was rewritten to remove.
    if (!shredSubpoenas()) {
      setFeedback('RELOADING PAPER…');
      setTimeout(() => setFeedback(null), 1200);
      return;
    }
    setFeedback(`WHIRRR! -${HEAT_RELIEF}% HEAT (-${FAVOR_COST} FAVOR)`);
    setTimeout(() => setFeedback(null), 2000);
  };

  const hasEnoughFavor = cronyFavor >= FAVOR_COST;
  const isLive = hasEnoughFavor && !onCooldown;

  return (
    <button
      onClick={handleClick}
      aria-disabled={!isLive}
      {...hint(
        onCooldown
          ? `Rewinding — ${remaining}s. The last sheet is still going through. ${COOLDOWN_SECONDS}s between burns, and the [S] hotkey obeys the same clock, so this stays in step whether you use the button or the key.`
          : !hasEnoughFavor
          ? `Burn subpoena paperwork: −${HEAT_RELIEF}% suspicion for ${FAVOR_COST} Crony Favor, ${COOLDOWN_SECONDS}s cooldown. You hold ${Math.floor(
              cronyFavor
            )} — favor only trickles in at ${CRONY_FAVOR_PASSIVE_PER_SECOND}/s, so this is a save it for a real raid, not a habit.`
          : `Burn subpoena paperwork: −${HEAT_RELIEF}% suspicion for ${FAVOR_COST} Crony Favor, ${COOLDOWN_SECONDS}s cooldown. A raid auto-bribe costs ${RAID_BRIBE_COST} favor, so five shreds buy back exactly one raid. Heat relief is capped at zero.`,
        'Subpoena Shredder — purge suspicion'
      )}
      className={`p-2 rounded-lg border transition-all flex items-center gap-2 text-left select-none group relative overflow-hidden active:scale-95 ${
        !isLive
          ? 'opacity-60 cursor-not-allowed bg-newsprint-300 border-newsprint-400 text-newsprint-800'
          : 'cursor-pointer ' +
            (isHighHeat
              ? 'bg-amber-950/80 border-amber-500/80 text-amber-200 shadow-md shadow-amber-950/40'
              : 'bg-newsprint-900 border-newsprint-800 text-newsprint-300 hover:border-emerald-600/60')
      }`}
    >
      <div
        className={`p-1.5 rounded-md shrink-0 ${
          isHighHeat ? 'bg-gold-500 text-newsprint-950 animate-calm-glow' : 'bg-newsprint-800 text-emerald-500'
        }`}
      >
        {isHighHeat ? (
          <AlertTriangle className="w-4 h-4" aria-hidden />
        ) : (
          <FileX2 className="w-4 h-4" aria-hidden />
        )}
      </div>
      <div>
        <span
          className={`font-mono font-bold t-micro block ${
            isHighHeat ? 'text-amber-400' : 'text-emerald-400'
          }`}
        >
          SHREDDER
        </span>
        <span className="t-caption text-stone-500 font-mono block">
          {!hasEnoughFavor
            ? `Need ${FAVOR_COST} Favor [S]`
            : onCooldown
            ? `Rewinding (${remaining}s)`
            : isHighHeat
            ? 'PURGE HEAT NOW!'
            : `-${HEAT_RELIEF}% (${FAVOR_COST} FAVOR) [S]`}
        </span>
      </div>

      {feedback && (
        <div className="absolute inset-0 bg-newsprint-950 flex items-center justify-center t-micro font-mono font-bold text-emerald-400 px-1 text-center">
          {feedback}
        </div>
      )}
    </button>
  );
};
