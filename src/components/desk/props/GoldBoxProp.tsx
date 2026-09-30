/**
 * Gold Classified Document Box Prop
 * Sits on the desk blotter; sells classified bathroom blueprints to offshore
 * buyers. Pays +$500 and adds +8% S.L.O.P. regulatory heat.
 *
 * DESIGN RATIONALE [The Early-Game Cash Bridge]:
 * The audit called this prop "weak" — $500 on an 8s cooldown is trivial in the
 * late game and noise in the early one, and its real cost (suspicion) surfaced
 * nowhere. It is kept, and reframed, because it is the only early faucet that
 * can actually bridge the tutorial: the player starts with $100 seed cash, and
 * the default order slip wants $1,000 of collateral. A new player physically
 * cannot place the paper PUT the tutorial is asking for until they either slam
 * the stamp for a minute or sell one blueprint. That is the prop's job.
 *
 * INVARIANT: [The Prop Must Never Lie About Its Own Cooldown]
 * This component used to discard the boolean from `sellClassifiedSecrets` and
 * show "+$500 CASH" on every click, including the ones the 8s cooldown had
 * rejected. The player was told they had been paid when they had not. The
 * return value is now honoured, and the cooldown is shown, because a control
 * that silently does nothing is indistinguishable from a bug.
 *
 * INVARIANT: [Disabled Controls Still Need To Explain Themselves]
 * `aria-disabled` rather than `disabled`: a natively disabled button swallows
 * pointer events in Chromium, so the hover context would vanish exactly when it
 * is most needed — "restocking in 3s".
 */

import React, { useEffect, useState } from 'react';
import { Archive, Sparkles } from 'lucide-react';
import { useGameStore } from '../../../store/useGameStore';
import { formatCurrency } from '../../../engine/math/bigNumber';
import { hint } from '../../ui/hint';
// INVARIANT: imported, not re-typed. These were locals with a "mirrors" comment,
// which is a lie waiting for a balance pass — see deskPropsSlice.
import {
  BROKE_THRESHOLD,
  isBrokeNotInDebt,
  SECRET_SALE_COOLDOWN_SECONDS as COOLDOWN_SECONDS,
  SECRET_SALE_HEAT as HEAT,
  SECRET_SALE_PAYOUT as PAYOUT,
} from '../../../store/slices/deskPropsSlice';

