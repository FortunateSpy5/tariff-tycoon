/**
 * PrestigeProgressCard — the readout for the $1M → $10B climb.
 *
 * WHY IT EXISTS
 * The Caymans channel opens the moment the player moves a tariff dial, which
 * happens in Phase 2 — and the filing gate is $10^10 of lifetime cash. For the
 * entire stretch between those two facts the tab was a disabled button and
 * ~640px of nothing. Measured dead space was 55% of the right wing.
 *
 * INVARIANT: [Lead With The Shortfall]
 * The projection opens on the number the player came for. The shape of the curve
 * comes second, and it is stated honestly: the exponent on lifetime cash is
 * sub-linear, so doubling everything is worth about a quarter more paperwork.
 * A prestige screen that implied earnings scaled linearly with Slips would be
 * teaching the player to grind for a number the formula does not produce.
 */

import React from 'react';
import { TrendingUp } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import {
  PRESTIGE_CASH_DIVISOR,
  PRESTIGE_CASH_EXPONENT,
  PRESTIGE_OPTIONS_WEIGHT,
} from '../../constants/balance';
import { formatCurrency } from '../../engine/math/bigNumber';
import { PRESTIGE_PERKS } from '../../constants/perks';
import { hasPerk } from '../../engine/systems/perkEngine';
import { Card, CardHeader } from '../ui/Card';
import { hint } from '../ui/hint';
import { readPrestigeProjection } from './prestigeProjection';

export const PrestigeProgressCard: React.FC = () => {
  const lifetimeCashEarned = useGameStore((s) => s.lifetimeCashEarned);
  const lifetimeOptionsProfit = useGameStore((s) => s.lifetimeOptionsProfit);
  const activeTrades = useGameStore((s) => s.activeTrades);
  const unlockedPerks = useGameStore((s) => s.unlockedPerks);
  const slipsHeld = useGameStore((s) => s.sovereignImmunitySlips);

  // The SAME sum `executeFlightToCaymans` credits. Omitting the locked
  // collateral would quote a shortfall the engine does not charge — the exact
  // lie the Caymans button label was corrected for in an earlier pass.
  const lockedCollateral = (activeTrades || []).reduce((sum, t) => sum + (t.collateralLocked || 0), 0);
  const p = readPrestigeProjection(
    (lifetimeCashEarned || 0) + lockedCollateral,
    lifetimeOptionsProfit || 0
  );

  const pct = Math.round(p.progress * 100);
  const ready = p.shortfall <= 0;

  const nextLine = p.nextSlipCash
    ? p.nextSlipGain > 0
      ? `Next whole Slip at ${formatCurrency(p.nextSlipCash)} lifetime — ${formatCurrency(
          p.nextSlipShortfall
        )} further, worth ${p.nextSlipGain} more Slip${p.nextSlipGain === 1 ? '' : 's'}.`
      : `The next cash rung is ${formatCurrency(
          p.nextSlipCash
        )}, but your realised options profit already carries the filing figure past it — more lifetime earnings will not buy another whole Slip on their own.`
    : 'The cash term alone will not advance you another whole Slip. Realised options profit is the only thing left on the ladder that moves it.';

  // What this filing is actually WORTH, in the currency the player can spend.
  //
  // INVARIANT: [Never Call A Faucet "The First" To Somebody On Their Fourth]
  // The first draft of this line read "enough for the first perk", which is
  // true on a fresh save and nonsense to anyone who has already filed three —
  // the same stale-label defect Phase 0 spent a phase removing.
  const unfiled = PRESTIGE_PERKS.filter((perk) => !hasPerk(unlockedPerks, perk.id));
  const opensNow = unfiled.filter((perk) => perk.cost <= p.sisNow).length;
  const verdict = !ready
    ? ''
    : p.sisNow === 0
    ? 'Filing now pays nothing — not enough lifetime earnings for a whole Slip.'
    : `Filing now pays ${p.sisNow} Slip${p.sisNow === 1 ? '' : 's'}. ` +
      (opensNow > 0
        ? `It opens ${opensNow} perk${opensNow === 1 ? '' : 's'} you have not filed for.`
        : slipsHeld > 0
        ? `You already hold ${slipsHeld} — enough for every perk still open, so this filing is for the next rung rather than this one.`
        : 'Not enough for any perk you have not already filed for.');

  return (
    <Card material="paper" className="shrink-0">
      <CardHeader
        title="Filing Progress"
        icon={<TrendingUp className="w-3.5 h-3.5 text-accent-ink" />}
        right={
          <span className="t-caption font-mono font-black text-accent-ink shrink-0">
            {ready ? 'GATE OPEN' : `${pct}%`}
          </span>
        }
      />

      <div
        {...hint(
          `Lifetime earnings ${formatCurrency(p.countedLifetimeCash)} of the ${formatCurrency(
            PRESTIGE_CASH_DIVISOR
          )} gate, counting ${formatCurrency(lockedCollateral)} still locked in open 0DTE positions. ` +
            `${ready ? 'The gate is open.' : `${formatCurrency(p.shortfall)} short.`} ` +
            `Filing now pays ${p.sisNow} Slip${p.sisNow === 1 ? '' : 's'}. ${nextLine} ` +            `The exponent on lifetime cash is ${PRESTIGE_CASH_EXPONENT}, not linear: doubling everything you ` +
            `have earned multiplies the cash term by ${p.cashDoublingGain.toFixed(
              2
            )}, so a second doubling of your earnings buys about a quarter more paperwork, not twice as much. ` +
            `Realised options profit is weighted ${PRESTIGE_OPTIONS_WEIGHT} times as heavily as cash and is the ` +
            `faster ladder once you are actually winning trades.`
        )}
      >
        <div className="flex items-baseline justify-between gap-2">
          <span className="t-caption font-mono font-black text-ink-2">
            {ready ? 'READY TO FILE' : `${formatCurrency(p.shortfall)} SHORT`}
          </span>
          <span className="t-caption font-mono text-ink-3">
            {formatCurrency(p.countedLifetimeCash)} / {formatCurrency(PRESTIGE_CASH_DIVISOR)}
          </span>
        </div>

        <div
          className="mt-1 h-1.5 bg-panel/60 rounded-full overflow-hidden"
          role="progressbar"
          aria-label="Progress toward the Chapter 11 filing gate"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
        >
          <div
            className="h-full bg-gradient-to-r from-accent to-accent transition-all duration-500 rounded-full"
            style={{ width: `${Math.max(1, pct)}%` }}
          />
        </div>

        <p className="t-caption font-mono text-ink-3/90 leading-snug mt-1">
          {verdict || `Not yet a whole Slip. ${nextLine}`}
          {ready ? ` ${nextLine}` : ''}
        </p>
      </div>
    </Card>
  );
};
