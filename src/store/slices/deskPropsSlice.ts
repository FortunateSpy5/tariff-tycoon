/**
 * Desk Props Slice: the four physical objects on the blotter.
 *
 * Red Phone bailout, Gold Box (classified secrets), Subpoena Shredder and the
 * Broad Daylight Money Printer.
 *
 * WHY THIS IS A SEPARATE SLICE:
 * These are four self-contained, cooldown-gated interactions with their own
 * `<RedPhoneProp>`, `<GoldBoxProp>` and `<SubpoenaShredderProp>` components. They
 * were interleaved through `deskSlice`, pushing it past the 400-line hard
 * ceiling in AGENTS.md. They are also the most "pokey" part of the game — small
 * discrete actions that nobody balances together, so they have no reason to
 * live in the same file as the clicker economy.
 *
 * INVARIANT: [Every Prop Is Gated]
 * No prop may be spammable. Each carries at minimum a cooldown or a resource
 * cost, and each grants S.L.O.P. suspicion. The payouts below are deliberately
 * generous relative to their cost: these are panic buttons, not a strategy.
 */

import type { StateCreator } from 'zustand';
import type { GameStore } from '../useGameStore';
import { canShredSubpoenas } from '../../engine/systems/unlockEngine';
import { hasPerk, type PerkSet } from '../../engine/systems/perkEngine';
import { sound } from '../../audio/soundEngine';

/** Only callable when the treasury is below this — it is a rescue, not a faucet. */
const BAILOUT_BROKE_THRESHOLD = 10;

/** Flat payout of the Red Phone bailout, scaled by phase. */
const BAILOUT_BASE_AMOUNT = 5000;

/** Classified secrets: seconds between sales, waived when truly broke. */
const SECRET_SALE_COOLDOWN_MS = 8000;

/** Below this treasury, a secret sale ignores its cooldown as an emergency sale. */
const SECRET_SALE_BROKE_THRESHOLD = 50;

const SECRET_SALE_PAYOUT = 500;
const SECRET_SALE_HEAT = 8;

/**
 * INVARIANT: [A Rescue Must Not Become A Faucet]
 * Every "you are broke, so this is free" waiver in the game — the Red Phone
 * bailout, the Gold Box emergency sale — was self-limiting for one reason only:
 * each payout was large enough to push the treasury back ABOVE the broke
 * threshold, which re-armed the cooldown on the very next frame. A player at $5
 * could therefore take exactly one bailout and one emergency sale.
 *
 * QE As A Service breaks that assumption completely. A player at -$50B is below
 * every broke threshold and no payout will ever lift them above it, so each
 * waiver stops being self-limiting and becomes an unlimited click. Measured with
 * the perk owned: the bailout fired **200 times in 200 clicks** for $25,000 a
 * click, and the Gold Box fired **300 times in 300 clicks** for $500 a click —
 * both with no cooldown and no upper bound. A $50 loan was the most profitable
 * thing in the game.
 *
 * The fix is the gate, not a cooldown: a rescue is available to a player who is
 * *low*, never to one who is *in debt*, because a debt is repaid by the click
 * floor (`debtReliefFloor`) and does not need rescuing. `isBrokeNotInDebt` is the
 * single definition, so the two waivers cannot drift apart on this again.
 */
export function isBrokeNotInDebt(treasuryCash: number, perks: PerkSet | undefined, threshold: number): boolean {
  return treasuryCash < threshold && !hasPerk(perks, 'qe_as_a_service');
}

/** Crony Favor consumed to shred a subpoena. */
const SHRED_FAVOR_COST = 10;
const SHRED_COOLDOWN_MS = 5000;
const SHRED_HEAT_RELIEF = 25;

/**
 * INVARIANT: [The Slice Is The Single Source For These, Not The Components]
 * `SubpoenaShredderProp` re-typed `SHRED_FAVOR_COST = 10`, `SHRED_COOLDOWN_SECONDS
 * = 5` and `SHRED_HEAT_RELIEF = 25` as locals, and `GoldBoxProp` / `SlopRadarTab`
 * did the same for the sale and bribe constants, each under a "mirrors X in Y"
 * comment. That is a lie waiting for a balance pass: retune the shred price here
 * and three tooltips start quoting a number the engine does not charge, with no
 * type error and no test failure to catch it. `RAID_BRIBE_COST` and
 * `PRINTER_COOLDOWN_SECONDS` were already promoted out for exactly this reason
 * and are exported below; these are the same case, one layer behind.
 *
 * `COOLDOWN_SECONDS` is exported in SECONDS where the slice keeps MILLISECONDS,
 * because that is the unit the UI actually shows.
 */
