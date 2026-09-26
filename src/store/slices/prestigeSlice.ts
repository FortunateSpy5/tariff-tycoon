/**
 * Prestige Slice: Manages Sovereign Immunity Slips (SIS), America LLC, and Ontological Tariffs.
 */

import type { StateCreator } from 'zustand';
import type { PrestigeState } from '../../types/prestige';
import type { GameStore } from '../useGameStore';
import { calculatePrestigeSIS } from '../../engine/math/formulas';
import { INITIAL_AGENCIES } from '../../constants/agencies';
import { sound } from '../../audio/soundEngine';

export interface PrestigeSlice extends PrestigeState {
  executeFlightToCaymans: () => number;
  unlockPerk: (perkId: string, cost: number) => boolean;
  incorporateAmericaLLC: () => void;
}

export const createPrestigeSlice: StateCreator<GameStore, [], [], PrestigeSlice> = (set, get) => ({
  sovereignImmunitySlips: 0,
  totalSISLifetime: 0,
  flightToCaymansCount: 0,
  unlockedPerks: {},
  executiveDecrees: 0,
  totalDecreesLifetime: 0,
  americaLLCIncorporated: false,
  ontologicalTariffs: [],
  entropyDeficit: 0,

  executeFlightToCaymans: () => {
    const state = get();
    const earnedSIS = calculatePrestigeSIS(state.treasuryCash);
    if (earnedSIS <= 0) return 0;

    sound.playChaChing();

    // Full run soft-reset (retaining lifetime SIS and permanent perks)
    set({
      treasuryCash: 100.0,
      passiveCashPerSecond: 0,
      phase: 1,
      inkLevel: 100,
      inkRefillCount: 0,
      tantrumMeter: 0,
      isCapsFrenzy: false,
      capsFrenzySecondsRemaining: 0,
      activeTrades: [],
      agencies: INITIAL_AGENCIES.map((a) => ({ ...a, isLiquidated: false })),
      sovereignImmunitySlips: state.sovereignImmunitySlips + earnedSIS,
      totalSISLifetime: state.totalSISLifetime + earnedSIS,
      flightToCaymansCount: state.flightToCaymansCount + 1,
    });

    return earnedSIS;
  },

  unlockPerk: (perkId, cost) => {
    const state = get();
    if (state.sovereignImmunitySlips < cost) return false;

    set({
      sovereignImmunitySlips: state.sovereignImmunitySlips - cost,
      unlockedPerks: {
        ...state.unlockedPerks,
        [perkId]: true,
      },
    });
    sound.playChaChing();
    return true;
  },

  incorporateAmericaLLC: () => {
    const state = get();
    if (state.treasuryCash < 1e24) return; // $10^24 required for Delaware C-Corp

    sound.playDeskThud();
    set({
      americaLLCIncorporated: true,
      executiveDecrees: state.executiveDecrees + 10,
      totalDecreesLifetime: state.totalDecreesLifetime + 10,
    });
  },
});
