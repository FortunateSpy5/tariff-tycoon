/**
 * Onboarding & Practice Stakes
 *
 * DESIGN RATIONALE [The Ten-Minute Wall]:
 * The original build gated the entire causal loop (open PUT -> fire YAP ->
 * sector crashes -> settle) behind $10,000 of manual clicking — roughly 2,000
 * stamp slams. That is the game's actual subject, hidden behind its least
 * interesting verb. A player who bounced in the first three minutes never saw
 * the premise; the premise *is* the product.
 *
 * Two changes fix it without breaking the economy:
 *   1. BagHolder Pro and YAP unlock on the FIRST SLAM, not at $10,000.
 *   2. The player's first few contracts are PAPER TRADES. Losses are refunded,
 *      so the player learns the verb at zero financial risk. Wins pay out for
 *      real, so the causal loop still feels money-making.
 *
 * The $10,000 threshold is preserved as a real milestone: it is now what
 * unlocks PHASE 2's companion system, not the market.
 */

/** Number of option contracts the player may open as risk-free paper trades. */
export const PAPER_TRADE_ALLOWANCE = 3;

/** Tremors of tantrum granted for landing a profitable paper trade (rewards good timing). */
export const PAPER_TRADE_WIN_TANTRUM = 8;

export type TutorialEvent =
  | 'first_slam'
  | 'market_opened'
  | 'first_yap'
  | 'first_settle'
  | 'tantrum_filled'
  | 'phase2_reached';

export interface TutorialStep {
  /** Index into the ordered chain. */
  readonly id: number;
  /** Short imperative headline, e.g. "SLAM THE STAMP". */
  readonly title: string;
  /** The body copy that teaches the mechanic. Written in the game's voice. */
  readonly body: string;
  /** Which cockpit wing holds the widget being taught. */
  readonly focus: 'desk' | 'left' | 'right';
  /** Optional key that advances / acknowledges this step. */
  readonly hotkey?: string;
  /** Whether the step auto-advances on its event, or waits for a click. */
  readonly mode: 'auto' | 'manual';
}

export const TUTORIAL_CHAIN: readonly TutorialStep[] = [
  {
    id: 0,
    title: 'Slam The Stamp',
    body: 'Gate 99B is yours. Confiscate brie, contraband avionics, and anything else that snuck through customs. The ink is your stamina — run dry and the stamp jams.',
    focus: 'desk',
    mode: 'auto',
  },
  {
    id: 1,
    title: 'Open A Paper Put',
    body: 'BagHolder Pro is live on your first slam. Pick a ticker and SHORT a PUT. The next three contracts are PAPER TRADES — if you are wrong, you lose nothing. Learn the verb first.',
    focus: 'left',
    hotkey: '1',
    mode: 'auto',
  },
  {
    id: 2,
    title: 'Launch A 3:00 AM YAP',
    body: 'Now break the thing you just bet against. Target your ticker and fire a lethal YAP. Sector craters within seconds. This is the entire game.',
    focus: 'desk',
    hotkey: 'Y',
    mode: 'auto',
  },
  {
    id: 3,
    title: 'Settle The Contract',
    body: 'Settle the PUT and bank the crash. Payout scales with leverage and with VEX volatility — a YAP spikes VEX, so the same crash pays more right after you post.',
    focus: 'left',
    mode: 'auto',
  },
  {
    id: 4,
    title: 'You Own The Loop Now',
    body: 'Keep YAPing, keep front-running yourself, and keep the S.L.O.P. Radar below zero suspicion. The Oval Office and the D.U.M.P. liquidation tree open at $1,000,000.',
    focus: 'desk',
    mode: 'manual',
  },
] as const;

/** Milestones surfaced in the right pane once the tutorial is complete. */
export interface Objective {
  readonly id: string;
  readonly label: string;
  readonly detail: string;
  readonly target: number;
  /** Reads a live value out of the store to compare against `target`. */
  readonly read: (s: {
    treasuryCash: number;
    phase: number;
    totalFrenziesTriggered: number;
    totalCrisesAnswered: number;
    activeUpgrades: string[];
    slopSuspicion: number;
  }) => number;
}

export const CAREER_OBJECTIVES: readonly Objective[] = [
  {
    id: 'oval',
    label: 'The Oval Office',
    detail: 'Cross the motorcade threshold. Unlocks the D.U.M.P. liquidation tree.',
    target: 1_000_000,
    read: (s) => s.treasuryCash,
  },
  {
    id: 'frenzy',
    label: 'First CAPS LOCK FRENZY',
    detail: 'Fill the tantrum meter to 100% to earn a 10x click burst.',
    target: 1,
    read: (s) => s.totalFrenziesTriggered,
  },
  {
    id: 'crisis',
    label: 'Answer The Red Phone',
    detail: 'Swear in on a crisis. Higher severity tiers pay up to 10x.',
    target: 1,
    read: (s) => s.totalCrisesAnswered,
  },
  {
    id: 'liquidation',
    label: 'Liquidate An Agency',
    detail: 'Sign a D.U.M.P. hatchet order for instant cash and a permanent perk.',
    target: 1,
    read: (s) => s.activeUpgrades.length,
  },
] as const;
