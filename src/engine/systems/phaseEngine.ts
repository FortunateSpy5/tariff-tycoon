/**
 * Phase Engine — PURE evolutionary phase progression.
 *
 * INVARIANT: [Headless Game Logic Belongs in src/engine/]
 * No React, no Zustand, no store reads, no audio.
 *
 * INVARIANT: [One Definition Of The Phase Ladder]
 * The phase thresholds were previously duplicated verbatim in TWO places —
 * `clickDesk` and `tickDesk` — because both paths add cash. That is a live
 * duplication hazard: a designer tuning the Oval Office threshold would have had
 * to find both, and a miss would make manual clicking and passive income
 * promote the player at different rates. The ladder now lives here once, and
 * both callers ask the same function.
 *
 * KaTeX: \phi_{next} = \min\left(4,\ \phi + \mathbb{1}\left[\text{cash} \ge T_{\phi}\right]\right)
 *
 * The 4-phase arc (AGENTS.md):
 *   1 Customs Desk      $0      -> $1M
 *   2 Oval Syndicate    $1M     -> $100B
 *   3 Fortress America  $100B   -> $10^18
 *   4 Ontological       $10^18  -> $10^42
 */

import type { GamePhase } from '../../types/desk';

/**
 * Treasury cash required to enter each phase, indexed by the phase it unlocks.
 * Phase 1 has no entry because it is the starting phase.
 */
export const PHASE_CASH_THRESHOLDS: Partial<Record<GamePhase, number>> = {
  2: 1_000_000, // $1M
  3: 100_000_000_000, // $100B
  4: 1e18,
};

/* `MAX_PHASE` was removed here. It was exported but never read; the final phase
   is expressed by the Phase 4 threshold above, and adding a fifth phase means
   adding a threshold, not a redundant ceiling constant. */

/**
 * Resolve the next phase from the current phase and total cash.
 *
 * INVARIANT: returns `currentPhase` unchanged when the threshold is not met, so
 * a single step of one phase is the most that can ever happen per call. This
 * means both callers behave identically whether cash arrives in one lump
 * (passive tick) or in many small increments (manual clicking) — a player
 * cannot skip a phase by earning fast, and cannot be stuck if they earn slow.
 */
export function nextPhaseFor(currentPhase: GamePhase, cash: number): GamePhase {
  const threshold = PHASE_CASH_THRESHOLDS[(currentPhase + 1) as GamePhase];
  if (threshold !== undefined && cash >= threshold) {
    return (currentPhase + 1) as GamePhase;
  }
  return currentPhase;
}

/** True when this transition should play the promotion chime. */
export function isPhasePromotion(from: GamePhase, to: GamePhase): boolean {
  return to > from;
}
