/**
 * Onboarding Engine — PURE first-slam and tutorial-termination rules.
 *
 * INVARIANT: [Headless Game Logic Belongs in src/engine/]
 * No React, no Zustand, no store reads, no audio.
 *
 * The onboarding rules were previously inline in BOTH `deskSlice.clickDesk` and
 * `deskSlice.tickDesk`, and the long invariant comments explaining WHY they
 * existed were duplicated with them. That is how a 12-line rule accumulates 30
 * lines of prose in two files and drifts.
 *
 * INVARIANT: [The Ten-Minute Wall]
 * BagHolder Pro + YAP unlock on the VERY FIRST SLAM, not at a cash threshold.
 * The causal shorting loop IS the game's subject; hiding it behind thousands of
 * clicks of the weakest verb meant most players never saw the premise.
 * `hasMarketAccess` used to be a cash threshold — it is now an event.
 *
 * INVARIANT: onboarding gates on the tutorial INDEX, NEVER on
 * `totalClicks === 0`. A save that already contains clicks (an interrupted
 * session, a migrated save, a player who skipped onboarding) would otherwise be
 * permanently stuck on step 1 with no way forward. Keying off the index makes
 * every advance idempotent and self-healing.
 *
 * INVARIANT: [Only A Real Slam Advances The Chain]
 * `resolveTutorialIndex` applies the first-slam rule, so it may ONLY be called
 * from `clickDesk`. The passive paths — `tickDesk` (every 100 ms) and
 * `creditOfflineEarnings` — must use `resolvePassiveTutorialIndex`, which can
 * only terminate onboarding at Phase 2.
 *
 * This was a HARD SOFT-LOCK, not a cosmetic bug. `tickDesk` shares one rule
 * resolver with `clickDesk`, so the first passive frame after page load consumed
 * the first-slam token. `resolveMarketAccess` then saw a non-first-slam index on
 * every subsequent click and left `hasMarketAccess` false forever. A new player
 * was told "STEP 2/5 // OPEN A PAPER PUT" by the directive card while the very
 * channel it points at rendered "SLAM THE STAMP ONCE TO UNSEAL BAGHOLDER PRO" —
 * and clicking could never satisfy it. The causal shorting loop, the game's
 * entire premise, was unreachable until the player reloaded the page (the
 * `onRehydrateStorage` totalClicks > 0 repair masked it on the second load).
 *
 * INVARIANT: [Onboarding Must Always Terminate]
 * The final tutorial step is manual ("Seal It"). If a player ignores it, the
 * directive card would sit above the objectives forever. Reaching the Oval
 * Office is proof the player understood the loop, so promote them past
 * onboarding automatically. Never nag a player who has demonstrably graduated.
 *
 * This applies on EVERY cash-gain path — manual clicking, passive tick, and
 * offline credit — because a player can reach Phase 2 while the tab is shut.
 */

import { TUTORIAL_CHAIN } from '../../constants/onboarding';
import type { GamePhase } from '../../types/desk';

/** True when this is the player's very first slam of the run. */
export function isFirstSlam(tutorialStepIndex: number): boolean {
  return tutorialStepIndex === 0;
}

/** Advance past a manual tutorial step, clamped so it can never wrap to 0. */
export function advanceTutorialIndex(current: number): number {
  return Math.min(TUTORIAL_CHAIN.length, current + 1);
}

/** Index that marks onboarding as permanently complete. */
export function completedTutorialIndex(): number {
  return TUTORIAL_CHAIN.length;
}

/**
 * Resolve the tutorial index on a PASSIVE cash-gain path (idle tick, offline
 * credit). Passive income may only TERMINATE onboarding at Phase 2 — it can
 * never advance it past a step the player has not performed.
 *
 * See [Only A Real Slam Advances The Chain].
 */
export function resolvePassiveTutorialIndex(nextPhase: GamePhase, currentIndex: number): number {
  if (nextPhase >= 2 && currentIndex < TUTORIAL_CHAIN.length) {
    return TUTORIAL_CHAIN.length;
  }
  return currentIndex;
}

/**
 * Resolve the tutorial index after a MANUAL slam.
 *
 * @param nextPhase The phase the player is in AFTER the gain.
 * @param currentIndex The tutorial index BEFORE the gain.
 */
export function resolveTutorialIndex(nextPhase: GamePhase, currentIndex: number): number {
  // Graduating to the Oval Office ends onboarding for good.
  if (nextPhase >= 2 && currentIndex < TUTORIAL_CHAIN.length) {
    return TUTORIAL_CHAIN.length;
  }
  // Otherwise, the first slam advances one step. Never wraps, never decrements.
  if (isFirstSlam(currentIndex)) return 1;
  return currentIndex;
}

/**
 * Resolve market access after a cash-gain event.
 *
 * INVARIANT: passive income must NEVER open the terminal. Only a real slam may,
 * so a player who idles to the old threshold does not get a market they were
 * never taught to use.
 */
export function resolveMarketAccess(currentAccess: boolean, currentIndex: number): boolean {
  return currentAccess || isFirstSlam(currentIndex);
}
