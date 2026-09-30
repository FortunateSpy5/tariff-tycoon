/**
 * Income Breakdown — the cockpit's $/s readout, decomposed by source.
 *
 * WHY THIS IS A HEADLESS MODULE
 * `tariffRevenuePerSecond` is currently rendered in exactly two places (the
 * Tariffs tab header and the breaking-news bar), and `passiveCashPerSecond` in
 * none. Finding D in the plan is blunt about the consequence: the player cannot
 * see their income, what scales it, or what a dial bought them. Worse, the one
 * number that would answer it is behind a channel sealed until Phase 2.
 *
 * Every rate here is derived from the SAME engine the tick uses. The autopen row
 * in particular is the trap: `tickPassiveEconomy` pays a flat
 * `base * 5 * delta` that deliberately ignores both the Tungsten Nib and the
 * Sovereign Immunity Slips multiplier, so a readout that multiplied it by the
 * click yield would be a lie in the player's favour — the most expensive
 * direction to be wrong in. It is reproduced exactly, from its own constants.
 */

import { AUTOPEN_CLICKS_PER_SECOND, autopenBaseValueForPhase } from '../../engine/systems/passiveRates';
import type { GamePhase } from '../../types/desk';

export interface IncomeSource {
  readonly id: 'agency' | 'autopen' | 'tariff';
  /** Short label for the breakdown row. */
  readonly label: string;
  /** Dollars per second from this source alone. */
  readonly perSecond: number;
  /**
   * Why this source is paying nothing, or null when it is paying.
   * A silent zero reads as a bug; a named zero reads as a decision.
   */
  readonly dormantBecause: string | null;
}

export interface IncomeBreakdown {
  /** Every source, always all three — a hidden row is a hidden lever. */
  readonly sources: readonly IncomeSource[];
  /** Sum of the three. This is the number the player plans around. */
  readonly totalPerSecond: number;
  /** The largest single contributor, for the headline attribution. */
  readonly largestId: IncomeSource['id'] | null;
}

export function readIncomeBreakdown(input: {
  phase: GamePhase;
  /** Agency liquidation passive rate, from the store. */
  passiveCashPerSecond: number;
  /** Bilateral tariff duty rate, from the store. */
  tariffRevenuePerSecond: number;
  hasAutopenArmy: boolean;
  /** How many of the six dials are off zero, for the dormant copy. */
  activeTariffCount: number;
}): IncomeBreakdown {
  const agency = Math.max(0, input.passiveCashPerSecond);
  const tariff = Math.max(0, input.tariffRevenuePerSecond);
  // INVARIANT: [The Autopen Row Is The Engine's Number, Not The Click Yield]
  // `tickPassiveEconomy` pays a flat rate that ignores the Tungsten Nib, the
  // Slips multiplier and the phase tap multiplier. Multiplying it by the click
  // yield here would overstate it by up to 20x for a late-game player.
  const autopen = input.hasAutopenArmy
    ? autopenBaseValueForPhase(input.phase) * AUTOPEN_CLICKS_PER_SECOND
    : 0;

  const sources: IncomeSource[] = [
    {
      id: 'agency',
      label: 'AGENCY PASSIVE',
      perSecond: agency,
      dormantBecause: agency > 0 ? null : 'No agency liquidated yet — the guillotine pays passively once one is.',
    },
    {
      id: 'autopen',
      label: 'AUTOPEN INTERNS',
      perSecond: autopen,
      dormantBecause: input.hasAutopenArmy
        ? null
        : 'AI Autopen Interns not bought. A flat rate that ignores your Slips and your nib, by design.',
    },
    {
      id: 'tariff',
      label: 'BILATERAL DUTIES',
      perSecond: tariff,
      dormantBecause:
        input.activeTariffCount > 0
          ? null
          : 'Every dial is at zero. This is the one faucet that pays with the tab shut — turn one.',
    },
  ];

  const totalPerSecond = sources.reduce((sum, s) => sum + s.perSecond, 0);
  const largest = sources.reduce<IncomeSource | null>(
    (best, s) => (s.perSecond > 0 && (!best || s.perSecond > best.perSecond) ? s : best),
    null
  );

  return { sources, totalPerSecond, largestId: largest ? largest.id : null };
}
