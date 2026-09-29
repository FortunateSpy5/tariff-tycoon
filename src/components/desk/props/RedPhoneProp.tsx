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
import { RAID_BRIBE_COST } from '../../../engine/systems/slopEngine';
import { FRENZY_CLICK_MULTIPLIER } from '../../../constants/balance';
import { CRISIS_HEAT_PER_TIER } from '../../../constants/crisis';
import { hint } from '../../ui/hint';
import {
  CRISIS_BOOK,
  CRISIS_TIER_MULTIPLIERS,
  crisisBasePayoutForPhase,
  crisisTierForElapsed,
  secondsToNextTier,
} from '../../../constants/crisis';

const SEVERITY_STYLE: Record<string, string> = {
  WHISPER: 'text-newsprint-300 border-newsprint-700',
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
  //
  // REDESIGN [The Dead Air Next To The Phone]:
  // The prop tray is a 2-column grid and this row spans both columns, but the
  // standby face was a shrink-to-fit button — 169px of content in a 562px row,
  // leaving ~400px of dead panel to the right of it. The row was reserved for a
  // card that expands dramatically while ringing, so the gap read as a layout
  // bug rather than as breathing room.
  //
  // The standby face now FILLS the row and uses it: it previews the wager
  // (the escalation ladder, unlit) alongside what the call is worth, so the
  // player can read the stakes before the phone ever rings. The space is now
  // doing the mechanic's teaching work instead of sitting empty.
  //
  // A11y note: this is a `<div>`, not a `<button>`, unless the player is
  // actually broke. The old version was a button that did nothing 99% of the
  // time — a dead click target that advertised an affordance it did not have.
  if (!activeCrisis) {
    const nextIn = Math.max(0, Math.ceil(crisisCooldownSeconds));
    const base = crisisBasePayoutForPhase(phase);
    const peak = Math.round(base * CRISIS_TIER_MULTIPLIERS[CRISIS_TIER_MULTIPLIERS.length - 1]);

    const body = (
      <>
        <div
          className={`p-1.5 rounded-md shrink-0 ${
            isBroke ? 'bg-wax-500 text-newsprint-50' : 'bg-newsprint-800 text-wax-400'
          }`}
        >
          {/* The handset rattles, not the row — see `crisis-ring` in index.css. */}
          {isBroke ? (
            <PhoneCall className="w-4 h-4 animate-crisis-ring" />
          ) : (
            <Phone className="w-4 h-4" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <span className="font-mono font-bold t-micro block text-red-400">CRISIS CALL</span>
          <span className="t-micro text-stone-500 font-mono block truncate">
            {isBroke ? 'BAILOUT AVAILABLE' : `Standby · next in ${nextIn}s`}
          </span>
        </div>

        {/* The wager, previewed. Only on the calm path — a broken player needs
            one loud instruction, not a payout table they cannot act on. */}
        {!isBroke && (
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex gap-0.5 w-16" aria-hidden="true">
              {CRISIS_TIER_MULTIPLIERS.map((m) => (
                <div key={m} className="h-1 flex-1 rounded-full bg-newsprint-800" />
              ))}
            </div>
            <span className="t-micro font-mono text-newsprint-500 whitespace-nowrap">
              Peak {formatCurrency(peak)}
            </span>
          </div>
        )}
      </>
    );

    const shell = `w-full p-2 rounded-lg border text-left select-none flex items-center gap-2 transition-colors ${
      isBroke
        ? 'bg-red-950/80 border-red-600 text-red-200 animate-crisis-alarm'
        : 'bg-newsprint-900 border-newsprint-800 text-newsprint-300'
    }`;

    return isBroke ? (
      <button
        onClick={triggerRedPhoneBailout}
        {...hint(
          `EMERGENCY BAILOUT: bill the Sovereign Detail for golf cart rentals. Unlocked only below $10 — you hold ${formatCurrency(
            treasuryCash
          )}. This is the bankruptcy floor, not a faucet, and it pays nothing in S.L.O.P. heat.`
        )}
        className={`${shell} cursor-pointer group hover:border-red-400`}
      >
        {body}
      </button>
    ) : (
      /* No ARIA live region here. The countdown text changes every second, and
         `role="status"` implies `aria-live="polite"` — which would announce a
         new number to a screen reader once a second for the entire session.
         The face is static prose plus a timer, so it is marked up as plain
         content and left out of the accessibility tree's announcement queue. */
      <div className={shell}>
        {body}
      </div>
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
    /* INVARIANT: this card carries no shake of its own. It holds the two buttons
       the whole mechanic exists to offer, so it must never move under the
       cursor. Urgency lives on the handset icon (a ~16px rattle) and, at max
       tier, in a halo. The previous `animate-ring` rotated this entire panel
       +/-10deg at 0.4s, which displaced SWEAR IN and IGNORE continuously. */
    <div
      className={`p-2 rounded-lg border-2 bg-red-950/70 flex flex-col gap-1.5 relative overflow-hidden select-none shadow-lg shadow-red-950/50 ${
        isMaxTier ? 'border-red-300 animate-crisis-alarm' : 'border-red-600'
      }`}
    >
      <div className="flex items-start gap-2">
        <div className="p-1.5 rounded-md bg-red-600 text-stone-950 shrink-0">
          {/* Was `animate-bounce`, which compounded with the card's own ring into
              a judder. The rattle is the whole signal; bounce was redundant. */}
          <PhoneCall className="w-4 h-4 animate-crisis-ring" />
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
        <span className="t-micro font-mono text-newsprint-200 shrink-0">
          {isMaxTier ? 'MAX' : `+${CRISIS_TIER_MULTIPLIERS[tier + 1]}x in ${toNext}s`}
        </span>
        <button
          onClick={swearInCrisis}
          {...hint(
            // INVARIANT: [Heat Is Charged At Resolution, Not By Waiting] — an
            // earlier draft said "every second you wait ... adds retaliatory
            // S.L.O.P. heat". It does not: `swearInCrisis` applies
            // `CRISIS_HEAT_PER_TIER * (tier+1)` once, at the tier you answer
            // at, and `suppressCrisis` charges nothing. As written, the tooltip
            // implied that idling on a ringing phone was itself dangerous.
            `Answer now for ${formatCurrency(nowPayout)} at ${tierDef?.severity} severity, with low heat. The ladder above climbs to ${formatCurrency(
              maxPayout
            )} — but each tier you let it climb costs another ${CRISIS_HEAT_PER_TIER} heat if you answer, and the tantrum is forfeited outright if you let it ring out. Ignore it instead and it costs you nothing but the meter.`,
          )}
          className="px-1.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-mono font-black t-micro cursor-pointer active:scale-95 transition-all shrink-0"
        >
          SWEAR IN {formatCurrency(nowPayout)}
        </button>
        <button
          onClick={suppressCrisis}
          {...hint(
            `Issue a statement and move on. No payout, no heat — and no tantrum, which is the real cost: the meter you were saving toward a ${FRENZY_CLICK_MULTIPLIER}x FRENZY does not move at all. Doing nothing resolves it the same way.`
          )}
          className="px-1.5 py-1 rounded bg-newsprint-800 hover:bg-newsprint-700 border border-newsprint-700 text-newsprint-200 font-mono font-bold t-micro cursor-pointer active:scale-95 transition-all shrink-0 flex items-center gap-0.5"
        >
          <PhoneOff className="w-2.5 h-2.5" />
          <span>IGNORE</span>
        </button>
      </div>

      <span className="t-caption font-mono text-newsprint-300 leading-none">
        Peak pays {formatCurrency(maxPayout)} · max heat
        {` · a raid auto-bribe costs ${RAID_BRIBE_COST} Favor`}
      </span>
    </div>
  );
};
