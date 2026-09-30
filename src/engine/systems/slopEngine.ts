/**
 * S.L.O.P. Engine — PURE suspicion decay and Special Counsel raid resolution.
 *
 * INVARIANT: [Headless Game Logic Belongs in src/engine/]
 * No React, no Zustand, no store reads, no audio.
 *
 * EXTRACTED FROM `tradingSlice.tickMarket`. The S.L.O.P. radar is a whole
 * subsystem (heat, decay, raid enforcement, bribe-and-shred defenses) and it
 * was interleaved with price simulation and option settlement inside a single
 * 180-line tick. It now reads as the standalone rule set it actually is.
 *
 * DESIGN INTENT: heat is a spendable resource. Every way of making money —
 * YAPs, classified secrets, the money printer — adds heat, and heat decays
 * slowly. So the player is always trading profit against exposure, and the raid
 * is the enforcement that makes the exposure real rather than cosmetic.
 *
 * INVARIANT: [A Raid Always Leaves You Able To Click]
 * The seizure holds a SOLVENT player at $10 rather than taking the last of their
 * money, so a raid is humiliating rather than terminal. It is deliberately NOT
 * applied to a player already under $10 — see the note on the seizure below —
 * because lifting a negative balance to $10 would be a money printer once QE As A
 * Service exists. A player under $10 is caught by the Red Phone bailout, which is
 * gated at `< $10` for exactly this case, and by the clicker's own bankruptcy
 * floor either way. That is where the anti-soft-lock guarantee actually lives;
 * this line only ever hardened it.
 */

import { CRONY_FAVOR_MAX } from '../../constants/balance';

/** Heat bleeds off passively at this rate per second. */
export const SLOP_DECAY_PER_SECOND = 0.2;

/**
 * Heat at which the radar reads CRITICAL, and the app root lights the panic
 * wash. Lifted out of `SlopRadarTab` in Phase 2.1 because two surfaces now need
 * the same number: the tab's own status word, and the cockpit-wide alarm. A
 * second copy would let the radar say CRITICAL while the room stayed calm.
 */
export const SLOP_CRITICAL_THRESHOLD = 75;

/** Heat at which the radar reads ELEVATED. Below this it is DOCILE. */
export const SLOP_ELEVATED_THRESHOLD = 50;

/**
 * Minimum gap between raids, so one bad trade cannot chain-seize repeatedly.
 *
 * Exported in SECONDS as well, because the S.L.O.P. radar and the perk copy
 * quote the gap in seconds and the slice keeps milliseconds — the same split
 * `deskPropsSlice` makes for its shredder cooldown.
 */
const RAID_COOLDOWN_MS = 15000;
export const RAID_COOLDOWN_SECONDS = RAID_COOLDOWN_MS / 1000;

/**
 * Crony Favor needed to bribe the raid away.
 *
 * Exported because the cost is load-bearing player-facing information: the desk
 * shredder and the S.L.O.P. bribe are both priced against it, and both surfaces
 * now quote it so the player can weigh "five shreds or one bribe?" without
 * guessing. Keep it the single definition.
 */
export const RAID_BRIBE_COST = 50;

/** Heat restored after a successful bribe — a plea bargain, not a pardon. */
const BRIBE_HEAT_RESET = 25;

/** Heat restored after a plea agreement. */
const SEIZED_HEAT_RESET = 20;

/** Floor on the post-seizure treasury of a SOLVENT player. See `tickSlop`. */
const SEIZED_TREASURY_FLOOR = 10;

/** Minimum fine, so a poor player is not fined nothing. */
const MIN_FINE = 5000;

/** Fraction of the treasury confiscated on a raid. */
const FINE_FRACTION = 0.35;

export interface SlopInput {
  slopSuspicion: number;
  cronyFavor: number;
  treasuryCash: number;
  lastRaidTimestamp: number;
  deltaSeconds: number;
  now: number;
  /**
   * The Pardon Assembly Line perk (GDD §5 perk 5) abolishes raids outright.
   *
   * INVARIANT: heat still accrues and still decays — the meter is a readout the
   * player manages, and deleting the consequences without deleting the resource
   * would leave the whole S.L.O.P. channel as decoration. Only the ENFORCEMENT
   * is pardoned, which is exactly what the perk's name claims.
   */
  raidsAbolished: boolean;
}

