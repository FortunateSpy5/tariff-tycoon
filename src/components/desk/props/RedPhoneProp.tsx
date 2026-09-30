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
import { isBrokeNotInDebt } from '../../../store/slices/deskPropsSlice';
import { FRENZY_CLICK_MULTIPLIER } from '../../../constants/balance';
import { CRISIS_HEAT_PER_TIER } from '../../../constants/crisis';
import { hint } from '../../ui/hint';
import {
  CRISIS_BOOK,
  CRISIS_TIER_MULTIPLIERS,
  CRISIS_WINDOW_SECONDS,
  crisisBasePayoutForPhase,
  crisisTierForElapsed,
  secondsToNextTier,
} from '../../../constants/crisis';

/**
 * ISSUE-010 + a contrast repair. The severity ladder was five STOCK Tailwind
 * colours (`orange-400`, `red-200`, `bg-red-900`) painted onto a DARK crisis
 * card, and two of its five rungs were warm-PAPER inks — `text-accent-ink` is
 * #70490c, a tobacco brown, and on `bg-ink-1/70` that is about 1.7:1. Half the
 * ladder was unreadable on the surface it was drawn for.
 *
 * The ramp is rebuilt on the four sanctioned families, and it escalates by FILL
 * and WEIGHT rather than by hue, because the palette has exactly two warm/alarm
 * steps and pretending otherwise meant borrowing a fifth colour:
 *
 *   paper -> gold outline -> gold fill -> red outline -> red fill
 *
 * Every step is a documented pairing from `index.css`: `term-ink-2` (7.9:1 on
 * the well), `accent-soft` and `dead-soft` (the two steps permitted as text ON
 * the screen, 6.7:1 and 5.0:1), and `dead` as a fill under `dead-soft`.
 */
const SEVERITY_STYLE: Record<string, string> = {
  WHISPER: 'text-term-ink-2 border-term-line-strong',
  CONCERN: 'text-accent-soft border-accent-soft/60',
  PROTEST: 'text-accent-soft bg-accent/25 border-accent-soft',
  EMERGENCY: 'text-dead-soft border-dead-soft',
  'CIVIL WAR': 'text-dead-soft bg-dead/40 border-dead-soft font-black',
};

