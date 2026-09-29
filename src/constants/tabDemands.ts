/**
 * Sealed Tab Demands — the copy shown on a cockpit channel you have not opened yet.
 *
 * DESIGN RATIONALE [The Phantom Wings]:
 * Both cockpit panes used to FILTER locked tabs out of the strip entirely. A new
 * player's right wing therefore had no tabs at all, and the hotkey dock taught no
 * keys, so the four headline systems — D.U.M.P., Tariffs, Caymans — were named on
 * screen as Career Objectives and were otherwise unreachable. The player was told
 * what the game would eventually become and given no affordance toward it.
 *
 * The fix is the opposite of hiding: every channel is always visible, locked
 * channels are SELECTABLE, and the body renders a demand card naming the exact
 * event that opens it plus a one-line teaser of what is behind the door. The
 * seal is a promise, not a wall.
 *
 * INVARIANT: [Progression Must Be Earned, Not Idle] is UNCHANGED. Selection of a
 * locked channel is now permitted at the store layer, but a locked channel never
 * renders its real body — the pane swaps in <SealedDossier> instead. The gate
 * moved from "you may not look" to "looking costs nothing and buys you nothing".
 * See `unlockEngine.isTabUnlocked` and the render branch in each pane.
 */

import type { LeftChannelTab, RightChannelTab } from '../types/unlocks';

/** A numeric progress reading for demands that are quantifiable. */
export interface DemandProgress {
  readonly current: number;
  readonly target: number;
}

export interface TabDemand {
  /** Printed header on the sealed dossier. */
  readonly title: string;
  /** The single event that opens this channel. Stated as an instruction. */
  readonly requirement: string;
  /** One line of what's behind the door. This is the hook. */
  readonly teaser: string;
  /**
   * Optional live progress reading. Only supply this where the gate is a number
   * the player can watch; event gates (first YAP, first liquidation) have no
   * meaningful 0-1 bar and would read as a fake progress meter.
   */
  readonly progress?: (s: { treasuryCash: number }) => DemandProgress;
}

export const LEFT_TAB_DEMANDS: Record<LeftChannelTab, TabDemand> = {
  stocks: {
    title: 'BagHolder Pro // Restricted Terminal',
    requirement: 'Slam the customs stamp once.',
    teaser: '0DTE puts and calls against every sector on the board. The whole game starts here.',
  },
  radar: {
    title: 'S.L.O.P. Radar // Sealed Frequency',
    requirement: 'Launch your first 3:00 AM YAP.',
    teaser: 'Live surveillance on how obvious you are. Suspicion heat, raid timers, walk-back windows.',
  },
  polygrift: {
    title: 'PolyGrift Exchange // Prediction Markets',
    requirement: 'Settle a put you aimed with a YAP.',
    teaser: 'Fade the crowd before it figures out what you already posted at 3:00 AM.',
  },
};

/**
 * Tells `Record` to omit the always-open room so the type keeps its exhaustiveness
 * check on the four channels that can actually seal. A missing key would be a
 * compile error; a placeholder key would be a lie waiting to be rendered.
 */
type SealableRightTab = Exclude<RightChannelTab, 'brief'>;

export const RIGHT_TAB_DEMANDS: Record<SealableRightTab, TabDemand> = {
  dump: {
    title: 'D.U.M.P. // Federal Liquidation Authority',
    requirement: 'Cross $1,000,000 in the treasury.',
    teaser: 'The chainsaw list. Sign a hatchet order on a federal agency for instant cash and a permanent perk.',
    progress: (s) => ({ current: s.treasuryCash, target: 1_000_000 }),
  },
  unlocks: {
    title: 'Oligarch Lobby // Upgrade Shop',
    requirement: 'Liquidate your first agency.',
    teaser: 'Permanent multipliers: heavier nibs, autopen interns, darkpool fiber, a daylight money printer.',
  },
  tariffs: {
    title: 'Bilateral Tariff Dials // Six Hostile Nations',
    requirement: 'Buy your first lobbying upgrade.',
    teaser: 'Screw the export price up or down. Foreign buyers pay you either way. The dials never close.',
  },
  caymans: {
    title: 'Cayman Reorganization // Prestige Desk',
    requirement: 'Move a single bilateral tariff dial.',
    teaser: 'Sovereign Immunity Slips and the walk-back button. Reset the empire, keep the lessons.',
  },
};
