/**
 * Right-deck footer readout — how far the treasury is from the next rung.
 *
 * WHY THIS EXISTS:
 * The right wing's status strip read `CABINET GOVERNANCE` / `READY`. `READY`
 * was the only variable in it and it never changed, so the strip consumed a
 * permanent strip of screen to say nothing. The audit's verdict was "dead —
 * never changes: delete, or replace with a live readout."
 *
 * This is the live replacement, chosen because it is the one number that is
 * not shown anywhere else in the cockpit and always carries stakes: the phase
 * ladder. Phase 1 ($0 -> $1M) is the tutorial wall, Phase 2 ($1M -> $100B) is
 * the Oval Office, and Phase 3 is Fortress America. A player who can see the
 * gap to the next one stops guessing whether to slam or invest.
 *
 * Headless and pure: no React, no store reads.
 */

import { PHASE_CASH_THRESHOLDS } from '../../engine/systems/phaseEngine';
import { formatCurrency } from '../../engine/math/bigNumber';
import type { GamePhase } from '../../types/desk';

/**
 * Below this fraction of the next rung, report the shortfall instead of the
 * target — a concrete "how much more" beats a distant round number.
 */
const NEAR_THRESHOLD = 0.25;

/**
 * A short, honest phrase for the right-deck footer.
 *
 * Returns one of:
 *   `NEXT $1.00M`   — the next threshold, and how far away it is
 *   `$250.00K TO GO` — inside the last quarter; the shortfall reads as urgent
 *   `MAX PHASE`     — the ladder is exhausted
 *   `CASH REQUIRED` — the player is below zero, which the bailout owns
 */
export function readPhaseProgress(phase: GamePhase, cash: number): string {
  const next = PHASE_CASH_THRESHOLDS[(phase + 1) as GamePhase];
  if (next === undefined) return 'MAX PHASE';
  if (cash < 0) return 'CASH REQUIRED';

  // INVARIANT: [Never Print A Negative Shortfall]
  // `nextPhaseFor` promotes on the tick, so a player can hold more cash than
  // the NEXT threshold for a frame before `phase` catches up. Taking the
  // near-threshold branch on that frame rendered a literal "-$28.96M TO GO"
  // into a permanent on-screen strip. Clamping keeps the two sources of truth
  // independent of each other's update timing.
  const shortfall = Math.max(0, next - cash);
  if (cash >= next * (1 - NEAR_THRESHOLD)) return `${formatCurrency(shortfall)} TO GO`;
  return `NEXT ${formatCurrency(next)}`;
}
