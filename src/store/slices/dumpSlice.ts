/**
 * D.U.M.P. Slice: Manages federal agency liquidations and disaster capitalism perks.
 */

import type { StateCreator } from 'zustand';
import type { DumpState } from '../../types/dump';
import { INITIAL_AGENCIES } from '../../constants/agencies';
import { sound } from '../../audio/soundEngine';

export interface DumpSlice extends DumpState {
  liquidateAgency: (agencyId: string) => number;
  monetizeHazard: (revenue: number) => void;
}

export const createDumpSlice: StateCreator<DumpSlice, [], [], DumpSlice> = (set, get) => ({
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

    const updatedAgencies = [...state.agencies];
    updatedAgencies[agencyIndex] = {
      ...targetAgency,
      isLiquidated: true,
      liquidatedAtTimestamp: Date.now(),
    };

    sound.playChaChing();

    set({
      agencies: updatedAgencies,
      totalCashHarvested: state.totalCashHarvested + targetAgency.liquidationCashYield,
      activeHazardsCount: state.activeHazardsCount + 1,
    });

    return targetAgency.liquidationCashYield;
  },

  monetizeHazard: (revenue) => {
    const state = get();
    set({
      disasterCapitalismRevenue: state.disasterCapitalismRevenue + revenue,
    });
  },
});
