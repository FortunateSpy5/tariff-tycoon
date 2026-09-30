/**
 * Prestige Perk Engine — PURE rules for the six SIS perks (GDD §5).
 *
 * INVARIANT: [Headless Game Logic Belongs in src/engine/]
 * No React, no Zustand, no store reads, no audio. Every perk resolves to a
 * number or a boolean HERE, and the slices, the hint copy and the cards all
 * read the same answer — which is the only reason a perk cannot quote a number
 * the simulation does not charge.
 */

import {
  AUTO_MATCH_INTERVAL_SECONDS,
  AUTO_MATCH_YIELD,
  DEBT_RECOVERY_CLICKS,
  FLASH_DIP_CHANCE,
  FLASH_DIP_DURATION_SECONDS,
  FLASH_DIP_VALUATION_MULTIPLIER,
  PARACHUTE_RETENTION,
  PARDON_COST_REDUCTION,
  QEAAAS_BUFFER,
  SHELL_COMPANY_TAP_MULTIPLIER,
  type PerkId,
} from '../../constants/perks';

/** The set of perks a player currently owns. */
export type PerkSet = Partial<Record<PerkId, boolean>>;

/** True when the player owns `id`. */
export function hasPerk(perks: PerkSet | undefined, id: PerkId): boolean {
  return Boolean(perks?.[id]);
}

// ---------------------------------------------------------------------------
// Perk 1 — Shell Company Inception
// ---------------------------------------------------------------------------

/** Shell Company's contribution to the base tap. Multiplies with the nib. */
export function shellCompanyTapMultiplier(perks: PerkSet | undefined): number {
  return hasPerk(perks, 'shell_company_inception') ? SHELL_COMPANY_TAP_MULTIPLIER : 1;
}

// ---------------------------------------------------------------------------
// Perk 2 — 280-Character Macro Wreck (the Flash Dip)
// ---------------------------------------------------------------------------

export interface FlashDipInput {
  /** Whether the perk is owned. When false, nothing is ever triggered. */
  readonly enabled: boolean;
  /** True when a Flash Dip is already running. */
  readonly isActive: boolean;
  /** Seconds left on the running Flash Dip. */
  readonly secondsRemaining: number;
  /** Lifetime count, for the readout. */
  readonly totalTriggered: number;
}

export interface FlashDipResult extends FlashDipInput {
  readonly isActive: boolean;
  readonly secondsRemaining: number;
  /** True on the frame a new Flash Dip was fired by this click. */
  readonly triggered: boolean;
}

/**
 * Advance the Flash Dip by one manual click.
 *
 * INVARIANT: [The Roll Is Re-rolled Every Click, And Is Not Consuming]
 * A 4% chance per tap is ~1 Flash Dip every 25 slams. It fires regardless of
 * whether one is already running — re-rolling would make the printed "4% per
 * slam" untrue — but an already-running dip simply has its timer topped back
 * up to the full duration.
 *
 * @param rand Injected so the roll is reproducible in a test. Defaults to
 *   `Math.random` at the call site, never here, so this module stays pure.
 */
export function clickFlashDip(
  input: FlashDipInput,
  rand: () => number,
  durationSeconds: number = FLASH_DIP_DURATION_SECONDS
): FlashDipResult {
  if (!input.enabled) {
    return { ...input, isActive: false, secondsRemaining: 0, triggered: false };
  }
  const triggered = rand() < FLASH_DIP_CHANCE;
  if (!triggered) {
    return { ...input, triggered: false };
  }
  return {
    ...input,
    isActive: true,
    secondsRemaining: durationSeconds,
    totalTriggered: input.totalTriggered + 1,
    triggered: true,
  };
}

/**
 * Tick the Flash Dip timer down.
 *
 * INVARIANT: the timer is a countdown to zero, and the multiplier is read as
 * `secondsRemaining > 0` everywhere else — there is no separate boolean that
 * could disagree with the clock. `Math.max(0, …)` means a 100ms tick cannot
 * leave a negative remainder that later reads as "active".
 */
export function tickFlashDip(secondsRemaining: number, deltaSeconds: number): number {
  if (secondsRemaining <= 0) return 0;
  return Math.max(0, secondsRemaining - deltaSeconds);
}

/**
 * The options-valuation multiplier a Flash Dip contributes.
 *
 * INVARIANT: [It Multiplies The SIGNED Return]
 * Same shape as the VEX vega multiplier — it makes a winning position pay
 * faster AND a losing one burn faster. The perk copy says so explicitly, because
 * the VEX tooltip that failed to is recorded in the plan as the most expensive
 * line ever shipped here.
 */
export function flashDipValuationMultiplier(secondsRemaining: number): number {
  return secondsRemaining > 0 ? FLASH_DIP_VALUATION_MULTIPLIER : 1;
}

// ---------------------------------------------------------------------------
// Perk 3 — QE As A Service (the negative cash buffer)
// ---------------------------------------------------------------------------

