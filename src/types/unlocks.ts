/**
 * Unlocks & Console Domain Types
 * Defines channels for Left/Right cockpit wings and Oligarch Lobbying Upgrades.
 */

export type LeftChannelTab = 'stocks' | 'polygrift' | 'radar';
/**
 * Right deck channels.
 *
 * INVARIANT: membership is NOT an unlock. A channel may be selected while sealed;
 * the pane then renders a `SealedDossier` instead of the channel body. See
 * [The Seal Is a Promise, Not a Wall] in `constants/tabDemands`.
 */
/**
 * 'brief' is the always-open Situation Room (tutorial directive + Career
 * Objectives). It is not a gated channel and never seals — it is the room you
 * stand in while the others are still locked. See `isRightTabUnlocked`.
 */
export type RightChannelTab = 'brief' | 'dump' | 'unlocks' | 'tariffs' | 'caymans';

export interface CronyUpgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
  multiplierType: 'click' | 'autopen' | 'tantrum' | 'darkpool' | 'moneyprinter';
  value: number;
}

export interface PolyGriftBet {
  id: string;
  title: string;
  oddsYes: number;
  oddsNo: number;
  probYes: number;
}
