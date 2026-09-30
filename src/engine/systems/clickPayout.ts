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
import { isDryClick, isJammedClick } from './inkFrenzyEngine';
import { INITIAL_CRONY_UPGRADES } from '../../constants/unlocks';
import { SHELL_COMPANY_TAP_MULTIPLIER } from '../../constants/perks';
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
  // INVARIANT: [The Jam Verdict Comes From The Engine, Not A Second Rule]
  // This used to re-derive `isJammed` from the raw count, which disagreed with
  // `clickInkFrenzy` on exactly one click — the 30th consecutive dry one, where
  // the player was charged the full yield beside a gauge reading "−90%". It now
  // asks the engine. See `isJammedClick`.
  const isJammed = isJammedClick(input.inkLevel, input.isCapsFrenzy, input.dryClicksCount);
  const isDry = isDryClick(input.inkLevel, input.isCapsFrenzy);

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

/**
 * The number of Slips at which the `$1,000-per-Slip` bankruptcy floor overtakes
 * the Shell Company doubling.
 *
 * WHY THIS EXISTS: `calculateClickValue` pays `max(floor, product)`, and the
 * floor is `max($1, slips x $1,000)`. The doubling is applied to the PRODUCT, so
 * past a crossover the floor is what the player is actually paid and the perk
 * stops existing — measured: at 5 Slips the slam pays $5,000 with the perk and
 * $5,000 without it, identically. The card advertised a benefit invisible to
 * almost every player who owned it.
 *
 * The floor is correct behaviour, so this is a copy problem, not a balance one.
 * Exported so the perk card can state the real crossover rather than the
 * reviewer quoting a number no engine produces.
 *
 * Solves `base x phase x (1 + 0.1n) x shell = 1000n` for `n`.
 *
 * @returns The lowest Slip count at which the floor binds, or 0 when the
 *   doubling can never be outrun at this phase (Phase 4, where the base product
 *   is large enough to stay ahead indefinitely).
 */
export function shellCompanyCrossoverSlipCount(phase: number, baseValue: number = 5): number {
  const phaseMultiplier = { 1: 1, 2: 10, 3: 100, 4: 1000 }[phase] ?? 1;
  const shell = SHELL_COMPANY_TAP_MULTIPLIER;
  // base*phase*shell*(1 + 0.1n) = 1000n  ->  n = k / (1000*shell - 10*k)
  const k = baseValue * phaseMultiplier * shell;
  const denominator = 1000 * shell - 10 * k;
  if (denominator <= 0) return 0; // the product always wins; no crossover exists
  const n = k / denominator;
  return n <= 0 ? 0 : Math.ceil(n);
}