/**
 * INVARIANT: [A Loan Is Never A Soft-Lock]
 * `debtReliefFloor` sizes the manual-click bankruptcy floor against this buffer,
 * so the deepest reachable hole is always recoverable in bounded time. A loan
 * that outran the clicker would be a soft-lock wearing a perk's clothes.
 */
export const TREASURY_FLOOR = -QEAAAS_BUFFER;

/**
 * Can the treasury be spent down to `price`, given the QEaaS buffer?
 *
 * INVARIANT: this is the SINGLE affordability test. `buyUpgrade`, `refillInk`,
 * `openOptionTrade` and `liquidateAgency` all call it, because four hand-written
 * `treasuryCash >= cost` checks is four places for the perk to be quietly absent
 * from — and the failure mode is invisible, not loud.
 */
export function canAfford(treasuryCash: number, price: number, perks: PerkSet | undefined): boolean {
  return treasuryCash - price >= treasuryFloorFor(perks);
}

/** The lowest the treasury may be driven, given the QEaaS buffer. */
export function treasuryFloorFor(perks: PerkSet | undefined): number {
  return hasPerk(perks, 'qe_as_a_service') ? TREASURY_FLOOR : 0;
}

/**
 * INVARIANT: [The Floor Is A CONSTANT, Not A RAMP]
 * `floor = min(deficit, D / DEBT_RECOVERY_CLICKS)`. The `min` is what makes the
 * loan EXACTLY self-liquidating: a constant rate retires the debt in precisely
 * `DEBT_RECOVERY_CLICKS` slams, and once the remaining debt drops under one
 * step's worth the floor is the debt itself, so the last slam lands on zero and
 * not on a surplus. A proportional-to-deficit ramp — the obvious first
 * implementation — was measured at only 63% repaid after a full window, because
 * a ramp pays a shrinking amount into a shrinking balance. It never prints
 * money either way, but "works the whole buffer off in one minute" has to be
 * true of the number the tooltip quotes.
 *
 * Because the floor lives inside `max(floor, product)` in `calculateClickValue`,
 * a dry, jammed, frenzy-capped slam repays at the same rate as a full one. The
 * recovery window is a property of the loan, not of the player's ink.
 *
 * @returns 0 when the treasury is solvent, or when the perk is not owned.
 */
export function debtReliefFloor(treasuryCash: number, perks: PerkSet | undefined): number {
  if (treasuryCash >= 0) return 0;
  if (!hasPerk(perks, 'qe_as_a_service')) return 0;
  return Math.min(-treasuryCash, QEAAAS_BUFFER / DEBT_RECOVERY_CLICKS);
}

// ---------------------------------------------------------------------------
// Perk 4 — Insider Exemption 401(k) (the auto-match)
// ---------------------------------------------------------------------------

export interface AutoMatchInput {
  readonly enabled: boolean;
  /** Wall-clock of the last match paid, or 0 if never. */
  readonly lastMatchTimestamp: number;
  /** Peak open-book value observed since the last match. */
  readonly peakBookValue: number;
  /** Open-book value right now. */
  readonly currentBookValue: number;
  readonly now: number;
}

export interface AutoMatchResult {
  /** Cash to credit this tick. */
  readonly payout: number;
  /** New peak, always at least the current value. */
  readonly peakBookValue: number;
  readonly lastMatchTimestamp: number;
  /** True on the frame a match was paid, for a one-shot readout. */
  readonly paid: boolean;
}

/**
 * Resolve the 401(k) blind-pool match.
 *
 * INVARIANT: [The Match Pays On PEAK, Then The Peak Resets To NOW]
 * Resetting the peak to the *current* book rather than to zero is what stops a
 * player from parking one enormous position and collecting the match on it
 * forever. After each payout the next window can only pay on movement that
 * happens inside it.
 *
 * INVARIANT: [A Match Needs A Live Position]
 * The payout is gated on `currentBookValue > 0`, NOT merely on the peak being
 * non-zero. The peak is state that OUTLIVES the positions that produced it: a
 * position settles, the book empties, and the peak from the window that contained
 * it is still sitting there. Paying on that charged the player 1.5% of a book
 * that no longer existed — measured live at $1,500 against a settled position, on
 * a window in which the player held nothing at all.
 *
 * The first version of this function read "an empty book peaks at zero", which
 * is true of a book that was ALWAYS empty and false of one that emptied. The
 * probe that "proved" the invariant started `peakBookValue` at 0 and so never
 * reached the case; a test that cannot fail is not a test.
 *
 * INVARIANT: [Nothing Here Compounds Per Second]
 * The interval is a flat 60s and a position cannot outlive two of them
 * (`TRADE_DURATION_MS` is the same 60s), so this is a bounded drip rather than
 * an annuity. See `AUTO_MATCH_HEAT` in the constants for the full argument.
 */
