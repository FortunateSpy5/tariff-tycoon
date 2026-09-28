/**
 * CRISIS CALL — The 3:00 AM BAILOUT DIAL
 *
 * Phase 1's dedicated interactive mechanic, built around the Red Rotary Phone.
 *
 * THESIS: an idle game needs a decision that costs nothing to *consider* but
 * something to *ignore*. The clicker alone is a pure optimisation problem (click
 * faster, buy faster). The Crisis Call adds a wager the player can decline:
 * a crisis is always ticking toward zero, and answering it early — before it
 * escalates — pays a progressively larger multiple.
 *
 * LOOP:
 *   1. A crisis spawns on a timer. The phone starts RINGING.
 *   2. The crisis escalates through severity tiers; the ring gets more urgent
 *      and the headline gets worse.
 *   3. The player may SWEAR IN (answer early, small payout, low heat) or
 *      LET IT RING (wait for max escalation, large payout, big heat).
 *   4. Ignoring it entirely lets the crisis resolve as a SUPPRESSED FAILURE
 *      (no payout, no heat, but you forfeit the tantrum it was feeding).
 *
 * The Red Phone is folded in: rather than a separate "only works if you are
 * broke" bailout prop, the phone IS this dial. The old dead-on-arrival
 * `$10 bail-out` trigger is preserved as the suppressed-failure consolation.
 */

import type { GamePhase } from '../types/desk';

/** Seconds between crisis spawns at Phase 1. */
export const CRISIS_INTERVAL_BY_PHASE: Record<number, number> = {
  1: 45,
  2: 70,
  3: 100,
  4: 140,
};

/** Seconds a crisis stays answerable before it resolves as a suppression. */
export const CRISIS_WINDOW_SECONDS = 30;

/**
 * Payout multiple by escalation tier. Index 0 is the first tier the player can
 * answer; the last index is answering at maximum severity.
 */
export const CRISIS_TIER_MULTIPLIERS = [1.5, 2.5, 4, 6.5, 10] as const;

/** Flat base payout for a single crisis, before the tier multiplier. */
export const CRISIS_BASE_PAYOUT = 400;

/** S.L.O.P. heat added per escalation tier answered. Swear in fast = low heat. */
export const CRISIS_HEAT_PER_TIER = 4;

/** Tantrum awarded for answering a crisis, feeding toward CAPS LOCK FRENZY. */
export const CRISIS_TANTRUM_REWARD = 12;

export type CrisisSeverity = 'WHISPER' | 'CONCERN' | 'PROTEST' | 'EMERGENCY' | 'CIVIL WAR';

export interface CrisisTier {
  severity: CrisisSeverity;
  headline: string;
  /** 0..4 — the index into CRISIS_TIER_MULTIPLIERS. */
  tier: number;
}

export interface CrisisDefinition {
  id: string;
  tiers: CrisisTier[];
}

/**
 * The Crisis Call book. All names use the canonical parody roster per
 * AGENTS.md — no real governments, agencies, or persons.
 */
