/**
 * ExecutiveGauges — the Ink and Tantrum meters, restacked as a matched pair.
 *
 * DESIGN RATIONALE [The Asymmetric Pair]:
 * Ink and Tantrum sat in a `grid-cols-2` where only Ink had an action, so the
 * pair read as one finished component next to one that was missing its button
 * rather than as two deliberately different resources.
 *
 * Two changes fix it:
 *   1. Vent Tantrum gives the Tantrum meter a real counterpart action, so both
 *      gauges now offer the player a decision.
 *   2. They stack full-width instead of sitting side by side. Side by side, a
 *      long label on one visually competes with the other; stacked, each gets
 *      the full width for its status line and its button, which is what a
 *      zero-scroll cockpit needs.
 *
 * INVARIANT: [Venting Must Never Be Optimal]
 * Venting burns the entire meter and buys VEX relief clamped to the baseline,
 * so riding to 100% for a 10x FRENZY always beats venting. It is a panic button
 * for calm options pricing — never an efficiency upgrade. See balance.ts.
 */

import React from 'react';
import { Droplet, RefreshCw, AlertTriangle, Flame, Siren, Wind } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import { formatCurrency } from '../../engine/math/bigNumber';
import {
  INK_PER_CLICK,
  INK_REGEN_PER_SECOND,
  INK_REFILL_COST_GROWTH,
  DRY_CLICK_JAM_THRESHOLD,
  DRY_CLICK_JAM_YIELD_MULTIPLIER,
  DRY_CLICK_YIELD_MULTIPLIER,
  INKED_TANTRUM_PER_CLICK,
  DIET_SODA_TANTRUM_PER_CLICK,
  DRY_TANTRUM_PER_CLICK,
  TANTRUM_VENT_MIN_TANTRUM,
  TANTRUM_VENT_VEX_RELIEF,
  FRENZY_CLICK_MULTIPLIER,
  VEX_BASELINE,
} from '../../constants/balance';
import { Card } from '../ui/Card';
import { hint } from '../ui/hint';
import {
  calculateInkRefillCost,
  calculateInkRefillTotal,
  INK_REFILL_HARD_CAP_MULTIPLE,
} from '../../engine/math/formulas';