export interface SlopResult {
  slopSuspicion: number;
  cronyFavor: number;
  treasuryCash: number;
  lastRaidTimestamp: number;
  /** Raid banner text, or the previous one if no raid fired. */
  lastRaidMessage: string | undefined;
  /** True when a raid resolved this tick. */
  raided: boolean;
  /** True when the raid was averted by a bribe rather than a seizure. */
  averted: boolean;
  /** Fine amount, for callers that want to log or animate it. */
  fineAmount: number;
}

/**
 * Apply passive decay and, if heat is at 100%, resolve a Special Counsel raid.
 *
 * INVARIANT: the raid check reads the PRE-decay suspicion. Decaying first would
 * mean a player hovering at exactly 100 could never be raided, because the
 * decay would pull them under the line before the check ran.
 *
 * INVARIANT: a bribe is preferred over a seizure whenever the player can afford
 * it, so the defense is always meaningfully cheaper than the punishment. That
 * is what makes S.L.O.P. a resource to manage rather than a random disaster.
 */
export function tickSlop(
  input: SlopInput,
  previousMessage: string | undefined
): SlopResult {
  const decayedSuspicion = Math.max(0, input.slopSuspicion - SLOP_DECAY_PER_SECOND * input.deltaSeconds);

  const base: SlopResult = {
    slopSuspicion: decayedSuspicion,
    cronyFavor: input.cronyFavor,
    treasuryCash: input.treasuryCash,
    lastRaidTimestamp: input.lastRaidTimestamp,
    lastRaidMessage: previousMessage,
    raided: false,
    averted: false,
    fineAmount: 0,
  };

  const raidReady =
    !input.raidsAbolished &&
    input.slopSuspicion >= 100 &&
    input.now - (input.lastRaidTimestamp || 0) > RAID_COOLDOWN_MS;
  if (!raidReady) return base;

  if (input.cronyFavor >= RAID_BRIBE_COST) {
    return {
      ...base,
      cronyFavor: input.cronyFavor - RAID_BRIBE_COST,
      slopSuspicion: BRIBE_HEAT_RESET,
      lastRaidTimestamp: input.now,
      lastRaidMessage: 'RAID AVERTED! Bribed Special Counsel with 50 Favor (-75% Heat).',
      raided: true,
      averted: true,
    };
  }

  const fineAmount = Math.max(MIN_FINE, Math.round(input.treasuryCash * FINE_FRACTION));
  // INVARIANT: [The Raid Floor Must Never LIFT A Negative Treasury]
  // `Math.max(10, cash - fine)` protects a solvent player from a destructive
  // fine — but it also SILENTLY LIFTS a negative treasury to $10, and QE As A
  // Service makes a negative treasury reachable on purpose. That turns "spend to
  // -$50B" into a money printer: go deep, get raided, wake up at $10.
  //
  // So the floor applies only to a player who HAD at least $10 to lose. Below
  // that the fine is charged in full — and the bankruptcy floor in
  // `calculateClickValue`, plus the Red Phone bailout's own `< $10` gate, are
  // what actually guarantee the raid cannot soft-lock anybody. The old docstring
  // credited this line with that job; it never did.
  const seized = input.treasuryCash - fineAmount;
  const treasuryCash =
    input.treasuryCash >= SEIZED_TREASURY_FLOOR
      ? Math.max(SEIZED_TREASURY_FLOOR, seized)
      : seized;
  return {
    ...base,
    treasuryCash,
    slopSuspicion: SEIZED_HEAT_RESET,
    lastRaidTimestamp: input.now,
    lastRaidMessage: `DOJ RAID! Asset seizure executed: -$${fineAmount.toLocaleString()} (35% Treasury) confiscated!`,
    raided: true,
    averted: false,
    fineAmount,
  };
}

/** Clamp Crony Favor to its ceiling. */
export function clampCronyFavor(favor: number): number {
  return Math.min(CRONY_FAVOR_MAX, favor);
}
