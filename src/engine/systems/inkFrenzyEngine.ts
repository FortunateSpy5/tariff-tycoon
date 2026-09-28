/**
 * Ink & Frenzy Engine — PURE ink stamina and CAPS LOCK FRENZY state machine.
 *
 * INVARIANT: [Headless Game Logic Belongs in src/engine/]
 * No React, no Zustand, no store reads, no audio. This is the most
 * invariant-dense part of the game — the Cooling-Off Protocol, the ink-freeze
 * during frenzy, the dry-nib rules and the jam threshold all interact — and it
 * was previously embedded in a ~140-line `clickDesk` action where a single
 * missing gate would be invisible in review.
 *
 * EXTRACTED FROM `deskSlice.clickDesk` so the rules can be read, reasoned
 * about and tested as a unit rather than inferred from a store mutation.
 *
 * DESIGN INTENT:
 * The clicker needs a "drain" that forces the player to spend, and a
 * "burst" they earn by spending. Ink is the drain (regenerates, costs money to
 * refill). Tantrum is the burst (fills, then grants a frenzy and locks out).
 * The critical property is that the two must never feed each other in a loop.
 */

/** Tantrum meter threshold that triggers CAPS LOCK FRENZY. */
export const FRENZY_THRESHOLD = 100;

export interface InkFrenzyInput {
  /** Current ink (0..maxInk). */
  inkLevel: number;
  /** Current tantrum (0..100). */
  tantrumMeter: number;
  /** Whether a frenzy is currently running. */
  isCapsFrenzy: boolean;
  /** Seconds left on the active frenzy. */
  capsFrenzySecondsRemaining: number;
  /** Seconds left on the post-frenzy lockout. */
  frenzyCooldownSecondsRemaining: number;
  /** Lifetime frenzies triggered. */
  totalFrenziesTriggered: number;
  /** Consecutive dry clicks, used for the jam threshold. */
  dryClicksCount: number;
  /** Ink consumed by this click. */
  inkPerClick: number;
  /** Tantrum added by an inked click. */
  inkedTantrum: number;
  /** Tantrum added by a dry click. */
  dryTantrum: number;
  /** Tantrum added when the Diet Soda Drip upgrade is owned. */
  dietSodaTantrum: number;
  /** Consecutive dry clicks after which the nib jams. */
  dryClickJamThreshold: number;
  /** Frenzy duration in seconds. */
  frenzyDurationSeconds: number;
  /** Whether the Diet Soda Drip upgrade is owned. */
  hasDietSodaDrip: boolean;
}

export interface InkFrenzyResult {
  inkLevel: number;
  tantrumMeter: number;
  /** True when this click pushes the meter over the line and starts a frenzy. */
  triggeredFrenzy: boolean;
  isCapsFrenzy: boolean;
  capsFrenzySecondsRemaining: number;
  frenzyCooldownSecondsRemaining: number;
  totalFrenziesTriggered: number;
  dryClicksCount: number;
  /** True when the nib is dry and this click counted toward the jam threshold. */
  isDry: boolean;
  /** True when the nib is dry AND past the jam threshold. */
  isJammed: boolean;
}

/** True when this click is a dry scratch (no ink available, no frenzy freeze). */
export function isDryClick(inkLevel: number, isCapsFrenzy: boolean): boolean {
  return inkLevel <= 0 && !isCapsFrenzy;
}

/**
 * Advance the ink/frenzy state machine by one click.
 *
 * INVARIANT: [The Cooling-Off Protocol]
 * Tantrum does NOT accumulate during an active frenzy, and cannot accumulate at
 * all while the post-frenzy cooldown runs. Without this gate the meter is
 * already >100% the instant the frenzy timer expires, so frenzy re-triggers on
 * the same frame and uptime approaches 100%.
 *
 * INVARIANT: [Frenzy Does Not Grant Free Ink]
 * Starting a frenzy preserves the current ink rather than refilling it. A free
 * refill would make the frenzy self-sustaining and break the drain.
 *
 * INVARIANT: [A Dry Nib Is a Safety Net, Never the Optimum]
 * A dry click earns a token yield and adds no tantrum, so grinding it can never
 * be better than using ink.
 */