export function resolveAutoMatch(input: AutoMatchInput): AutoMatchResult {
  const peak = Math.max(input.peakBookValue, input.currentBookValue);

  // INVARIANT: [A Clock That Starts At Zero Is A Broken Clock]
  // `lastAutoMatchTimestamp` is deliberately NOT persisted — it is run state, and
  // a run's match history should not survive a filing. But that left a save
  // rehydrating it as `0`, and `now - 0` is about 56 years, so the very first
  // tick after every reload found the window "long overdue" and paid
  // immediately. Measured: a reload with a $100k position open paid $1,500, and
  // reloading paid it again, indefinitely — a faucet on a broken clock, and the
  // cheapest exploit in the game.
  //
  // The fix is to treat "never matched" as "the window opens now" rather than
  // "the window opened at the epoch". A first match therefore still has to wait
  // its 60 seconds, which is the only reading consistent with a 60s interval.
  if (!input.lastMatchTimestamp) {
    return {
      payout: 0,
      peakBookValue: peak,
      lastMatchTimestamp: input.now,
      paid: false,
    };
  }

  if (!input.enabled) {
    return {
      payout: 0,
      peakBookValue: peak,
      lastMatchTimestamp: input.lastMatchTimestamp,
      paid: false,
    };
  }

  const elapsedSeconds = (input.now - (input.lastMatchTimestamp || 0)) / 1000;
  const windowOpen = elapsedSeconds >= AUTO_MATCH_INTERVAL_SECONDS;
  // Two independent reasons to refuse, and both must hold up on their own.
  const noLivePosition = input.currentBookValue <= 0;
  if (!windowOpen || noLivePosition) {
    return {
      payout: 0,
      // The peak is dropped the moment the book empties, so a settled position
      // cannot leave a claim on a future window.
      peakBookValue: noLivePosition ? 0 : peak,
      lastMatchTimestamp: input.lastMatchTimestamp,
      paid: false,
    };
  }

  // INVARIANT: [The Payout Uses The CLIMBED Peak, Not The Stored One]
  // `peak` above is `max(stored, current)`. Paying `input.peakBookValue` instead
  // meant a book that had grown since the window opened was paid on the stale
  // figure — so a player who opened a large position 30 seconds ago was scored on
  // whatever the book was worth 30 seconds before that. The GDD says "1.5% of
  // peak trade", and the peak is the high-water mark INCLUDING now.
  const payout = peak * AUTO_MATCH_YIELD;
  return {
    payout,
    // Reset to NOW, not to zero — see [The Match Pays On Peak, Then The Peak
    // Resets To Now].
    peakBookValue: input.currentBookValue,
    lastMatchTimestamp: input.now,
    paid: payout > 0,
  };
}

/**
 * The current value of the open 0DTE book, in dollars.
 *
 * INVARIANT: a losing position contributes its locked collateral, not a
 * negative number. `settleExpiredTrades` floors the payout at zero for exactly
 * the same reason, so the match is computed on money the player could actually
 * bank by settling right now — never on a figure the settlement path would
 * refuse to pay.
 */
export function openBookValue(positionValues: readonly number[]): number {
  return positionValues.reduce((sum, v) => sum + Math.max(0, v), 0);
}

// ---------------------------------------------------------------------------
// Perk 5 — The Pardon Assembly Line
// ---------------------------------------------------------------------------

/**
 * The price of a liquidation, in Crony Favor, given the Pardon discount.
 *
 * INVARIANT: [The Quoted Price Is The Charged Price]
 * `DumpAgenciesTab` renders this and `dumpSlice.liquidateAgency` charges it, so
 * the two cannot drift — the same lesson as `calculateInkRefillTotal`, which
 * exists because a player was quoted $25 and charged $100.
 */
export function liquidationFavorCost(baseCost: number, perks: PerkSet | undefined): number {
  if (!hasPerk(perks, 'pardon_assembly_line')) return baseCost;
  return Math.floor(baseCost * (1 - PARDON_COST_REDUCTION));
}

/** True when the Pardon Assembly Line has abolished S.L.O.P. raids. */
export function raidsAbolished(perks: PerkSet | undefined): boolean {
  return hasPerk(perks, 'pardon_assembly_line');
}

// ---------------------------------------------------------------------------
// Perk 6 — The Golden Parachute Super-PAC
// ---------------------------------------------------------------------------

/**
 * The passive income rate carried into the next run.
 *
 * INVARIANT: [The Parachute Carries The Multiplier, Not The Department]
 * GDD §5 says "retain 15% of all department levels", and the roster has no
 * levels — an agency is liquidated or it is not. The only quantity a liquidation
 * actually produces is the passive multiplier, so that is what carries: 15% of
 * the rate you had, rather than 15% of a list of flags. Stating it this way in
 * the card keeps the copy and the engine saying the same thing.
 *
 * @returns 0 without the perk, so the reset still zeroes the faucet.
 */
export function retainedPassiveRate(
  passiveCashPerSecond: number,
  perks: PerkSet | undefined
): number {
  if (!hasPerk(perks, 'golden_parachute')) return 0;
  return Math.max(0, passiveCashPerSecond) * PARACHUTE_RETENTION;
}
