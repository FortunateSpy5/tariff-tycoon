/**
 * Prestige, Sovereign Immunity & Ontological Types
 */

import type { PerkSet } from '../engine/systems/perkEngine';

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
  /**
   * The six GDD §5 perks, keyed by id.
   *
   * PROMOTED from `Record<string, boolean>`: a perk now has a cost and an
   * effect, and an untyped record is how a typo'd id would silently become a
   * free, permanent, invisible upgrade. `PerkSet` is the engine's own shape, so
   * the store and `perkEngine` cannot disagree about what "owned" means.
   */
  unlockedPerks: PerkSet;

  /** Tier 2 Prestige Currency */
  executiveDecrees: number;
  totalDecreesLifetime: number;
  americaLLCIncorporated: boolean;

  /** Phase 4 Ontological Protectionism */
  ontologicalTariffs: OntologicalTariff[];
  entropyDeficit: number;

  /** Seconds left on the running 280-Character Flash Dip, or 0. */
  flashDipSecondsRemaining: number;
  /** Lifetime Flash Dips fired, for the perk's readout. */
  totalFlashDipsTriggered: number;
  /** Peak open 0DTE book value since the last 401(k) match. */
  peakBookValue: number;
  /** Wall-clock of the last 401(k) match paid. */
  lastAutoMatchTimestamp: number;
  /** Lifetime 401(k) match payouts, in dollars. */
  totalAutoMatchPaid: number;
  /** One-shot readout for the last match, cleared by the next one. */
  lastAutoMatchNotice: string | undefined;
}