export const SHRED_COOLDOWN_SECONDS = SHRED_COOLDOWN_MS / 1000;
export { SHRED_FAVOR_COST, SHRED_HEAT_RELIEF };
export { SECRET_SALE_PAYOUT, SECRET_SALE_HEAT };
export const SECRET_SALE_COOLDOWN_SECONDS = 8;
export const BROKE_THRESHOLD = SECRET_SALE_BROKE_THRESHOLD;

/** The Money Printer: a big payout on a long cooldown. */
const PRINTER_COOLDOWN_MS = 60000;
const PRINTER_PAYOUT = 100000;
/**
 * Exported because the printer button quotes it in its hover copy, and a
 * tuning change must not leave the tooltip describing a different number than
 * the button charges. Same reasoning as `RAID_BRIBE_COST`.
 */
export const PRINTER_HEAT = 15;

export interface DeskPropsSlice {
  /** Timestamp of the last classified-secrets sale (cooldown gate). */
  lastSecretSaleTimestamp: number;
  /** Timestamp of the last subpoena shred (cooldown gate). */
  lastShredTimestamp: number;
  /** Timestamp of the last emergency cash print (cooldown gate). */
  lastPrinterTimestamp: number;

  /** Rescue payout. Only available when nearly broke. */
  triggerRedPhoneBailout: () => boolean;
  /** Sell a classified secret for cash at the cost of S.L.O.P. suspicion. */
  sellClassifiedSecrets: () => boolean;
  /** Shred a subpoena: burns Crony Favor to shed S.L.O.P. heat. */
  shredSubpoenas: () => boolean;
  /** Print emergency cash. Requires the Broad Daylight Money Printer upgrade. */
  printEmergencyCash: () => boolean;
}

export const createDeskPropsSlice: StateCreator<GameStore, [], [], DeskPropsSlice> = (set, get) => ({
  lastSecretSaleTimestamp: 0,
  lastShredTimestamp: 0,
  lastPrinterTimestamp: 0,

  triggerRedPhoneBailout: () => {
    const state = get();
    // INVARIANT: [A Rescue Must Not Become A Faucet] — see the full note above.
    // This action has NO cooldown and never had one; the only thing stopping a
    // spam was that $25,000 lifted the treasury over the $10 threshold. With
    // QE As A Service that lift never happens, and the button became an
    // unlimited $25,000-per-click faucet (measured: 200/200).
    if (!isBrokeNotInDebt(state.treasuryCash, state.unlockedPerks, BAILOUT_BROKE_THRESHOLD)) {
      return false;
    }

    sound.playChaChing();
    set({ treasuryCash: state.treasuryCash + BAILOUT_BASE_AMOUNT * (1 + state.phase) });
    return true;
  },

  sellClassifiedSecrets: () => {
    const state = get();
    const now = Date.now();
    const elapsed = now - (state.lastSecretSaleTimestamp || 0);

    // INVARIANT: the cooldown is waived only as a true emergency sale, so a
    // broke player can always act but a wealthy one cannot spam the box. And
    // never for a player in QE As A Service debt — see [A Rescue Must Not
    // Become A Faucet] above, which is where the measurement lives.
    const isBroke = isBrokeNotInDebt(state.treasuryCash, state.unlockedPerks, SECRET_SALE_BROKE_THRESHOLD);
    if (elapsed < SECRET_SALE_COOLDOWN_MS && !isBroke) {
      return false;
    }

    sound.playChaChing();
    set({
      treasuryCash: state.treasuryCash + SECRET_SALE_PAYOUT,
      slopSuspicion: Math.min(100, state.slopSuspicion + SECRET_SALE_HEAT),
      lastSecretSaleTimestamp: now,
    });
    return true;
  },

  shredSubpoenas: () => {
    const state = get();
    const now = Date.now();

    // INVARIANT: the shredder is an Oval Office instrument — see `unlockEngine`.
    if (!canShredSubpoenas(state)) return false;
    if (now - (state.lastShredTimestamp || 0) < SHRED_COOLDOWN_MS) return false;
    // INVARIANT: Cost gate — shredding federal paper costs political capital.
    if (state.cronyFavor < SHRED_FAVOR_COST) return false;

    sound.playDeskThud();
    set({
      cronyFavor: state.cronyFavor - SHRED_FAVOR_COST,
      slopSuspicion: Math.max(0, state.slopSuspicion - SHRED_HEAT_RELIEF),
      lastShredTimestamp: now,
    });
    return true;
  },

  printEmergencyCash: () => {
    const state = get();
    const now = Date.now();
    if (!state.activeUpgrades.includes('broad_daylight_printer')) return false;
    if (now - state.lastPrinterTimestamp < PRINTER_COOLDOWN_MS) return false;

    sound.playChaChing();
    set({
      treasuryCash: state.treasuryCash + PRINTER_PAYOUT,
      slopSuspicion: Math.min(100, state.slopSuspicion + PRINTER_HEAT),
      lastPrinterTimestamp: now,
    });
    return true;
  },
});