export const RedPhoneProp: React.FC = () => {
  const phase = useGameStore((s) => s.phase);
  const treasuryCash = useGameStore((s) => s.treasuryCash);
  const activeCrisis = useGameStore((s) => s.activeCrisis);
  const crisisCooldownSeconds = useGameStore((s) => s.crisisCooldownSeconds);
  const swearInCrisis = useGameStore((s) => s.swearInCrisis);
  const suppressCrisis = useGameStore((s) => s.suppressCrisis);
  const triggerRedPhoneBailout = useGameStore((s) => s.triggerRedPhoneBailout);
  const unlockedPerks = useGameStore((s) => s.unlockedPerks);

  // INVARIANT: [The Bailout Face Must Match The Bailout Gate]
  // `isBrokeNotInDebt`, not a local `treasuryCash < 10`. A player in QE As A
  // Service debt is below $10 but is explicitly NOT eligible — the action has no
  // cooldown, and a face that offered it would be offering an infinite faucet.
  const isBroke = isBrokeNotInDebt(treasuryCash, unlockedPerks, 10);

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
          /* [TUNGSTEN] THE HANDSET IS A RED PHONE.
             Both classes here used to be dead tokens — `bg-ground` and
             `text-dead-soft` were both undefined — so the icon chip on the
             crisis handset rendered as a pale beige square on a dark square.
             The single most thematically load-bearing dead reference in the
             repo was making the red phone cream.

             With the ramp complete it resolves to `wax-400` on `newsprint-800`
             at 4.03:1, which is still a fail, and it is the wrong idea anyway:
             a dark chip with pink text is not a red telephone. It is now a wax
             fill with a lit edge, which is what a bakelite handset under a
             desk lamp looks like, and the `isBroke` branch is the drained
             version of the same object. */
          className={`p-1.5 rounded-md shrink-0 ${
            isBroke ? 'bg-panel text-term-ink-3' : 'bg-dead text-dead-soft'
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
          <span className="font-mono font-bold t-micro block text-dead-soft">CRISIS CALL</span>
          <span className="t-micro text-term-ink-3 font-mono block truncate">
            {isBroke ? 'BAILOUT AVAILABLE' : `Standby · next in ${nextIn}s`}
          </span>
        </div>

        {/* The wager, previewed. Only on the calm path — a broken player needs
            one loud instruction, not a payout table they cannot act on. */}
        {!isBroke && (
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex gap-0.5 w-16" aria-hidden="true">
              {CRISIS_TIER_MULTIPLIERS.map((m) => (
                <div key={m} className="h-1 flex-1 rounded-full bg-ground" />
              ))}
            </div>
            <span className="t-micro font-mono text-term-ink-3 whitespace-nowrap">
              Peak {formatCurrency(peak)}
            </span>
          </div>
        )}
      </>
    );

    const shell = `w-full p-2 rounded-lg border text-left select-none flex items-center gap-2 transition-colors ${
      isBroke
        ? 'bg-ink-1/80 border-dead-ink text-dead-soft animate-crisis-alarm'
        : 'bg-well border-line-strong text-term-ink-2'
    }`;

    return isBroke ? (
      <button
        onClick={triggerRedPhoneBailout}
        {...hint(
          `EMERGENCY BAILOUT: bill the Sovereign Detail for golf cart rentals. Unlocked only below $10 — you hold ${formatCurrency(
            treasuryCash
          )}. It pays nothing in S.L.O.P. heat, and the clicker's own floor guarantees you can always work your way back, so this is a rescue rather than a plan.` +
            /* INVARIANT: [Do Not Claim Self-Limiting The Gate Does Not Enforce]
               This used to say "not a faucet", which was never enforced by a
               cooldown — it was true only by accident, because the payout always
               lifted the treasury back over the $10 threshold. QE As A Service
               removed the accident. The honest statement is what the gate really
               does, which is why the copy no longer rests on a coincidence. */
            (isBrokeNotInDebt(treasuryCash, unlockedPerks, 10)
              ? ''
              : ' Not available while you are in debt — a loan is repaid by the slam floor, not by the phone.')
        )}
        className={`${shell} cursor-pointer group hover:border-dead-ink`}
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
  // Phase 2.4: time left before the crisis auto-resolves as a suppression.
  // Derived from the book's own window, so retuning `CRISIS_WINDOW_SECONDS`
  // moves this number with it instead of leaving a stale 30 on the strip.
  const secondsLeft = Math.max(0, Math.ceil(CRISIS_WINDOW_SECONDS - activeCrisis.elapsedSeconds));

  return (
    /* INVARIANT: this card carries no shake of its own. It holds the two buttons
       the whole mechanic exists to offer, so it must never move under the
       cursor. Urgency lives on the handset icon (a ~16px rattle) and, at max
       tier, in a halo. The previous `animate-ring` rotated this entire panel
       +/-10deg at 0.4s, which displaced SWEAR IN and IGNORE continuously. */
    <div
      className={`p-2 rounded-lg border-2 bg-ink-1/70 flex flex-col gap-1.5 relative overflow-hidden select-none shadow-lg shadow-ink-1/50 ${
        isMaxTier ? 'border-dead-ink animate-crisis-alarm' : 'border-dead-ink'
      }`}
    >
      <div className="flex items-start gap-2">
        <div className="p-1.5 rounded-md bg-dead text-on-fill shrink-0">
          {/* Was `animate-bounce`, which compounded with the card's own ring into
              a judder. The rattle is the whole signal; bounce was redundant. */}
          <PhoneCall className="w-4 h-4 animate-crisis-ring" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="font-mono font-bold t-micro text-dead-soft shrink-0">3:00 AM CALL</span>
            <span
              className={`t-caption font-mono px-1 rounded border shrink-0 ${SEVERITY_STYLE[tierDef?.severity ?? 'WHISPER']}`}
            >
              {tierDef?.severity}
            </span>
          </div>
          {/* ISSUE-010. Was `text-red-100/90` — a stock Tailwind cream tinted with red,
              which put the crisis headline on a stock ramp that has no
              counterpart in the palette and no measured contrast on this
              surface. `term-ink-1` is 12.9:1 on the well and is the documented
              body step on the screen; the crisis already has two alarm channels
              (the border, the alarm animation, and the severity chip beside it)
              so the headline itself does not need to be tinted to be alarming. */}
          <span className="t-micro text-term-ink-1 font-sans block leading-tight line-clamp-2">
            {tierDef?.headline}
          </span>
        </div>
      </div>

      {/* Escalation ladder — visualises the wager the player is making */}
      <div className="flex gap-0.5" aria-hidden="true">
        {CRISIS_TIER_MULTIPLIERS.map((m, i) => (
          <div
            key={m}
            className={`h-1 flex-1 rounded-full transition-colors ${i <= tier ? 'bg-dead-wash' : 'bg-ink-1/80'}`}
          />
        ))}
      </div>

      <div className="flex items-center justify-between gap-1">
        {/* Phase 2.4: a REAL countdown.
            This read "MAX" at the top tier and "+2.5x in 3s" below it — so at max
            severity, the exact moment the wager stops escalating, the strip went
            silent about time. The player could not tell whether answering now or
            in four seconds was a different decision, which is the entire decision
            the card exists to pose.

            At max tier the ladder is done and the payout is locked, so the only
            remaining question is "how long do I have to think" — which is
            exactly what a timer answers. `secondsLeft` is derived from the book's
            own escalation length rather than typed, because a stale copy here
            would be a lie about a clock. */}
        <span className="t-micro font-mono text-term-ink-1 shrink-0">
          {isMaxTier ? (
            <span className="text-dead-soft font-bold">
              MAX · <span className="text-term-ink-1">{secondsLeft}s LEFT</span>
            </span>
          ) : (
            `+${CRISIS_TIER_MULTIPLIERS[tier + 1]}x in ${toNext}s`
          )}
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
          className="px-1.5 py-1 rounded bg-live-wash hover:bg-live-wash text-term-ink-1 font-mono font-black t-micro cursor-pointer active:scale-95 transition-all shrink-0"
        >
          SWEAR IN {formatCurrency(nowPayout)}
        </button>
        <button
          onClick={suppressCrisis}
          {...hint(
            `Issue a statement and move on. No payout, no heat — and no tantrum, which is the real cost: the meter you were saving toward a ${FRENZY_CLICK_MULTIPLIER}x FRENZY does not move at all. Doing nothing resolves it the same way.`
          )}
          className="px-1.5 py-1 rounded bg-ground hover:bg-ground border border-line-strong text-term-ink-1 font-mono font-bold t-micro cursor-pointer active:scale-95 transition-all shrink-0 flex items-center gap-0.5"
        >
          <PhoneOff className="w-2.5 h-2.5" />
          <span>IGNORE</span>
        </button>
      </div>

      <span className="t-caption font-mono text-term-ink-2 leading-none">
        Peak pays {formatCurrency(maxPayout)} · max heat
        {` · a raid auto-bribe costs ${RAID_BRIBE_COST} Favor`}
      </span>
    </div>
  );
};
