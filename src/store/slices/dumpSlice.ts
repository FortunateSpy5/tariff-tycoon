/**
 * D.U.M.P. Slice: Manages federal agency liquidations and disaster capitalism perks.
 */

import type { StateCreator } from 'zustand';
import type { DumpState } from '../../types/dump';
import type { AgencyLiquidation } from '../../types/dump';
import type { GameStore } from '../useGameStore';
import { INITIAL_AGENCIES } from '../../constants/agencies';
import { CRONY_FAVOR_LIQUIDATION_KICKBACK_RATIO } from '../../constants/balance';
import { canAfford, liquidationFavorCost, type PerkSet } from '../../engine/systems/perkEngine';
import { clampCronyFavor } from '../../engine/systems/slopEngine';
import { sound } from '../../audio/soundEngine';

export interface DumpSlice extends DumpState {
  liquidateAgency: (agencyId: string) => number;
  monetizeHazard: (revenue: number) => void;
}

/**
 * The Crony Favor price of one liquidation, after the Pardon Assembly Line.
 *
 * INVARIANT: [The Quoted Price Is The Charged Price]
 * `DumpAgenciesTab` renders this and `liquidateAgency` charges it, because the
 * perk's whole value is a number the player reads on a card. A discount applied
 * in the store and not in the render is the `calculateInkRefillTotal` defect
 * again, and the plan records that one as having shipped a real overcharge.
 */
export function agencyFavorCost(agency: AgencyLiquidation, perks: PerkSet | undefined): number {
  return liquidationFavorCost(agency.cronyFavorCost, perks);
}

export const createDumpSlice: StateCreator<GameStore, [], [], DumpSlice> = (set, get) => ({
  agencies: [...INITIAL_AGENCIES],
  totalCashHarvested: 0,
  activeHazardsCount: 0,
  disasterCapitalismRevenue: 0,

  liquidateAgency: (agencyId) => {
    const state = get();
    if (state.phase < 2) return 0;
    const agencyIndex = state.agencies.findIndex((a) => a.id === agencyId);
    if (agencyIndex === -1) return 0;

    const targetAgency = state.agencies[agencyIndex];
    if (targetAgency.isLiquidated) return 0;

    // The Pardon Assembly Line discount, resolved through the same helper the
    // D.U.M.P. tab prices its cards with. See `agencyFavorCost` above.
    const favorCost = agencyFavorCost(targetAgency, state.unlockedPerks);

    // INVARIANT: Anti-Exploit Gate — Must have political capital (Crony Favor)
    if (state.cronyFavor < favorCost) return 0;

    // INVARIANT: Progression Gate — Must meet minimum net worth. `canAfford` is
    // the same predicate every other spend uses, so the QE As A Service buffer
    // reaches the guillotine too.
    if (!canAfford(state.treasuryCash, targetAgency.minNetWorthRequired, state.unlockedPerks)) {
      return 0;
    }

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

    // Crony Favor faucet: disaster-capitalism kickback — liquidating an agency returns
    // a fraction of its favor cost as fresh political capital. Charged on the
    // DISCOUNTED price, because that is what was actually paid.
    const favorKickback = Math.floor(favorCost * CRONY_FAVOR_LIQUIDATION_KICKBACK_RATIO);

    set({
      treasuryCash: state.treasuryCash + targetAgency.liquidationCashYield,
      cronyFavor: clampCronyFavor(state.cronyFavor - favorCost + favorKickback),
      slopSuspicion: Math.min(100, state.slopSuspicion + 15),
      passiveCashPerSecond: newPassive,
      agencies: updatedAgencies,
      hasCronyUnlocksAccess: true,
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
