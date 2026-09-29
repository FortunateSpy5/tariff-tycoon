/**
 * S.L.O.P. Radar Tab
 * Tracks regulatory heat, grand jury countdowns, and crony auditor bribes.
 */

import React, { useEffect, useState } from 'react';
import { ShieldAlert, Award, FileX2 } from 'lucide-react';
import { useGameStore } from '../../../store/useGameStore';
import { Card } from '../../ui/Card';
import { hint } from '../../ui/hint';
import { RAID_BRIBE_COST, SLOP_DECAY_PER_SECOND } from '../../../engine/systems/slopEngine';
import { CRONY_FAVOR_PASSIVE_PER_SECOND, CRONY_FAVOR_PER_YAP } from '../../../constants/balance';

/** Crony Favor burned per shred. Mirrors `SHRED_FAVOR_COST` in `deskPropsSlice`. */
const SHRED_FAVOR_COST = 10;

/** Heat points a shred removes. Mirrors `SHRED_HEAT_RELIEF` in `deskPropsSlice`. */
const SHRED_HEAT_RELIEF = 25;

/** Crony Favor per inquest-lead bribe. Mirrors the call site in `predictionSlice`. */
const BRIBE_FAVOR_COST = 20;

/** Heat points that bribe removes. Mirrors `predictionSlice`'s 0.8 per favor. */
const BRIBE_HEAT_REDUCTION = 16;

/** Seconds between sheets. Mirrors `SHRED_COOLDOWN_MS` in `deskPropsSlice`. */
const SHRED_COOLDOWN_SECONDS = 5;

/** Why the shredder is currently refusing, or null when it will fire. */
type ShredGate = 'phase' | 'cooldown' | 'favor' | null;

