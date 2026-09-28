/**
 * Crisis Call — PURE escalation logic.
 *
 * INVARIANT: [Headless Game Logic Belongs in src/engine/]
 * This module must stay free of React, Zustand, audio and store imports. It is
 * the testable core of the Crisis Call: given the current crisis and the elapsed
 * time, what is the next state? Extracting it is what made the crisis mechanic
 * reviewable in isolation instead of buried 600 lines into a slice.
 *
 * KaTeX: T_{tier} = \min\left(4, \left\lfloor \frac{t}{t_{window}} \cdot 5 \right\rfloor \right)
 */

import {
  CRISIS_BOOK,
  CRISIS_INTERVAL_BY_PHASE,
  CRISIS_TIER_MULTIPLIERS,
  CRISIS_WINDOW_SECONDS,
  crisisBasePayoutForPhase,
  crisisTierForElapsed,
  type CrisisSeverity,
} from '../../constants/crisis';
import type { GamePhase } from '../../types/desk';

// Re-exported so store slices have a single import site for crisis logic and
// never reach into constants/ for the tier maths directly.
export { crisisTierForElapsed };

/** A crisis in flight on the Red Phone dial. */
export interface ActiveCrisis {
  id: string;
  /** Seconds the crisis has been ringing. Drives the escalation tier. */
  elapsedSeconds: number;
}

/** The resolved outcome of one tick of the crisis lifecycle. */
export interface CrisisTickResult {
  activeCrisis: ActiveCrisis | null;
  crisisCooldownSeconds: number;
  /** True when a live crisis expired unanswered and resolved as a suppression. */
  autoSuppressed: boolean;
}

/** Seconds until the next crisis spawns at the given phase. */
export function crisisIntervalForPhase(phase: GamePhase): number {
  return CRISIS_INTERVAL_BY_PHASE[phase] ?? 45;
}

/** Payout for swearing into a crisis at its current elapsed time. */
export function crisisPayout(phase: GamePhase, elapsedSeconds: number): number {
  const tier = crisisTierForElapsed(elapsedSeconds);
  return Math.round(crisisBasePayoutForPhase(phase) * CRISIS_TIER_MULTIPLIERS[tier]);
}

/** Severity label for the current tier, for the desk notice copy. */
export function crisisSeverityAt(elapsedSeconds: number): CrisisSeverity {
  const def = CRISIS_BOOK.find((c) => c.tiers[crisisTierForElapsed(elapsedSeconds)]);
  return def ? def.tiers[crisisTierForElapsed(elapsedSeconds)].severity : 'WHISPER';
}

/**
 * Advance the crisis lifecycle by `deltaSeconds`.
 *
 * INVARIANT: an ignored crisis resolves as a SUPPRESSION — no payout and no
 * heat, but the tantrum it would have fed is forfeited. The caller is
 * responsible for incrementing `totalCrisesSuppressed` when
 * `autoSuppressed` is true.
 *
 * INVARIANT: the phone only rings one crisis at a time. Spawning is gated on
 * `activeCrisis === null`, so a fast tick can never stack two crises onto the
 * same dial.
 *
 * `rand` is injected rather than called inline so the function stays
 * deterministic and testable; pass `Math.random` in production.
 */
export function tickCrisis(
  activeCrisis: ActiveCrisis | null,
  crisisCooldownSeconds: number,
  deltaSeconds: number,
  phase: GamePhase,
  rand: () => number = Math.random
): CrisisTickResult {
  if (activeCrisis) {
    const nextElapsed = activeCrisis.elapsedSeconds + deltaSeconds;
    if (nextElapsed >= CRISIS_WINDOW_SECONDS) {
      return {
        activeCrisis: null,
        crisisCooldownSeconds: crisisIntervalForPhase(phase),
        autoSuppressed: true,
      };
    }
    return {
      activeCrisis: { ...activeCrisis, elapsedSeconds: nextElapsed },
      crisisCooldownSeconds,
      autoSuppressed: false,
    };
  }

  const cooldown = crisisCooldownSeconds - deltaSeconds;
  if (cooldown > 0) {
    return { activeCrisis: null, crisisCooldownSeconds: cooldown, autoSuppressed: false };
  }

  const def = CRISIS_BOOK[Math.floor(rand() * CRISIS_BOOK.length)];
  return {
    activeCrisis: { id: def.id, elapsedSeconds: 0 },
    crisisCooldownSeconds: crisisIntervalForPhase(phase),
    autoSuppressed: false,
  };
}
