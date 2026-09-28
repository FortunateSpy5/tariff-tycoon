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
import { calculateInkRefillCost } from '../../engine/math/formulas';
import { formatCurrency } from '../../engine/math/bigNumber';
import {
  INK_PER_CLICK,
  INKED_TANTRUM_PER_CLICK,
  DIET_SODA_TANTRUM_PER_CLICK,
  DRY_TANTRUM_PER_CLICK,
  TANTRUM_VENT_MIN_TANTRUM,
  TANTRUM_VENT_VEX_RELIEF,
} from '../../constants/balance';
import { Card } from '../ui';

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

  const refillCost = calculateInkRefillCost(inkRefillCount);
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

  return (
    <div className="grid grid-cols-1 gap-1.5 shrink-0">
      {/* ---- INK ---- */}
      <Card density="tight">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <Droplet className={`w-3.5 h-3.5 shrink-0 ${isDry ? 'text-red-500' : 'text-gold-400'}`} />
            <span className="t-micro font-bold text-stone-300 truncate">{inkLabel}</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`t-micro font-mono font-bold ${isDry ? 'text-red-400' : 'text-stone-300'}`}>
              {isCapsFrenzy ? '∞' : `${inkPercent}%`}
            </span>
            <button
              onClick={() => refillInk()}
              disabled={!canAfford || inkPercent >= 100}
              title="Refill the ink tank"
              className={`px-1.5 py-0.5 rounded t-caption font-mono font-bold flex items-center gap-1 transition-all ${
                canAfford && inkPercent < 100
                  ? 'bg-gold-600 hover:bg-gold-500 text-stone-950 active:scale-95 cursor-pointer'
                  : 'bg-stone-800 text-stone-500 cursor-not-allowed'
              }`}
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refill {formatCurrency(refillCost)}</span>
            </button>
          </div>
        </div>

        <div
          className="w-full h-1.5 bg-stone-950 rounded-full overflow-hidden mt-1"
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
              <AlertTriangle className="w-3 h-3 shrink-0 text-red-400" />
              <span className="t-caption text-red-400 font-semibold">
                DRY NIB: -90% yield
              </span>
            </>
          ) : (
            <span className="t-caption text-stone-500 truncate">
              {isCapsFrenzy
                ? 'Ink restored; none consumed during Frenzy'
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
              <Siren className="w-3.5 h-3.5 shrink-0 text-red-500" />
            ) : (
              <Flame className={`w-3.5 h-3.5 shrink-0 ${tantrumPercent > 70 ? 'text-red-500' : 'text-gold-500'}`} />
            )}
            <span className="t-micro font-bold text-stone-300 truncate">
              {isCapsFrenzy ? 'CAPS LOCK FRENZY' : 'Executive Tantrum'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className={`t-micro font-mono font-bold ${
                isCapsFrenzy ? 'text-red-400' : tantrumPercent > 70 ? 'text-red-400' : 'text-stone-300'
              }`}
            >
              {isCapsFrenzy ? `${Math.ceil(capsFrenzySecondsRemaining)}s` : `${tantrumPercent}%`}
            </span>
            <button
              onClick={() => ventTantrum()}
              disabled={!canVent}
              title="Burn all tantrum to cool VEX volatility. Costs the whole meter, including any progress toward a 10x FRENZY."
              className={`px-1.5 py-0.5 rounded t-caption font-mono font-bold flex items-center gap-1 transition-all ${
                canVent
                  ? 'bg-stone-700 hover:bg-stone-600 text-stone-100 active:scale-95 cursor-pointer'
                  : 'bg-stone-900 text-stone-600 cursor-not-allowed'
              }`}
            >
              <Wind className="w-3 h-3" />
              <span>Vent</span>
            </button>
          </div>
        </div>

        <div
          className="w-full h-1.5 bg-stone-950 rounded-full overflow-hidden mt-1"
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
          <span className="t-caption text-stone-500 truncate">
            {isCapsFrenzy
              ? '10x CASH · INK RESTORED'
              : isCoolingOff
              ? `Cooling off: ${Math.ceil(frenzyCooldownSecondsRemaining)}s`
              : `Inked +${hasDietSodaDrip ? DIET_SODA_TANTRUM_PER_CLICK : INKED_TANTRUM_PER_CLICK}% · dry +${DRY_TANTRUM_PER_CLICK}%`}
          </span>
          {!isCapsFrenzy && !isCoolingOff && (
            <span className="t-caption text-stone-600 shrink-0">
              Frenzy at 100% · Vent −{TANTRUM_VENT_VEX_RELIEF} VEX
            </span>
          )}
        </div>
      </Card>
    </div>
  );
};