export function clickInkFrenzy(input: InkFrenzyInput): InkFrenzyResult {
  const isDry = isDryClick(input.inkLevel, input.isCapsFrenzy);
  const dryClicksCount = isDry ? input.dryClicksCount + 1 : 0;
  const isJammed = isDry && dryClicksCount >= input.dryClickJamThreshold;

  // --- Tantrum accumulation ---
  let tantrumDelta = 0;
  if (input.isCapsFrenzy || input.frenzyCooldownSecondsRemaining > 0) {
    tantrumDelta = 0;
  } else if (isDry) {
    tantrumDelta = input.dryTantrum;
  } else {
    tantrumDelta = input.hasDietSodaDrip ? input.dietSodaTantrum : input.inkedTantrum;
  }

  let tantrumMeter = input.tantrumMeter + tantrumDelta;
  let isCapsFrenzy = input.isCapsFrenzy;
  let capsFrenzySecondsRemaining = input.capsFrenzySecondsRemaining;
  let frenzyCooldownSecondsRemaining = input.frenzyCooldownSecondsRemaining;
  let totalFrenziesTriggered = input.totalFrenziesTriggered;

  // Ink consumption: normal clicks consume ink; during frenzy ink is infinite.
  let inkLevel = input.isCapsFrenzy ? input.inkLevel : Math.max(0, input.inkLevel - input.inkPerClick);

  // A frenzy may only start when legitimate ink was used AND the post-frenzy
  // lockout has elapsed.
  const triggeredFrenzy =
    tantrumMeter >= FRENZY_THRESHOLD && !input.isCapsFrenzy && !isDry && input.frenzyCooldownSecondsRemaining <= 0;

  if (triggeredFrenzy) {
    isCapsFrenzy = true;
    tantrumMeter = 0;
    capsFrenzySecondsRemaining = input.frenzyDurationSeconds;
    frenzyCooldownSecondsRemaining = 0;
    totalFrenziesTriggered += 1;
    // INVARIANT: frenzy does NOT grant a free 100% refill. Current ink stands.
    inkLevel = input.inkLevel;
  }

  return {
    inkLevel,
    tantrumMeter: Math.min(FRENZY_THRESHOLD, tantrumMeter),
    triggeredFrenzy,
    isCapsFrenzy,
    capsFrenzySecondsRemaining,
    frenzyCooldownSecondsRemaining,
    totalFrenziesTriggered,
    dryClicksCount,
    isDry,
    isJammed,
  };
}

/**
 * Advance the frenzy timer and the post-frenzy lockout by a tick.
 *
 * INVARIANT: the lockout starts the MOMENT frenzy ends, and scales with phase so
 * early game stays snappy while late game makes frenzy precious. While locked
 * out the tantrum meter bleeds off, so the player is never sitting on a full
 * meter the instant the lockout expires (which would instantly re-trigger).
 */
export function tickInkFrenzy(params: {
  isCapsFrenzy: boolean;
  capsFrenzySecondsRemaining: number;
  frenzyCooldownSecondsRemaining: number;
  tantrumMeter: number;
  deltaSeconds: number;
  cooldownByPhase: Record<number, number>;
  cooldownDecayPerSecond: number;
  phase: number;
}): {
  isCapsFrenzy: boolean;
  capsFrenzySecondsRemaining: number;
  frenzyCooldownSecondsRemaining: number;
  tantrumMeter: number;
} {
  const { isCapsFrenzy, cooldownByPhase, cooldownDecayPerSecond, phase, deltaSeconds } = params;

  if (isCapsFrenzy) {
    const remaining = params.capsFrenzySecondsRemaining - deltaSeconds;
    if (remaining > 0) {
      return {
        isCapsFrenzy: true,
        capsFrenzySecondsRemaining: remaining,
        frenzyCooldownSecondsRemaining: params.frenzyCooldownSecondsRemaining,
        tantrumMeter: params.tantrumMeter,
      };
    }
    return {
      isCapsFrenzy: false,
      capsFrenzySecondsRemaining: 0,
      frenzyCooldownSecondsRemaining: cooldownByPhase[phase] ?? 15,
      tantrumMeter: params.tantrumMeter,
    };
  }

  if (params.frenzyCooldownSecondsRemaining > 0) {
    const remaining = params.frenzyCooldownSecondsRemaining - deltaSeconds;
    if (remaining <= 0) {
      return {
        isCapsFrenzy: false,
        capsFrenzySecondsRemaining: 0,
        frenzyCooldownSecondsRemaining: 0,
        tantrumMeter: 0,
      };
    }
    return {
      isCapsFrenzy: false,
      capsFrenzySecondsRemaining: 0,
      frenzyCooldownSecondsRemaining: remaining,
      tantrumMeter: Math.max(0, params.tantrumMeter - cooldownDecayPerSecond * deltaSeconds),
    };
  }

  return {
    isCapsFrenzy: false,
    capsFrenzySecondsRemaining: params.capsFrenzySecondsRemaining,
    frenzyCooldownSecondsRemaining: 0,
    tantrumMeter: params.tantrumMeter,
  };
}
