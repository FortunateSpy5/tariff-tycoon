/**
 * Prestige Slice: Manages Sovereign Immunity Slips (SIS), America LLC, and Ontological Tariffs.
 */

import type { StateCreator } from 'zustand';
import type { PrestigeState } from '../../types/prestige';
import { calculatePrestigeSIS } from '../../engine/math/formulas';
import { sound } from '../../audio/soundEngine';

export interface PrestigeSlice extends PrestigeState {
  executeFlightToCaymans: (currentNetWorth: number) => number;
  unlockPerk: (perkId: string, cost: number) => boolean;
  incorporateAmericaLLC: () => void;
}

export const createPrestigeSlice: StateCreator<PrestigeSlice, [], [], PrestigeSlice> = (set, get) => ({
  sovereignImmunitySlips: 0,
  totalSISLifetime: 0,
  flightToCaymansCount: 0,
  unlockedPerks: {},
  executiveDecrees: 0,
  totalDecreesLifetime: 0,
  americaLLCIncorporated: false,
  ontologicalTariffs: [],
  entropyDeficit: 0,

  executeFlightToCaymans: (currentNetWorth) => {
    const earnedSIS = calculatePrestigeSIS(currentNetWorth);
    if (earnedSIS <= 0) return 0;

    const state = get();
    sound.playChaChing();

    set({
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
    sound.playDeskThud();
    set({
      americaLLCIncorporated: true,
      executiveDecrees: state.executiveDecrees + 10,
      totalDecreesLifetime: state.totalDecreesLifetime + 10,
    });
  },
});
