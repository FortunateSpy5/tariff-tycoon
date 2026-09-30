/**
 * Passive Rate Constants — the autopen interns' pay rate, in one place.
 *
 * WHY THIS IS EXTRACTED FROM `passiveEngine`
 * The autopen rate was three private constants inside the engine, and the only
 * consumer was the accrual itself. Phase 2.5 needs to RENDER that rate, and the
 * repo's standing rule is that a number shown to a player is computed from the
 * same constant the simulation charges — a re-typed `$50` beside an engine that
 * computes `$50` is a lie waiting for a balance pass, with no type error and no
 * test to catch it.
 *
 * The extraction is the fix, not a refactor for its own sake: the readout and the
 * engine now import one value.
 */

/** Clicks per second contributed by the AI Autopen Interns upgrade. */
export const AUTOPEN_CLICKS_PER_SECOND = 5;

/** Base value of one autopen click in Phase 1. */
export const AUTOPEN_BASE_PHASE_1 = 5.0;

/** Base value of one autopen click in Phase 2 and beyond. */
export const AUTOPEN_BASE_PHASE_2_PLUS = 50.0;

/**
 * The base value of one autopen click at a given phase.
 *
 * INVARIANT: [The Autopen Ignores Your Multipliers, On Purpose]
 * This is a FLAT rate. It does not scale with the Tungsten Nib, the Sovereign
 * Immunity Slips, the phase tap multiplier, or the Flash Dip — the upgrade's own
 * card says so, and `tickPassiveEconomy` has always paid it this way. Any UI that
 * shows this figure must show it flat, or it will overstate the upgrade by up to
 * 20x for a late-game player and the error will be entirely in the game's
 * favour.
 */
export function autopenBaseValueForPhase(phase: number): number {
  return phase === 1 ? AUTOPEN_BASE_PHASE_1 : AUTOPEN_BASE_PHASE_2_PLUS;
}