export const GoldBoxProp: React.FC<{ dormant?: boolean }> = ({ dormant = false }) => {
  const sellClassifiedSecrets = useGameStore((s) => s.sellClassifiedSecrets);
  const lastSecretSaleTimestamp = useGameStore((s) => s.lastSecretSaleTimestamp);
  const treasuryCash = useGameStore((s) => s.treasuryCash);
  const unlockedPerks = useGameStore((s) => s.unlockedPerks);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(0);

  // Read the cooldown from the store's own timestamp rather than a local timer,
  // so a reloaded tab cannot desync and re-grant a free sale.
  useEffect(() => {
    const tick = () => {
      const elapsed = (Date.now() - (lastSecretSaleTimestamp || 0)) / 1000;
      setRemaining(Math.max(0, Math.ceil(COOLDOWN_SECONDS - elapsed)));
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [lastSecretSaleTimestamp]);

  // INVARIANT: [The Label Must Match The Rule That Actually Applies To YOU]
  // `sellClassifiedSecrets` WAIVES the cooldown below $50 — an emergency sale,
  // so a broke player can always act. Gating the display on the timestamp alone
  // meant a broke player read "Restocking (5s)", was marked `aria-disabled`,
  // was told by the tooltip they could not sell — and then was paid anyway.
  // That is a smaller cousin of the bug this prop was rewritten to kill.
  // INVARIANT: [The Label Matches The Rule That Applies To YOU]
  // This must be `isBrokeNotInDebt`, the same predicate `sellClassifiedSecrets`
  // enforces — not a local `treasuryCash < BROKE_THRESHOLD`. A player in QE As A
  // Service debt is below that threshold but is NOT on the cooldown waiver, so
  // the local test showed "Restocking for you" on a button that was refusing.
  const isBroke = isBrokeNotInDebt(treasuryCash, unlockedPerks, BROKE_THRESHOLD);
  const isRestocking = remaining > 0 && !isBroke;

  const handleClick = () => {
    if (!sellClassifiedSecrets()) {
      // INVARIANT: the shortfall is NAMED, not just signalled. "BOX RESTOCKING"
      // said that something was wrong and nothing about how long, which is the
      // half a player cannot guess.
      setFeedback(`BOX RESTOCKING // ${remaining}s`);
      setTimeout(() => setFeedback(null), 1800);
      return;
    }
    setFeedback(`+${formatCurrency(PAYOUT)} CASH (+${HEAT}% HEAT)`);
    setTimeout(() => setFeedback(null), 1800);
  };

  return (
    /* ISSUE-002 [Progressive Disclosure At The Element Level]. The desk used to
       present all three props at equal weight on frame one, before the player
       had done anything. The Gold Box is the one that matters most here, because
       nothing else in the cockpit can be reached yet: BagHolder Pro is sealed
       until the first slam, so there is nothing to spend the $500 on. Dormant, it
       states that, and its slot stays exactly the size it will occupy once it
       opens — a collapsing row here would shove the directive sheet down the
       desk on the player's very first click.

       NOT a hidden prop and not a dead button. Per [The Seal Is A Promise, Not
       A Wall], a thing the player will eventually use must stay visible and
       nameable; what changes is that it stops LOOKING operable. `handleClick`
       is still wired, so a curious click still sells a blueprint — there is no
       gate to explain, therefore no gate that can refuse silently. */
    <button
      onClick={handleClick}
      aria-disabled={isRestocking}
      {...hint(
        dormant
          ? `Awaiting your first seizure. The box sells classified bathroom blueprints offshore for ${formatCurrency(
              PAYOUT
            )} and +${HEAT}% S.L.O.P. heat, on a ${COOLDOWN_SECONDS}s cooldown — and there is nothing to spend it on until you slam the stamp once, because that slam is what unseals BagHolder Pro. It opens itself the moment you do.`
          : isBroke
          ? `Restocking for ${remaining}s — but not for you. Under ${formatCurrency(
              BROKE_THRESHOLD
            )} the desk sells on emergency terms and ignores the clock entirely. A broke player can always move a blueprint; everyone else waits.`
          : isRestocking
          ? `Restocking. ${remaining}s. The box cannot be sold twice inside ${COOLDOWN_SECONDS}s — a wealthy player who spams it would convert ${formatCurrency(
              PAYOUT / COOLDOWN_SECONDS
            )}/s of pure heat.`
          : `Sell a classified bathroom blueprint offshore: +${formatCurrency(PAYOUT)} cash and +${HEAT}% S.L.O.P. suspicion, which is what invites the raids. ${COOLDOWN_SECONDS}s cooldown. You seed with $100 and the cheapest order the terminal takes locks $500, so one blueprint roughly doubles your buying power — a nudge, not a faucet.`
      )}
      className={`p-2 rounded-lg bg-well border transition-all flex items-center gap-2 text-left group relative overflow-hidden select-none ${
        dormant
          ? 'border-dashed border-line opacity-55 hover:opacity-80'
          : // INVARIANT: [A Gated Prop Must LOOK Gated]
            // The cooldown is 8s and the refills 8s, so a box that is
            // `aria-disabled` a third of the time cannot keep `cursor-pointer`
            // and `active:scale-95` unconditionally — it squashed under the
            // cursor while refusing the click. `SubpoenaShredderProp` already
            // branches this; the sibling prop was the one that did not.
            isRestocking
            ? 'border-line-strong cursor-not-allowed opacity-70'
            : 'border-line-strong hover:border-accent-ink/60 cursor-pointer active:scale-95'
      }`}
    >
      {/* ISSUE-010 [No Stock Tailwind Colours On Player-Facing Surfaces].
          Was `bg-amber-950/60` behind a `text-accent-ink` icon: a very dark
          amber chip carrying a very dark brown glyph, which measured roughly
          1.6:1 and was invisible for the entire time the prop was live. The
          `accent-soft` step exists for exactly this case — the palette comment
          in `index.css` names it as "the same gold permitted as TEXT on the dark
          screen, where it measures 6.7:1" — and it is the only legal way to put
          gold text on this fill. */}
      <div className="p-1.5 rounded-md bg-accent/20 border border-accent-ink/30 text-accent-soft group-hover:scale-110 transition-transform">
        <Archive className="w-4 h-4" aria-hidden />
      </div>
      <div>
        <div className="flex items-center gap-1 font-mono font-bold t-micro text-accent-ink group-hover:text-accent-ink">
          <span>GOLD BOX</span>
          <Sparkles className="w-2.5 h-2.5 text-accent-ink" aria-hidden />
        </div>
        <span className="t-caption text-term-ink-3 font-mono block">
          {dormant
            ? 'Awaiting first seizure'
            : isRestocking
            ? `Restocking (${remaining}s)`
            : `Sell Secrets (+${formatCurrency(PAYOUT)})`}
        </span>
      </div>

      {/* INVARIANT: [The Refusal Is Announced, Not Just Painted]
          This overlay was a plain div. It is the ONLY thing that says a sale was
          refused, and being unroled it was visible to sighted players and silent
          to everyone else — the exact inversion the AGENTS.md gate rule exists to
          prevent. `role="status"` puts it in the live region so the refusal
          reaches a screen-reader user and is announced on change, not on hover. */}
      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className="absolute inset-0 bg-ink-1 flex items-center justify-center t-micro font-mono font-bold text-accent-ink px-1 text-center"
        >
          {feedback}
        </div>
      )}
    </button>
  );
};
