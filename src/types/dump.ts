/**
 * D.U.M.P. (Department of Unilateral Market Pruning) Types
 * Manages federal agency liquidations, passive perks, and comedic disasters.
 */

export interface AgencyLiquidation {
  id: string;
  name: string;
  acronym: string;
  satiricalMission: string;
  liquidationCashYield: number; // Immediate cash injection
  perkDescription: string;
  passivePerkMultiplier: number;
  hazardDescription: string;
  hazardPenaltyPercentage: number;
  isLiquidated: boolean;
  liquidatedAtTimestamp?: number;
  cronyFavorCost: number; // Political capital required to dismantle agency
  minNetWorthRequired: number; // Minimum liquid treasury required to unlock liquidation
}

export interface DumpState {
  agencies: AgencyLiquidation[];
  totalCashHarvested: number;
  activeHazardsCount: number;
  disasterCapitalismRevenue: number;
}
