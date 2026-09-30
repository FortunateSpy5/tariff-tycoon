/**
 * Click Payout — the ONE place a manual slam's cash is decided.
 *
 * WHY THIS EXISTS
 * `ClickerButton` printed `+{clickValue} / tap` on the stamp face by calling
 * `calculateClickValue` with the phase, ink and Slips — and `deskSlice.clickDesk`
 * then applied the Heavy Tungsten Nib's doubling as a separate statement at the
 * call site. So the hero control in the game, the one number a player plans
 * around, understated its own payout by 100% for anyone who owned the cheapest
 * crony upgrade in the shop. It was the `calculateInkRefillTotal` bug again: two
 * code paths, one number, and no gate to catch the divergence.
 *
 * Both sides now call this. It is a pure function so the renderer and the store
 * cannot drift, and so the Shell Company Inception perk — the second doubling —
 * lands in the same product rather than as a third site to remember.
 */

import { calculateClickValue } from '../math/formulas';
import { DRY_CLICK_JAM_THRESHOLD } from '../../constants/balance';
import { INITIAL_CRONY_UPGRADES } from '../../constants/unlocks';
import { debtReliefFloor, shellCompanyTapMultiplier, type PerkSet } from './perkEngine';

/**
 * The Heavy Tungsten Nib's tap multiplier, READ from the shop rather than
 * re-typed. `deskSlice` hard-coded `*= 2` beside a definition that already
 * carried `value: 2.0`; retuning the nib in the catalogue would have left the
 * engine charging the old number with no error anywhere.
 */
const TUNGSTEN_NIB_TAP_MULTIPLIER =
  INITIAL_CRONY_UPGRADES.find((u) => u.id === 'heavy_tungsten_nib')?.value ?? 1;

/** Everything the clicker's cash depends on. */
export interface ClickPayoutInput {
  phase: 1 | 2 | 3 | 4;
  /** The unmultiplied base slam value, currently a flat $5.00. */
  baseValue: number;
  inkLevel: number;
  isCapsFrenzy: boolean;
  /** Sovereign Immunity Slips held, which set the bankruptcy floor. */
  sisCount: number;
  /** Consecutive dry clicks, for the nib-jam threshold. */
  dryClicksCount: number;
  /** Whether the Heavy Tungsten Nib is owned. */
  hasTungstenNib: boolean;
  /** Owned SIS perks. */
  perks: PerkSet | undefined;
  /** Live treasury, for the QE As A Service debt floor. */
  treasuryCash: number;
}

/**
 * The cash one slam pays, and whether the nib was dry or jammed.
 *
 * INVARIANT: [Dry And Jammed Are The Same Question Asked Twice]
 * `clickDesk` consumes ink and grants tantrum through `clickInkFrenzy`, which
 * owns the jam threshold. This function needs the same answer to price the click,
 * and the answer is derived from the SAME two inputs rather than carried across
 * as a field, because a stored `isJammed` could disagree with the engine's own
 * verdict after a refill. One rule, one derivation.
 *
 * INVARIANT: [The Floor Wins Over The Multipliers]
 * `calculateClickValue` applies `max(floor, product)`, so a player in QE As A
 * Service debt is guaranteed the recovery rate even on a dry, jammed, frenzy-
 * capped slam. That is the whole point of the debt term.
 */
export function resolveClickPayout(input: ClickPayoutInput): {
  earnedCash: number;
  isDry: boolean;
  isJammed: boolean;
} {
  const isDry = input.inkLevel <= 0 && !input.isCapsFrenzy;
  const isJammed = isDry && input.dryClicksCount >= DRY_CLICK_JAM_THRESHOLD;

  const tapMultiplier =
    (input.hasTungstenNib ? TUNGSTEN_NIB_TAP_MULTIPLIER : 1) *
    shellCompanyTapMultiplier(input.perks);

  const earnedCash = calculateClickValue(
    input.phase,
    input.baseValue,
    input.isCapsFrenzy ? 100 : input.inkLevel,
    input.isCapsFrenzy,
    input.sisCount,
    isJammed,
    debtReliefFloor(input.treasuryCash, input.perks),
    tapMultiplier
  );

  return { earnedCash, isDry, isJammed };
}

/** The Heavy Tungsten Nib's own multiplier, for copy that must quote the engine. */
export const TUNGSTEN_NIB_MULTIPLIER = TUNGSTEN_NIB_TAP_MULTIPLIER;