export const SlopRadarTab: React.FC = () => {
  const slopSuspicion = useGameStore((s) => s.slopSuspicion);
  const vexVolatility = useGameStore((s) => s.vexVolatility);
  const cronyFavor = useGameStore((s) => s.cronyFavor);
  const phase = useGameStore((s) => s.phase);
  const lastShredTimestamp = useGameStore((s) => s.lastShredTimestamp);
  const bribeSlopAuditors = useGameStore((s) => s.bribeSlopAuditors);
  const shredSubpoenas = useGameStore((s) => s.shredSubpoenas);

  const isCritical = slopSuspicion >= 75;
  const isDangerous = slopSuspicion >= 50;

  // INVARIANT: [The Radar's Two Defenses Must Both Tell You Why They Are Closed]
  // `shredSubpoenas` returns false on a phase, cooldown, or favor gate and the
  // old button forwarded that call straight to onClick — so a Phase 1 player
  // pressed a live-looking button and got silence. The gate is now derived here,
  // rendered into the label, and enforced again in the handler.
  //
  // INVARIANT: [Gated Controls Use aria-Disabled, Not disabled]
  // A native `disabled` button swallows pointer events in Chromium, which would
  // delete the hover text explaining the very gate that closed it. Both defense
  // buttons are therefore `aria-disabled` plus a handler guard. See HintTooltip.
  const [now, setNow] = useState(() => Date.now());
  const [feedback, setFeedback] = useState<string | null>(null);
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, []);

  const cooldownLeft = Math.max(
    0,
    Math.ceil((lastShredTimestamp + SHRED_COOLDOWN_SECONDS * 1000 - now) / 1000)
  );

  const shredGate: ShredGate =
    phase < 2 ? 'phase' : cooldownLeft > 0 ? 'cooldown' : cronyFavor < SHRED_FAVOR_COST ? 'favor' : null;

  // INVARIANT: [Never Fail Silently] — the bribe handler used to `return` on
  // insufficient favor with no message. Native `disabled` at least made the
  // control unambiguously inert; once converted to `aria-disabled` it became a
  // live button in the tab order that did nothing on activation, which is the
  // exact "silent no-op" defect this phase was chartered to remove. Say the
  // shortfall instead.
  const handleBribe = () => {
    if (cronyFavor < BRIBE_FAVOR_COST) {
      setFeedback(`Short ${BRIBE_FAVOR_COST - Math.floor(cronyFavor)} Crony Favor. The Inquest Lead does not take IOUs.`);
      setTimeout(() => setFeedback(null), 2000);
      return;
    }
    bribeSlopAuditors(BRIBE_FAVOR_COST);
  };

  const handleShred = () => {
    if (shredGate !== null) {
      setFeedback(
        shredGate === 'phase'
          ? 'The shredder is an Oval Office instrument. Not yours yet.'
          : shredGate === 'cooldown'
          ? `Reloading — ${cooldownLeft}s.`
          : `Short ${SHRED_FAVOR_COST - Math.floor(cronyFavor)} Crony Favor. Shredding federal paper is not free.`
      );
      setTimeout(() => setFeedback(null), 2000);
      return;
    }
    if (!shredSubpoenas()) setFeedback('Nothing to shred.');
  };

  const shredLabel =
    shredGate === 'phase'
      ? 'Emergency Shredder — SEALED UNTIL PHASE 2'
      : shredGate === 'cooldown'
      ? `Emergency Shredder — RELOADING ${cooldownLeft}s`
      : shredGate === 'favor'
      ? `Emergency Shredder — NEEDS ${SHRED_FAVOR_COST} FAVOR`
      : `Emergency Shredder (-25% Heat, ${SHRED_FAVOR_COST} Favor) [S]`;

  return (
    <div className="h-full min-h-0 flex flex-col gap-2.5 select-none">
      <div className="shrink-0">
        {/* Header */}
        <div className="flex items-center justify-between t-micro font-mono text-stone-500 border-b border-stone-800 pb-1.5">
          <div className="flex items-center gap-1.5 text-red-400 font-bold">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>S.L.O.P. INQUEST RADAR</span>
          </div>
          <span>Status: {isCritical ? 'CRITICAL' : isDangerous ? 'ELEVATED' : 'DOCILE'}</span>
        </div>
      </div>

      {/* Suspicion Heat Gauge — the hero element, expands to fill spare height */}
      <Card material="term" density="tight" className="flex-1 min-h-0 flex flex-col justify-center gap-3">
        <div className="flex justify-between items-baseline text-xs font-mono">
          <span className="text-phosphor-600">Grand Jury Heat</span>
          <span
            className={`text-2xl font-black tabular-nums tracking-tight ${
              isCritical ? 'text-red-400 animate-pulse' : isDangerous ? 'text-amber-400' : 'text-emerald-400'
            }`}
          >
            {slopSuspicion.toFixed(1)}
            <span className="text-sm text-phosphor-600">%</span>
          </span>
        </div>
        <div className="w-full flex-1 min-h-[56px] surface-terminal-well rounded-lg overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              isCritical
                ? 'bg-gradient-to-r from-amber-500 via-red-500 to-red-600 animate-pulse'
                : 'bg-gradient-to-r from-emerald-500 to-amber-500'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, slopSuspicion))}%` }}
          />
        </div>
        <span className="t-micro text-phosphor-600 font-mono block leading-snug">
          Accumulates on 1,000x trades and state secret sales; decays -0.2%/sec passively.
        </span>
      </Card>

      <div className="shrink-0 space-y-2.5">
        {/* VEX Volatility Metric */}
        <Card material="term" density="tight" className="flex justify-between items-center font-mono t-micro">
          <span className="text-phosphor-600">VEX Volatility Index:</span>
          <span className="text-amber-400 font-bold">{vexVolatility.toFixed(1)} pts</span>
        </Card>

        {/* Tactical Defense Tools */}
        <div className="space-y-1.5">
          <button
            onClick={handleBribe}
            aria-disabled={cronyFavor < BRIBE_FAVOR_COST}
            {...hint(
              cronyFavor < BRIBE_FAVOR_COST
                ? `Short ${BRIBE_FAVOR_COST - Math.floor(cronyFavor)} Crony Favor. ${BRIBE_FAVOR_COST} buys ${BRIBE_HEAT_REDUCTION} points of heat — 0.8 per favor, the expensive rate. Favor only trickles in at ${CRONY_FAVOR_PASSIVE_PER_SECOND}/s, plus ${CRONY_FAVOR_PER_YAP} per YAP, so this is ${Math.round(
                    BRIBE_FAVOR_COST / CRONY_FAVOR_PER_YAP
                  )} YAPs away. The shredder below is over three times as efficient if you can spare the smaller sum.`
                : `Spends ${BRIBE_FAVOR_COST} Crony Favor to strike ${BRIBE_HEAT_REDUCTION} points of heat — 0.8 per favor, the expensive rate. Favor trickles in at ${CRONY_FAVOR_PASSIVE_PER_SECOND}/s plus ${CRONY_FAVOR_PER_YAP} per YAP, so this is ${Math.round(
                    BRIBE_FAVOR_COST / CRONY_FAVOR_PER_YAP
                  )} YAPs. An auto-bribe at 100% heat costs ${RAID_BRIBE_COST} — two and a half of these. Heat also bleeds off ${SLOP_DECAY_PER_SECOND}%/s, so ${BRIBE_HEAT_REDUCTION} points clears itself in ${Math.round(
                    BRIBE_HEAT_REDUCTION / SLOP_DECAY_PER_SECOND
                  )}s if you can afford to wait.`
            )}
            className={`w-full py-2 rounded-lg font-mono t-micro font-bold flex items-center justify-center gap-1.5 transition-all ${
              cronyFavor >= BRIBE_FAVOR_COST
                ? 'bg-gold-500 hover:bg-gold-400 text-redaction-700 shadow-md active:scale-95 cursor-pointer'
                : 'bg-phosphor-900 text-phosphor-600 cursor-not-allowed'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Bribe Inquest Lead (Costs {BRIBE_FAVOR_COST} Favor // -{BRIBE_HEAT_REDUCTION}% Heat)</span>
          </button>

          <button
            onClick={handleShred}
            aria-disabled={shredGate !== null}
            {...hint(
              shredGate === 'phase'
                ? `SEALED. The shredder is an Oval Office instrument, not a customs one — in Phase 1 this key does nothing at all. Once unlocked: ${SHRED_HEAT_RELIEF} points of heat for ${SHRED_FAVOR_COST} favor, which is ${(
                    SHRED_HEAT_RELIEF / SHRED_FAVOR_COST
                  ).toFixed(1)} heat per favor and over three times as efficient as the bribe above.`
                : shredGate === 'cooldown'
                ? `Reload. Five seconds between sheets — the mechanism cannot take another subpoena until the tray clears.`
                : shredGate === 'favor'
                ? `Short ${SHRED_FAVOR_COST - Math.floor(cronyFavor)} Crony Favor. Shredding federal paper is a political expense, not a free eraser.`
                : `Strips ${SHRED_HEAT_RELIEF} points of heat for ${SHRED_FAVOR_COST} favor and a 5-second cooldown — ${(
                    SHRED_HEAT_RELIEF / SHRED_FAVOR_COST
                  ).toFixed(1)} heat per favor, over three times the bribe rate. At 100% heat one sheet is the entire defence; the ${RAID_BRIBE_COST}-favor raid bribe is what you spend when you cannot afford ${SHRED_FAVOR_COST}. Heat cannot fall below zero, so shredding at 3% heat burns the favor for nothing. Same action as the [S] hotkey.`
            )}
            className={`w-full py-2 rounded-lg font-mono t-micro font-bold flex items-center justify-center gap-1.5 transition-all ${
              shredGate === null
                ? 'surface-terminal-well hover:border-emerald-600/80 text-phosphor-400 active:scale-95 cursor-pointer'
                : 'surface-terminal-well text-phosphor-600 cursor-not-allowed opacity-70'
            }`}
          >
            <FileX2 className="w-3.5 h-3.5" />
            <span>{shredLabel}</span>
          </button>
        </div>

        {/* INVARIANT: [A Rejected Action Must Say Why] — a live region, so a
            screen reader announces the refusal as well as sighted players seeing
            the strip. Without it the two converted `aria-disabled` buttons were
            focusable and activatable but produced nothing at all. */}
        {feedback && (
          <div
            role="status"
            aria-live="polite"
            className="p-1.5 rounded bg-amber-500/15 border border-amber-600/40 t-micro font-mono font-bold text-amber-300"
          >
            {feedback}
          </div>
        )}

        <div className="p-2 surface-terminal-well rounded t-micro text-phosphor-600 italic">
          "Special Counsel audits trigger full asset freezes at 100% heat unless averted via bribes or document shredding."
        </div>
      </div>
    </div>
  );
};