export const ExecutiveGauges: React.FC = () => {
  const phase = useGameStore((s) => s.phase);
  const inkLevel = useGameStore((s) => s.inkLevel);
  const maxInk = useGameStore((s) => s.maxInk);
  const inkRefillCount = useGameStore((s) => s.inkRefillCount);
  const treasuryCash = useGameStore((s) => s.treasuryCash);
  const refillInk = useGameStore((s) => s.refillInk);
  const ventTantrum = useGameStore((s) => s.ventTantrum);

  const tantrumMeter = useGameStore((s) => s.tantrumMeter);
  const isCapsFrenzy = useGameStore((s) => s.isCapsFrenzy);
  const capsFrenzySecondsRemaining = useGameStore((s) => s.capsFrenzySecondsRemaining);
  const frenzyCooldownSecondsRemaining = useGameStore((s) => s.frenzyCooldownSecondsRemaining);
  const hasDietSodaDrip = useGameStore((s) => s.activeUpgrades.includes('diet_soda_drip'));

  // The CHARGED price, not the base curve — see [The Quoted Price Must Be The
  // Charged Price] in `formulas.ts`. `atRefillCap` is true once the 2% treasury
  // tax has been clamped away by the 4× ceiling, which is the case the copy has
  // to get right rather than describe as "on top".
  const refillBase = calculateInkRefillCost(inkRefillCount);
  const refillCost = calculateInkRefillTotal(inkRefillCount, treasuryCash);
  const atRefillCap = refillCost >= refillBase * INK_REFILL_HARD_CAP_MULTIPLE;
  const canAfford = treasuryCash >= refillCost;
  const isDry = inkLevel <= 0 && !isCapsFrenzy;
  const inkPercent = Math.round((inkLevel / maxInk) * 100);
  const inkLabel = phase === 1 ? 'Customs Stamp Ink' : 'Golden Sherpie Ink';

  const tantrumPercent = Math.min(100, Math.round(tantrumMeter));
  const isCoolingOff = frenzyCooldownSecondsRemaining > 0;
  // Vent is blocked during frenzy, during the cooling-off protocol, and when the
  // meter is too small to be worth purging.
  const canVent =
    !isCapsFrenzy && !isCoolingOff && tantrumMeter >= TANTRUM_VENT_MIN_TANTRUM;
  const canRefill = canAfford && inkPercent < 100;
  // The dry yield is 10% — until 30 consecutive dry clicks JAM the nib and it
  // collapses to 2%. The gauge used to hardcode "−90%", which is wrong in
  // exactly the state the player is stuck in long enough to read it.
  const dryClicksCount = useGameStore((s) => s.dryClicksCount || 0);
  const jamYield = dryClicksCount >= DRY_CLICK_JAM_THRESHOLD
    ? DRY_CLICK_JAM_YIELD_MULTIPLIER
    : DRY_CLICK_YIELD_MULTIPLIER;

  return (
    <div className="grid grid-cols-1 gap-1.5 shrink-0">
      {/* ---- INK ---- */}
      <Card density="tight">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <Droplet className={`w-3.5 h-3.5 shrink-0 ${isDry ? 'text-wax-500' : 'text-gold-600'}`} />
            <span className="t-micro font-bold text-newsprint-900 truncate">{inkLabel}</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`t-micro font-mono font-bold ${isDry ? 'text-wax-600' : 'text-newsprint-900'}`}>
              {isCapsFrenzy ? '∞' : `${inkPercent}%`}
            </span>
            <button
              onClick={() => {
                if (!canRefill) return;
                refillInk();
              }}
              aria-disabled={!canRefill}
              {...hint(
                inkPercent >= 100
                  ? `Tank is full. ${formatCurrency(refillCost)} buys nothing right now.`
                  : !canAfford
                  ? `Refill the tank for ${formatCurrency(refillCost)}. You hold ${formatCurrency(
                      treasuryCash
                    )} — the price climbs ${INK_REFILL_COST_GROWTH}× per purchase AND carries a 2% tax on your treasury, so refills are a real running cost, not a rounding error.`
                  : `Refill the tank for ${formatCurrency(refillCost)}. That is the base curve (climbing ${INK_REFILL_COST_GROWTH}× per refill) plus 2% of your treasury${
                      atRefillCap
                        ? ` — and the ${INK_REFILL_HARD_CAP_MULTIPLE}× ceiling has now swallowed that 2% entirely, so the price is pinned at ${formatCurrency(
                            refillCost * INK_REFILL_HARD_CAP_MULTIPLE
                          )} no matter how rich you get`
                        : ''
                    }. The free alternative is to stop slamming and wait ${INK_REGEN_PER_SECOND}/s.`
              )}
              className={`px-1.5 py-0.5 rounded t-caption font-mono font-bold flex items-center gap-1 transition-all ${
                canRefill
                  ? 'bg-gold-600 hover:bg-gold-500 text-newsprint-50 active:scale-95 cursor-pointer'
                  : 'bg-newsprint-300 text-newsprint-800 cursor-not-allowed'
              }`}
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refill {formatCurrency(refillCost)}</span>
            </button>
          </div>
        </div>

        <div
          className="w-full h-1.5 bg-newsprint-300 rounded-full overflow-hidden mt-1"
          role="progressbar"
          aria-label={inkLabel}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={isCapsFrenzy ? 100 : inkPercent}
        >
          <div
            className={`h-full transition-all duration-150 ${
              isCapsFrenzy
                ? 'bg-gradient-to-r from-red-600 via-gold-500 to-red-600'
                : isDry
                ? 'bg-red-600'
                : 'bg-gradient-to-r from-gold-600 to-gold-400'
            }`}
            style={{ width: `${isCapsFrenzy ? 100 : inkPercent}%` }}
          />
        </div>

        <div className="flex items-center gap-1 mt-0.5">
          {isDry ? (
            <>
              <AlertTriangle className="w-3 h-3 shrink-0 text-wax-500" />
              <span className="t-caption text-wax-600 font-semibold">
                DRY NIB: −{Math.round((1 - jamYield) * 100)}% yield
              </span>
            </>
          ) : (
            <span className="t-caption text-newsprint-800 truncate">
              {/* INVARIANT: [Do Not Promise A Refund The Engine Forbids] — this
                  read "Ink restored; none consumed during Frenzy". A frenzy
                  FREEZES the tank; `inkFrenzyEngine` carries an explicit
                  invariant that it does not restore it ("a free refill would
                  make the frenzy self-sustaining and break the drain"). A
                  visible label is worse than a tooltip here: the player plans
                  around it. It is frozen, not topped up. */}
              {isCapsFrenzy
                ? 'Ink held — none consumed, none refunded'
                : `−${INK_PER_CLICK} ink per ${phase === 1 ? 'stamp' : 'signature'}`}
            </span>
          )}
        </div>
      </Card>

      {/* ---- TANTRUM ---- */}
      <Card density="tight">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            {isCapsFrenzy ? (
              <Siren className="w-3.5 h-3.5 shrink-0 text-wax-500" />
            ) : (
              <Flame className={`w-3.5 h-3.5 shrink-0 ${tantrumPercent > 70 ? 'text-wax-500' : 'text-gold-600'}`} />
            )}
            <span className="t-micro font-bold text-newsprint-900 truncate">
              {isCapsFrenzy ? 'CAPS LOCK FRENZY' : 'Executive Tantrum'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className={`t-micro font-mono font-bold ${
                isCapsFrenzy ? 'text-wax-600' : tantrumPercent > 70 ? 'text-wax-600' : 'text-newsprint-900'
              }`}
            >
              {isCapsFrenzy ? `${Math.ceil(capsFrenzySecondsRemaining)}s` : `${tantrumPercent}%`}
            </span>
            <button
              onClick={() => {
                if (!canVent) return;
                ventTantrum();
              }}
              aria-disabled={!canVent}
              {...hint(
                isCapsFrenzy
                  ? `Unavailable during a FRENZY. The meter is already paying ${FRENZY_CLICK_MULTIPLIER}× — there is nothing to vent and everything to lose.`
                  : isCoolingOff
                  ? `Unavailable for ${Math.ceil(frenzyCooldownSecondsRemaining)}s. The Cooling-Off Protocol cannot be dodged by venting the meter that caused the frenzy.`
                  : tantrumMeter < TANTRUM_VENT_MIN_TANTRUM
                  ? `Needs ${TANTRUM_VENT_MIN_TANTRUM}% tantrum. You hold ${tantrumPercent}%.`
                  : `Burn the ENTIRE meter for up to −${TANTRUM_VENT_VEX_RELIEF} VEX, floored at the ${VEX_BASELINE} baseline. This is the panic button for when your 0DTE positions are pricing like a coin flip — never the efficient play, because riding to 100% for a ${FRENZY_CLICK_MULTIPLIER}× frenzy is always worth more than venting at 99%.`
              )}
              className={`px-1.5 py-0.5 rounded t-caption font-mono font-bold flex items-center gap-1 transition-all ${
                canVent
                  ? 'bg-stampblue-500 hover:bg-stampblue-700 text-newsprint-50 active:scale-95 cursor-pointer'
                  : 'bg-newsprint-300 text-newsprint-800 cursor-not-allowed'
              }`}
            >
              <Wind className="w-3 h-3" />
              <span>Vent</span>
            </button>
          </div>
        </div>

        <div
          className="w-full h-1.5 bg-newsprint-300 rounded-full overflow-hidden mt-1"
          role="progressbar"
          aria-label="Executive Tantrum"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={tantrumPercent}
        >
          <div
            className={`h-full transition-all duration-100 ${
              isCapsFrenzy
                ? 'bg-gradient-to-r from-red-600 via-gold-400 to-red-600'
                : tantrumPercent > 70
                ? 'bg-gradient-to-r from-gold-500 to-red-600'
                : 'bg-gradient-to-r from-gold-600 to-gold-500'
            }`}
            style={{ width: `${isCapsFrenzy ? 100 : tantrumPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between gap-2 mt-0.5">
          <span className="t-caption text-newsprint-800 truncate">
            {isCapsFrenzy
              ? '10x CASH · INK RESTORED'
              : isCoolingOff
              ? `Cooling off: ${Math.ceil(frenzyCooldownSecondsRemaining)}s`
              : `Inked +${hasDietSodaDrip ? DIET_SODA_TANTRUM_PER_CLICK : INKED_TANTRUM_PER_CLICK}% · dry +${DRY_TANTRUM_PER_CLICK}%`}
          </span>
          {!isCapsFrenzy && !isCoolingOff && (
            <span className="t-caption text-newsprint-800/70 shrink-0">
              Frenzy at 100% · Vent −{TANTRUM_VENT_VEX_RELIEF} VEX
            </span>
          )}
        </div>
      </Card>
    </div>
  );
};
