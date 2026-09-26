/**
 * Desk & Clicker Domain Types
 * Defines states for Phase 1 (Airport Rubber Stamp) and Phase 2+ (Oval Office Golden Sharpie).
 */

export type GamePhase = 1 | 2 | 3 | 4;

export interface DeskState {
  /** Current evolutionary phase (1: Customs, 2: Oval, 3: Fortress, 4: Ontological) */
  phase: GamePhase;

  /** Total manual clicks executed across all sessions */
  totalClicks: number;

  /** Current ink level (0 to 100). When 0, enters "Desperation Dry Nib" state */
  inkLevel: number;

  /** Maximum ink capacity */
  maxInk: number;

  /** Number of times ink has been manually refilled (determines refill cost) */
  inkRefillCount: number;

  /** Tantrum meter (0 to 100). Fills on manual taps; triggers CAPS LOCK FRENZY at 100 */
  tantrumMeter: number;

  /** Whether the Dealmaker is currently in CAPS LOCK FRENZY mode */
  isCapsFrenzy: boolean;

  /** Remaining seconds in active CAPS LOCK FRENZY */
  capsFrenzySecondsRemaining: number;

  /** Total frenzy triggers across playthrough */
  totalFrenziesTriggered: number;
}
