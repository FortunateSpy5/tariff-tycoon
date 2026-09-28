/**
 * Crisis Slice: The 3:00 AM Crisis Call on the Red Rotary Phone.
 *
 * WHY THIS IS A SEPARATE SLICE:
 * The crisis mechanic is self-contained — five state fields, three actions, its
 * own constants file (`constants/crisis.ts`), its own pure engine module
 * (`engine/systems/crisisEngine.ts`) and its own desk prop. It was previously
 * interleaved through `deskSlice`, which pushed that file past the 400-line hard
 * ceiling in AGENTS.md and made every crisis change a desk-wide review.
 *
 * INVARIANT: [The Crisis Call]
 * A crisis is always ticking toward zero. Answering it early pays a smaller
 * multiple and adds less S.L.O.P. heat; letting it ring to full escalation pays
 * much more but burns far more political capital. Ignoring it entirely resolves
 * as a SUPPRESSED failure — no payout, no heat, but the tantrum is forfeited.
 *
 * See `constants/crisis.ts` for the design thesis and `engine/systems/
 * crisisEngine.ts` for the pure escalation logic. All mutation flows through
 * `set`, so the desk slice and the crisis slice can coexist on one store
 * without either reaching into the other's internals.
 */

import type { StateCreator } from 'zustand';
import type { GameStore } from '../useGameStore';
import { CRISIS_HEAT_PER_TIER, CRISIS_TANTRUM_REWARD } from '../../constants/crisis';
import {
  crisisIntervalForPhase,
  crisisPayout,
  crisisSeverityAt,
  crisisTierForElapsed,
  type ActiveCrisis,
} from '../../engine/systems/crisisEngine';
import { formatCurrency } from '../../engine/math/bigNumber';
import { sound } from '../../audio/soundEngine';

export interface CrisisSlice {
  // ---- Crisis Call state ------------------------------------------------
  /** A live 3:00 AM crisis awaiting a decision, or null when the phone is quiet. */
  activeCrisis: ActiveCrisis | null;
  /** Seconds until the next crisis spawns. Only counts down when the phone is quiet. */
  crisisCooldownSeconds: number;
  /** Lifetime crises answered via SWEAR IN. */
  totalCrisesAnswered: number;
  /** Lifetime crises that expired unanswered (suppressed). */
  totalCrisesSuppressed: number;
  /** Most recent Crisis Call outcome, rendered as a transient desk notice. */
  lastCrisisOutcome: string | undefined;

  // ---- Crisis Call actions ----------------------------------------------
  /** Answer the ringing crisis. Pays out scaled by escalation tier. */
  swearInCrisis: () => boolean;
  /** Decline the ringing crisis. Legal, but forfeits the tantrum it was feeding. */
  suppressCrisis: () => boolean;
  /** Clear the outcome notice once the player has read it. */
  dismissCrisisOutcome: () => void;
}

export const createCrisisSlice: StateCreator<GameStore, [], [], CrisisSlice> = (set, get) => ({
  activeCrisis: null,
  crisisCooldownSeconds: 8,
  totalCrisesAnswered: 0,
  totalCrisesSuppressed: 0,
  lastCrisisOutcome: undefined,

  /**
   * SWEAR IN: answer the crisis at whatever tier it has currently reached.
   *
   * INVARIANT: answering early is the low-heat, low-payout option; waiting for
   * full escalation is the high-heat, high-payout option. That trade is the
   * whole point of the mechanic, so the payout MUST be read from the crisis's
   * own elapsed time and never from a fixed tier.
   */
  swearInCrisis: () => {
    const state = get();
    const crisis = state.activeCrisis;
    if (!crisis) return false;

    const tier = crisisTierForElapsed(crisis.elapsedSeconds);
    const payout = crisisPayout(state.phase, crisis.elapsedSeconds);
    const severity = crisisSeverityAt(crisis.elapsedSeconds);
    const heat = CRISIS_HEAT_PER_TIER * (tier + 1);

    sound.playChaChing();
    set({
      treasuryCash: state.treasuryCash + payout,
      lifetimeCashEarned: state.lifetimeCashEarned + payout,
      slopSuspicion: Math.min(100, state.slopSuspicion + heat),
      tantrumMeter: Math.min(100, state.tantrumMeter + CRISIS_TANTRUM_REWARD),
      activeCrisis: null,
      crisisCooldownSeconds: crisisIntervalForPhase(state.phase),
      totalCrisesAnswered: state.totalCrisesAnswered + 1,
      lastCrisisOutcome: `SWEAR IN // ${severity} // +${formatCurrency(payout)} TREASURY // +${heat}% HEAT`,
    });
    return true;
  },

  /**
   * SUPPRESS: decline the crisis without answering it.
   *
   * INVARIANT: suppression is always a legal escape hatch, but it forfeits the
   * crisis tantrum and resets the phone, so it is a real (if passive) choice —
   * never a free out.
   */
  suppressCrisis: () => {
    const state = get();
    if (!state.activeCrisis) return false;

    sound.playDeskThud();
    set({
      activeCrisis: null,
      crisisCooldownSeconds: crisisIntervalForPhase(state.phase),
      totalCrisesSuppressed: state.totalCrisesSuppressed + 1,
      lastCrisisOutcome: 'SUPPRESSED // Statement issued. Nothing improved. Tantrum wasted.',
    });
    return true;
  },

  dismissCrisisOutcome: () => set({ lastCrisisOutcome: undefined }),
});
