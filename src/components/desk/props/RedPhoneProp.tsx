/**
 * THE CRISIS CALL — Red Rotary Phone Dial
 *
 * Phase 1's dedicated interactive mechanic. The Red Phone is no longer a
 * dead-on-arrival "$10 bailout" prop (it required cash < $10 while the player
 * starts at $100, so it could never fire). It is now a wager dial:
 *
 *   - A crisis spawns on a timer and the phone RINGS.
 *   - The crisis escalates through 5 severity tiers over 30 seconds.
 *   - SWEAR IN answers it now: small payout, low S.L.O.P. heat, some tantrum.
 *   - IGNORE lets it ring out: no payout, no heat, no tantrum.
 *   - Doing nothing resolves it as SUPPRESSED with the same terms as IGNORE.
 *
 * The old `treasuryCash < $10` bailout is preserved on the standby face so the
 * bankruptcy floor still has a manual escape hatch.
 */

import React from 'react';
import { Phone, PhoneCall, PhoneOff } from 'lucide-react';
import { useGameStore } from '../../../store/useGameStore';
import { formatCurrency } from '../../../engine/math/bigNumber';
import {
  CRISIS_BOOK,
  CRISIS_TIER_MULTIPLIERS,
  crisisBasePayoutForPhase,
  crisisTierForElapsed,
  secondsToNextTier,
} from '../../../constants/crisis';

const SEVERITY_STYLE: Record<string, string> = {
  WHISPER: 'text-stone-400 border-stone-600',
  CONCERN: 'text-amber-300 border-amber-500',
  PROTEST: 'text-orange-400 border-orange-500',
  EMERGENCY: 'text-red-400 border-red-500',
  'CIVIL WAR': 'text-red-200 border-red-300 bg-red-900/60',
};

export const RedPhoneProp: React.FC = () => {
  const phase = useGameStore((s) => s.phase);
  const treasuryCash = useGameStore((s) => s.treasuryCash);
  const activeCrisis = useGameStore((s) => s.activeCrisis);
  const crisisCooldownSeconds = useGameStore((s) => s.crisisCooldownSeconds);
  const swearInCrisis = useGameStore((s) => s.swearInCrisis);
  const suppressCrisis = useGameStore((s) => s.suppressCrisis);
  const triggerRedPhoneBailout = useGameStore((s) => s.triggerRedPhoneBailout);

  const isBroke = treasuryCash < 10;

  // --- Standby: the phone is quiet ---
  if (!activeCrisis) {
    const nextIn = Math.max(0, Math.ceil(crisisCooldownSeconds));
    return (
      <button
        onClick={() => {
          if (isBroke) triggerRedPhoneBailout();
        }}
        title={
          isBroke
            ? 'EMERGENCY BAILOUT: bill Sovereign Detail for golf cart rentals'
            : `Standby. Next 3:00 AM call in ${nextIn}s.`
        }
        className={`p-2 rounded-lg border transition-all flex items-center gap-2 text-left cursor-pointer group relative overflow-hidden select-none ${
          isBroke
            ? 'bg-red-950/80 border-red-600 text-red-200 animate-ring shadow-lg shadow-red-950/50'
            : 'bg-stone-950/90 border-stone-800 text-stone-400 hover:border-red-900/60'
        }`}
      >
        <div className={`p-1.5 rounded-md shrink-0 ${isBroke ? 'bg-red-600 text-stone-950' : 'bg-stone-900 text-red-500'}`}>
          {isBroke ? <PhoneCall className="w-4 h-4 animate-bounce" /> : <Phone className="w-4 h-4" />}
        </div>
        <div className="min-w-0">
          <span className="font-mono font-bold t-micro block text-red-400 group-hover:text-red-300">
            CRISIS CALL
          </span>
          <span className="t-micro text-stone-500 font-mono block truncate">
            {isBroke ? 'BAILOUT AVAILABLE' : `Standby · next in ${nextIn}s`}
          </span>
        </div>
      </button>
    );
  }

  // --- Ringing: a live crisis awaiting a decision ---
  const def = CRISIS_BOOK.find((c) => c.id === activeCrisis.id);
  const tier = crisisTierForElapsed(activeCrisis.elapsedSeconds);
  const tierDef = def?.tiers[tier];
  const base = crisisBasePayoutForPhase(phase);
  const nowPayout = Math.round(base * CRISIS_TIER_MULTIPLIERS[tier]);
  const maxPayout = Math.round(base * CRISIS_TIER_MULTIPLIERS[CRISIS_TIER_MULTIPLIERS.length - 1]);
  const toNext = secondsToNextTier(activeCrisis.elapsedSeconds);
  const isMaxTier = tier >= CRISIS_TIER_MULTIPLIERS.length - 1;

  return (
    <div
      className={`p-2 rounded-lg border-2 bg-red-950/70 flex flex-col gap-1.5 relative overflow-hidden select-none shadow-lg shadow-red-950/50 ${
        isMaxTier ? 'border-red-300 animate-ring' : 'border-red-600'
      }`}
    >
      <div className="flex items-start gap-2">
        <div className="p-1.5 rounded-md bg-red-600 text-stone-950 shrink-0">
          <PhoneCall className="w-4 h-4 animate-bounce" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="font-mono font-bold t-micro text-red-300 shrink-0">3:00 AM CALL</span>
            <span
              className={`t-caption font-mono px-1 rounded border shrink-0 ${SEVERITY_STYLE[tierDef?.severity ?? 'WHISPER']}`}
            >
              {tierDef?.severity}
            </span>
          </div>
          <span className="t-micro text-red-100/90 font-sans block leading-tight line-clamp-2">
            {tierDef?.headline}
          </span>
        </div>
      </div>

      {/* Escalation ladder — visualises the wager the player is making */}
      <div className="flex gap-0.5" aria-hidden="true">
        {CRISIS_TIER_MULTIPLIERS.map((m, i) => (
          <div
            key={m}
            className={`h-1 flex-1 rounded-full transition-colors ${i <= tier ? 'bg-red-400' : 'bg-red-950/80'}`}
          />
        ))}
      </div>

      <div className="flex items-center justify-between gap-1">
        <span className="t-micro font-mono text-stone-300 shrink-0">
          {isMaxTier ? 'MAX' : `+${CRISIS_TIER_MULTIPLIERS[tier + 1]}x in ${toNext}s`}
        </span>
        <button
          onClick={swearInCrisis}
          title={`Answer now for ${formatCurrency(nowPayout)} and low heat. Waiting raises the multiplier but adds S.L.O.P. heat.`}
          className="px-1.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-mono font-black t-micro cursor-pointer active:scale-95 transition-all shrink-0"
        >
          SWEAR IN {formatCurrency(nowPayout)}
        </button>
        <button
          onClick={suppressCrisis}
          title="Issue a statement and move on. No payout, no heat, no tantrum."
          className="px-1.5 py-1 rounded bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 font-mono font-bold t-micro cursor-pointer active:scale-95 transition-all shrink-0 flex items-center gap-0.5"
        >
          <PhoneOff className="w-2.5 h-2.5" />
          <span>IGNORE</span>
        </button>
      </div>

      <span className="t-caption font-mono text-stone-400 leading-none">
        Peak pays {formatCurrency(maxPayout)} · max heat
      </span>
    </div>
  );
};
