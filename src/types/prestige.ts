/**
 * Prestige, Sovereign Immunity & Ontological Types
 */

export interface PrestigePerk {
  id: string;
  name: string;
  description: string;
  costInSIS: number;
  isUnlocked: boolean;
  multiplier: number;
}

export interface OntologicalTariff {
  id: string;
  target: 'THE_SUN' | 'THE_FUTURE' | 'THERMODYNAMICS' | 'ALPHA_CENTAURI';
  name: string;
  ratePercentage: number;
  exponentialCostFormula: string;
  unlocked: boolean;
}

export interface PrestigeState {
  /** Tier 1 Prestige Currency */
  sovereignImmunitySlips: number;
  totalSISLifetime: number;
  flightToCaymansCount: number;
  unlockedPerks: Record<string, boolean>;

  /** Tier 2 Prestige Currency */
  executiveDecrees: number;
  totalDecreesLifetime: number;
  americaLLCIncorporated: boolean;

  /** Phase 4 Ontological Protectionism */
  ontologicalTariffs: OntologicalTariff[];
  entropyDeficit: number;
}