export const CRISIS_BOOK: CrisisDefinition[] = [
  {
    id: 'canada_brie',
    tiers: [
      { severity: 'WHISPER', tier: 0, headline: 'Customs audit of the Great Northern Annex maple brie inventory.' },
      { severity: 'CONCERN', tier: 1, headline: 'The Moose Republic demands a full brie apology on live television.' },
      { severity: 'PROTEST', tier: 2, headline: 'Maple syrup blockade at every border crossing. Trucks reversing.' },
      { severity: 'EMERGENCY', tier: 3, headline: 'The Annex has frozen all dairy exports pending a dunk-cap summit.' },
      { severity: 'CIVIL WAR', tier: 4, headline: 'Full Annex–Federation trade war. Brie futures halted. Cheese markets in shambles.' },
    ],
  },
  {
    id: 'nearshore_chips',
    tiers: [
      { severity: 'WHISPER', tier: 0, headline: 'MacroSoft Cloud quietly moves its fabs offshore.' },
      { severity: 'CONCERN', tier: 1, headline: 'The Nearshore Federation subpoenaed for "unpatriotic tap water."' },
      { severity: 'PROTEST', tier: 2, headline: 'Semiconductor export licenses frozen. Every laptop delayed by a season.' },
      { severity: 'EMERGENCY', tier: 3, headline: 'The Red Factory retaliates. Two-nation chip cold war begins.' },
      { severity: 'CIVIL WAR', tier: 4, headline: 'Total decoupling. Silicon Archipelago declares independence mid-quarter.' },
    ],
  },
  {
    id: 'union_soda',
    tiers: [
      { severity: 'WHISPER', tier: 0, headline: 'Overthinker Union circulation drops below viability.' },
      { severity: 'CONCERN', tier: 1, headline: 'The Union forms a task force. The task force forms a sub-task force.' },
      { severity: 'PROTEST', tier: 2, headline: 'Ninety-seven task forces and still no soda tax repealed.' },
      { severity: 'EMERGENCY', tier: 3, headline: 'The Overthinker Union declares a "study" on your entire presidency.' },
      { severity: 'CIVIL WAR', tier: 4, headline: 'Union publishes a 4,000-page report. Nobody reads it. Nobody has to. Sanctions land anyway.' },
    ],
  },
  {
    id: 'fruit_ecosystem',
    tiers: [
      { severity: 'WHISPER', tier: 0, headline: 'Fruit Ecosystem Inc. recalls a "minor" batch of Avocados.' },
      { severity: 'CONCERN', tier: 1, headline: 'The Strike Republic demands to know why your avocados are "structurally disrespectful."' },
      { severity: 'PROTEST', tier: 2, headline: 'Avocado strike. Grocery aisles empty. Guacamole futures spike.' },
      { severity: 'EMERGENCY', tier: 3, headline: 'The Strike Republic seizes the ports. Ship queues visible from orbit.' },
      { severity: 'CIVIL WAR', tier: 4, headline: 'Full produce cold war. Avocados reclassified as a strategic asset.' },
    ],
  },
  {
    id: 'bailout_bank',
    tiers: [
      { severity: 'WHISPER', tier: 0, headline: 'GigaFlex Motors requests a "modest" bridge loan.' },
      { severity: 'CONCERN', tier: 1, headline: 'DoorPlug Dynamics downgrades its own credit. Analysts are confused.' },
      { severity: 'PROTEST', tier: 2, headline: 'Both firms threaten to "relocate jobs" to the Nearshore Federation.' },
      { severity: 'EMERGENCY', tier: 3, headline: 'Congress opens a bailout inquiry. You are called to testify at 3:00 AM.' },
      { severity: 'CIVIL WAR', tier: 4, headline: 'Two automakers merge in a panic merger, creating a company with one wheel and no steering wheel.' },
    ],
  },
];

/** Resolve the escalation tier for an elapsed crisis. */
export function crisisTierForElapsed(elapsedSeconds: number): number {
  const window = Math.max(1, CRISIS_WINDOW_SECONDS);
  const progress = Math.min(1, Math.max(0, elapsedSeconds / window));
  return Math.min(CRISIS_TIER_MULTIPLIERS.length - 1, Math.floor(progress * CRISIS_TIER_MULTIPLIERS.length));
}

/** Seconds the player should wait to reach the next escalation tier. */
export function secondsToNextTier(elapsedSeconds: number): number {
  const tier = crisisTierForElapsed(elapsedSeconds);
  const nextStart = ((tier + 1) / CRISIS_TIER_MULTIPLIERS.length) * CRISIS_WINDOW_SECONDS;
  return Math.max(0, Math.ceil(nextStart - elapsedSeconds));
}

/** Base payout scaled by the current phase so the dial stays relevant later. */
export function crisisBasePayoutForPhase(phase: GamePhase): number {
  const phaseScale: Record<number, number> = { 1: 1, 2: 12, 3: 140, 4: 1800 };
  return CRISIS_BASE_PAYOUT * (phaseScale[phase] ?? 1);
}
