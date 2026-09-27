/**
 * D.U.M.P. Slice: Manages federal agency liquidations and disaster capitalism perks.
 */

import type { StateCreator } from 'zustand';
import type { DumpState } from '../../types/dump';
import type { GameStore } from '../useGameStore';
import { INITIAL_AGENCIES } from '../../constants/agencies';
import { sound } from '../../audio/soundEngine';

export interface DumpSlice extends DumpState {
  liquidateAgency: (agencyId: string) => number;
  monetizeHazard: (revenue: number) => void;
}

export const createDumpSlice: StateCreator<GameStore, [], [], DumpSlice> = (set, get) => ({
  agencies: [...INITIAL_AGENCIES],
  totalCashHarvested: 0,
  activeHazardsCount: 0,
  disasterCapitalismRevenue: 0,

  liquidateAgency: (agencyId) => {
    const state = get();
    const agencyIndex = state.agencies.findIndex((a) => a.id === agencyId);
    if (agencyIndex === -1) return 0;

    const targetAgency = state.agencies[agencyIndex];
    if (targetAgency.isLiquidated) return 0;

    // INVARIANT: Anti-Exploit Gate — Must have political capital (Crony Favor)
    if (state.cronyFavor < targetAgency.cronyFavorCost) return 0;

    // INVARIANT: Progression Gate — Must meet minimum net worth
    if (state.treasuryCash < targetAgency.minNetWorthRequired) return 0;

    const updatedAgencies = [...state.agencies];
    updatedAgencies[agencyIndex] = {
      ...targetAgency,
      isLiquidated: true,
      liquidatedAtTimestamp: Date.now(),
    };

    sound.playChaChing();

    // Multiply passive cash per second, establishing base passive cash if 0
    const basePassive = state.passiveCashPerSecond > 0 ? state.passiveCashPerSecond : 10.0;
    const newPassive = basePassive * targetAgency.passivePerkMultiplier;

    set({
      treasuryCash: state.treasuryCash + targetAgency.liquidationCashYield,
      cronyFavor: state.cronyFavor - targetAgency.cronyFavorCost,
      slopSuspicion: Math.min(100, state.slopSuspicion + 15),
      passiveCashPerSecond: newPassive,
      agencies: updatedAgencies,
      totalCashHarvested: state.totalCashHarvested + targetAgency.liquidationCashYield,
      activeHazardsCount: state.activeHazardsCount + 1,
    });

    return targetAgency.liquidationCashYield;
  },

  monetizeHazard: (revenue) => {
    const state = get();
    sound.playChaChing();
    set({
      treasuryCash: state.treasuryCash + revenue,
      disasterCapitalismRevenue: state.disasterCapitalismRevenue + revenue,
    });
  },
});
