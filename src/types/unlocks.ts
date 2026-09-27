/**
 * Unlocks & Console Domain Types
 * Defines channels for Left/Right cockpit wings and Oligarch Lobbying Upgrades.
 */

export type LeftChannelTab = 'stocks' | 'polygrift' | 'radar';
export type RightChannelTab = 'dump' | 'unlocks' | 'tariffs' | 'caymans';

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
